const { Invoice, Payment, Client, Case, User, FinancialEntry, InvoiceLine } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { sendInvoiceCreated } = require('../utils/emailService');

const INVOICE_STATUSES = ['draft', 'sent', 'partially_paid', 'paid', 'overdue', 'cancelled'];

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

exports.createInvoice = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    let invoiceNumber = req.body.invoiceNumber;
    if (!invoiceNumber) {
      const year = new Date().getFullYear();
      const count = await Invoice.count({ transaction: t });
      invoiceNumber = `INV-${year}-${String(count + 1).padStart(4, '0')}`;
    }

    const taxRate = parseFloat(req.body.taxRate) || 0;
    const discount = parseFloat(req.body.discount) || 0;
    const status = ['draft', 'sent'].includes(req.body.status) ? req.body.status : 'draft';

    const rawLines = Array.isArray(req.body.lines) ? req.body.lines : [];
    let linesTotal = 0;
    const lines = rawLines.map(l => {
      const amount = parseFloat(l.amount ?? 0);
      linesTotal += amount;
      return {
        description: l.description || 'قيد',
        quantity: parseInt(l.quantity) || 1,
        unitPrice: parseFloat(l.unitPrice ?? amount),
        amount,
        sourceType: l.sourceType || null,
        sourceId: l.sourceId ? parseInt(l.sourceId) : null
      };
    });

    let subtotal = parseFloat(req.body.totalAmount);
    if (!subtotal && linesTotal) {
      subtotal = linesTotal;
    }
    if (!subtotal) {
      subtotal = parseFloat(req.body.amount) || 0;
    }
    subtotal = subtotal || 0;
    const taxAmount = Math.round(((subtotal - discount) * (taxRate / 100)) * 1000) / 1000;
    const totalAmount = Math.round((subtotal - discount + taxAmount) * 1000) / 1000;

    // Duplicate-invoice prevention: reject entries already linked to another invoice
    for (const line of lines) {
      if (!line.sourceId) continue;
      const linked = await InvoiceLine.findOne({
        where: { sourceType: line.sourceType, sourceId: line.sourceId },
        transaction: t
      });
      if (linked) {
        throw new HttpError(400, 'أحد البنود مدرج مسبقاً في فاتورة أخرى');
      }
      const entry = await FinancialEntry.findByPk(line.sourceId, { transaction: t });
      if (entry && entry.billingStatus !== 'unbilled') {
        throw new HttpError(400, 'أحد البنود تمت فوترته أو دفعه مسبقاً');
      }
    }

    const invoice = await Invoice.create({
      ...req.body,
      invoiceNumber,
      totalAmount,
      taxAmount,
      status,
      paidAmount: 0
    }, { transaction: t });

    for (const line of lines) {
      await InvoiceLine.create({ ...line, invoiceId: invoice.id }, { transaction: t });
      if (line.sourceId) {
        await FinancialEntry.update(
          { billingStatus: 'invoiced' },
          { where: { id: line.sourceId }, transaction: t }
        );
      }
    }

    await t.commit();

    if (status === 'sent' && req.body.clientId) {
      const client = await Client.findByPk(req.body.clientId);
      const assignedUser = await User.findByPk(req.user.id);
      if (assignedUser && assignedUser.email) {
        await sendInvoiceCreated(assignedUser, invoice, client);
      }
    }

    res.status(201).json({ message: 'تم إنشاء الفاتورة بنجاح', invoice });
  } catch (error) {
    await t.rollback();
    console.error('Create invoice error:', error);
    if (error instanceof HttpError) {
      return res.status(error.status).json({ error: error.message });
    }
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map(e => e.message).join(', ');
      return res.status(400).json({ error: 'خطأ في البيانات', details: messages });
    }
    res.status(500).json({ error: 'خطأ في إنشاء الفاتورة', details: error.message });
  }
};

exports.getInvoices = async (req, res) => {
  try {
    const {
      status, clientId, caseId, type,
      dateFrom, dateTo,
      page = 1, limit = 10,
      sortBy = 'createdAt', sortOrder = 'DESC'
    } = req.query;

    const where = {};

    if (status) where.status = status;
    if (clientId) where.clientId = clientId;
    if (caseId) where.caseId = caseId;
    if (type) where.type = type;

    if (dateFrom || dateTo) {
      where.issuedDate = {};
      if (dateFrom) where.issuedDate[Op.gte] = dateFrom;
      if (dateTo) where.issuedDate[Op.lte] = dateTo;
    }

    const offset = (page - 1) * limit;

    const { count, rows: invoices } = await Invoice.findAndCountAll({
      where,
      include: [
        { model: Client, as: 'client', attributes: ['id', 'name', 'phone'] },
        { model: Case, as: 'case', attributes: ['id', 'caseNumber', 'title'] }
      ],
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      invoices,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في جلب الفواتير', details: error.message });
  }
};

exports.getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id, {
      include: [
        { model: Client, as: 'client' },
        { model: Case, as: 'case', attributes: ['id', 'caseNumber', 'title'] },
        { model: Payment, as: 'payments', order: [['paymentDate', 'DESC']] },
        { model: InvoiceLine, as: 'lines' }
      ]
    });

    if (!invoice) {
      return res.status(404).json({ error: 'الفاتورة غير موجودة' });
    }

    res.json({ invoice });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في جلب الفاتورة', details: error.message });
  }
};

exports.updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id);

    if (!invoice) {
      return res.status(404).json({ error: 'الفاتورة غير موجودة' });
    }

    if (req.body.status && !INVOICE_STATUSES.includes(req.body.status)) {
      return res.status(400).json({ error: 'حالة الفاتورة غير صالحة' });
    }

    const hasAmountChange = ['totalAmount', 'taxRate', 'discount'].some(k => req.body[k] !== undefined);
    let taxAmount = invoice.taxAmount;
    let totalAmount = invoice.totalAmount;
    if (hasAmountChange) {
      const subtotal = parseFloat(req.body.totalAmount ?? invoice.totalAmount) || 0;
      const taxRate = parseFloat(req.body.taxRate ?? invoice.taxRate) || 0;
      const discount = parseFloat(req.body.discount ?? invoice.discount) || 0;
      taxAmount = Math.round(((subtotal - discount) * (taxRate / 100)) * 1000) / 1000;
      totalAmount = Math.round((subtotal - discount + taxAmount) * 1000) / 1000;
    }

    const updates = { ...req.body, taxAmount };
    if (hasAmountChange) updates.totalAmount = totalAmount;
    await invoice.update(updates);
    res.json({ message: 'تم تحديث الفاتورة بنجاح', invoice });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في تحديث الفاتورة', details: error.message });
  }
};

exports.deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id);

    if (!invoice) {
      return res.status(404).json({ error: 'الفاتورة غير موجودة' });
    }

    const paymentCount = await Payment.count({ where: { invoiceId: invoice.id } });
    if (paymentCount > 0) {
      return res.status(400).json({ error: 'لا يمكن حذف الفاتورة لوجود مدفوعات مرتبطة بها' });
    }

    const t = await sequelize.transaction();
    try {
      const lines = await InvoiceLine.findAll({ where: { invoiceId: invoice.id }, transaction: t });
      for (const line of lines) {
        if (line.sourceId) {
          await FinancialEntry.update(
            { billingStatus: 'unbilled' },
            { where: { id: line.sourceId }, transaction: t }
          );
        }
      }
      await InvoiceLine.destroy({ where: { invoiceId: invoice.id }, transaction: t });
      await invoice.destroy({ transaction: t });
      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }

    res.json({ message: 'تم حذف الفاتورة بنجاح' });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في حذف الفاتورة', details: error.message });
  }
};

exports.getInvoiceStats = async (req, res) => {
  try {
    const totalSent = await Invoice.sum('totalAmount', { where: { status: { [Op.in]: ['sent', 'partially_paid'] } } }) || 0;
    const totalPaid = await Invoice.sum('paidAmount', { where: { status: { [Op.notIn]: ['draft', 'cancelled'] } } }) || 0;
    const totalOverdue = await Invoice.sum('totalAmount', { where: { status: 'overdue' } }) || 0;
    const totalDraft = await Invoice.sum('totalAmount', { where: { status: 'draft' } }) || 0;

    const countByStatus = await Invoice.findAll({
      attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count'], [sequelize.fn('SUM', sequelize.col('totalAmount')), 'total']],
      group: ['status']
    });

    res.json({
      stats: {
        totalPending: parseFloat(totalSent),
        totalSent: parseFloat(totalSent),
        totalPaid: parseFloat(totalPaid),
        totalOverdue: parseFloat(totalOverdue),
        totalDraft: parseFloat(totalDraft)
      },
      countByStatus
    });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في جلب إحصائيات الفواتير', details: error.message });
  }
};

exports.checkOverdueInvoices = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const overdueInvoices = await Invoice.findAll({
      where: {
        status: { [Op.in]: ['sent', 'partially_paid'] },
        dueDate: { [Op.lt]: today }
      },
      include: [
        { model: Client, as: 'client', attributes: ['id', 'name', 'phone', 'email'] },
        { model: Case, as: 'case', attributes: ['id', 'caseNumber', 'title'] }
      ]
    });

    for (const invoice of overdueInvoices) {
      await invoice.update({ status: 'overdue' });

      const { Notification } = require('../models');
      await Notification.create({
        userId: req.user.id,
        caseId: invoice.caseId,
        type: 'payment_reminder',
        title: 'تذكير بالدفع المتأخر',
        message: `الفاتورة رقم ${invoice.invoiceNumber} متأخرة — المبلغ: ${invoice.totalAmount} د.ك — الموكل: ${invoice.client?.name || 'غير محدد'}`,
        priority: 'high'
      });
    }

    const threeDaysLater = new Date();
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);
    const upcomingDate = threeDaysLater.toISOString().split('T')[0];

    const upcomingInvoices = await Invoice.findAll({
      where: {
        status: { [Op.in]: ['sent', 'partially_paid'] },
        dueDate: {
          [Op.gte]: today,
          [Op.lte]: upcomingDate
        }
      },
      include: [
        { model: Client, as: 'client', attributes: ['id', 'name'] },
        { model: Case, as: 'case', attributes: ['id', 'caseNumber'] }
      ]
    });

    for (const invoice of upcomingInvoices) {
      const { Notification } = require('../models');
      await Notification.create({
        userId: req.user.id,
        caseId: invoice.caseId,
        type: 'payment_reminder',
        title: 'تذكير — الفاتورة تستحق قريباً',
        message: `الفاتورة رقم ${invoice.invoiceNumber} تستحق خلال 3 أيام — المبلغ: ${invoice.totalAmount} د.ك`,
        priority: 'medium'
      });
    }

    res.json({
      message: 'تم فحص الفواتير المتأخرة',
      overdue: overdueInvoices.length,
      upcoming: upcomingInvoices.length
    });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في فحص الفواتير', details: error.message });
  }
};

exports.getFeeReport = async (req, res) => {
  try {
    const { lawyerId, caseId, dateFrom, dateTo } = req.query;

    const where = {};
    if (caseId) where.caseId = caseId;
    if (dateFrom || dateTo) {
      where.issuedDate = {};
      if (dateFrom) where.issuedDate[Op.gte] = dateFrom;
      if (dateTo) where.issuedDate[Op.lte] = dateTo;
    }

    const feesByLawyer = await Case.findAll({
      attributes: [
        'assignedLawyerId',
        [sequelize.fn('SUM', sequelize.col('consultationFees')), 'consultationTotal'],
        [sequelize.fn('SUM', sequelize.col('litigationFees')), 'litigationTotal'],
        [sequelize.fn('SUM', sequelize.col('sessionFees')), 'sessionTotal'],
        [sequelize.fn('SUM', sequelize.col('otherFees')), 'otherTotal'],
        [sequelize.literal('SUM("Case"."consultationFees" + "Case"."litigationFees" + "Case"."sessionFees" + "Case"."otherFees")'), 'grandTotal']
      ],
      include: [{ model: User, as: 'assignedLawyer', attributes: ['id', 'fullName'] }],
      group: ['assignedLawyerId', 'assignedLawyer.id', 'assignedLawyer.fullName']
    });

    const feesByCaseWhere = {};
    if (lawyerId) feesByCaseWhere.assignedLawyerId = lawyerId;
    if (caseId) feesByCaseWhere.id = caseId;

    const feesByCase = await Case.findAll({
      attributes: ['id', 'caseNumber', 'title', 'consultationFees', 'litigationFees', 'sessionFees', 'otherFees', 'paymentStatus'],
      where: Object.keys(feesByCaseWhere).length > 0 ? feesByCaseWhere : undefined,
      include: [
        { model: User, as: 'assignedLawyer', attributes: ['id', 'fullName'] },
        { model: Client, as: 'client', attributes: ['id', 'name'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    const feesByMonth = await Case.findAll({
      attributes: [
        [sequelize.fn('TO_CHAR', sequelize.col('"Case"."createdAt"'), 'YYYY-MM'), 'month'],
        [sequelize.fn('SUM', sequelize.col('consultationFees')), 'consultationTotal'],
        [sequelize.fn('SUM', sequelize.col('litigationFees')), 'litigationTotal'],
        [sequelize.fn('SUM', sequelize.col('sessionFees')), 'sessionTotal'],
        [sequelize.fn('SUM', sequelize.col('otherFees')), 'otherTotal'],
        [sequelize.fn('COUNT', sequelize.col('"Case"."id"')), 'caseCount']
      ],
      group: [sequelize.fn('TO_CHAR', sequelize.col('"Case"."createdAt"'), 'YYYY-MM')],
      order: [[sequelize.fn('TO_CHAR', sequelize.col('"Case"."createdAt"'), 'YYYY-MM'), 'DESC']],
      limit: 12
    });

    const invoiceReport = await Invoice.findAll({
      attributes: [
        'status',
        [sequelize.fn('SUM', sequelize.col('totalAmount')), 'total'],
        [sequelize.fn('SUM', sequelize.col('paidAmount')), 'paid'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status']
    });

    res.json({
      feesByLawyer,
      feesByCase,
      feesByMonth,
      invoiceReport
    });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في تقرير الأتعاب', details: error.message });
  }
};
