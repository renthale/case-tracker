const { Invoice, Payment, Client, Case, User } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

exports.createInvoice = async (req, res) => {
  try {
    let invoiceNumber = req.body.invoiceNumber;
    if (!invoiceNumber) {
      const year = new Date().getFullYear();
      const count = await Invoice.count();
      invoiceNumber = `INV-${year}-${String(count + 1).padStart(4, '0')}`;
    }

    const taxRate = parseFloat(req.body.taxRate) || 0;
    const totalAmount = parseFloat(req.body.totalAmount) || 0;
    const discount = parseFloat(req.body.discount) || 0;
    const taxAmount = (totalAmount - discount) * (taxRate / 100);

    const invoice = await Invoice.create({
      ...req.body,
      invoiceNumber,
      taxAmount,
      status: 'pending'
    });

    res.status(201).json({ message: 'تم إنشاء الفاتورة بنجاح', invoice });
  } catch (error) {
    console.error('Create invoice error:', error);
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
        { model: Payment, as: 'payments', order: [['paymentDate', 'DESC']] }
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

    const taxRate = parseFloat(req.body.taxRate ?? invoice.taxRate);
    const totalAmount = parseFloat(req.body.totalAmount ?? invoice.totalAmount);
    const discount = parseFloat(req.body.discount ?? invoice.discount);
    const taxAmount = (totalAmount - discount) * (taxRate / 100);

    await invoice.update({ ...req.body, taxAmount });
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

    await invoice.destroy();
    res.json({ message: 'تم حذف الفاتورة بنجاح' });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في حذف الفاتورة', details: error.message });
  }
};

exports.getInvoiceStats = async (req, res) => {
  try {
    const totalPending = await Invoice.sum('totalAmount', { where: { status: 'pending' } }) || 0;
    const totalPaid = await Invoice.sum('paidAmount', { where: { status: 'paid' } }) || 0;
    const totalOverdue = await Invoice.sum('totalAmount', { where: { status: 'overdue' } }) || 0;

    const countByStatus = await Invoice.findAll({
      attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count'], [sequelize.fn('SUM', sequelize.col('totalAmount')), 'total']],
      group: ['status']
    });

    res.json({
      stats: {
        totalPending: parseFloat(totalPending),
        totalPaid: parseFloat(totalPaid),
        totalOverdue: parseFloat(totalOverdue)
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
        status: 'pending',
        dueDate: { [require('sequelize').Op.lt]: today }
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
        status: 'pending',
        dueDate: {
          [require('sequelize').Op.gte]: today,
          [require('sequelize').Op.lte]: upcomingDate
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
      if (dateFrom) where.issuedDate[require('sequelize').Op.gte] = dateFrom;
      if (dateTo) where.issuedDate[require('sequelize').Op.lte] = dateTo;
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
