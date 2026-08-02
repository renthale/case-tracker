const { FinancialEntry, Case, Session, CaseFeeAgreement, Invoice, Payment, InvoiceLine } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { uploadFile } = require('../utils/fileUpload');
const { canManageFinancials } = require('../middleware/auth');

const TYPES = ['professional_fee', 'case_expense', 'session_expense'];

const CATEGORIES = {
  professional_fee: [
    'consultation', 'case_opening', 'court_attendance', 'legal_memorandum',
    'contract_drafting', 'contract_review', 'appeal_preparation', 'legal_opinion',
    'negotiation', 'government_transaction_service', 'execution_follow_up', 'other'
  ],
  case_expense: [
    'court_filing_fee', 'ministry_of_justice_fee', 'court_stamp', 'expert_fee',
    'translation', 'certified_translation', 'notary_fee', 'government_fee',
    'execution_fee', 'appeal_fee', 'medical_report', 'police_report', 'courier',
    'shipping', 'printing_copies', 'travel', 'other'
  ],
  session_expense: [
    'court_agent_fee', 'lawyer_attendance_fee', 'transportation', 'parking',
    'taxi', 'fuel', 'printing', 'court_copies', 'waiting_time', 'other'
  ]
};

const parseEntry = async (body) => {
  const type = body.type;
  if (!TYPES.includes(type)) {
    return { error: 'نوع الإدخال غير صالح' };
  }

  const category = body.category;
  if (!CATEGORIES[type].includes(category)) {
    return { error: 'فئة غير صالحة لنوع الإدخال المحدد' };
  }

  const amount = parseFloat(body.amount);
  if (!amount || amount <= 0) {
    return { error: 'المبلغ مطلوب ويجب أن يكون أكبر من صفر' };
  }

  if (type === 'session_expense' && !body.sessionId) {
    return { error: 'رقم الجلسة مطلوب لمصروف الجلسة' };
  }

  const caseRecord = await Case.findByPk(body.caseId);
  if (!caseRecord) {
    return { error: 'القضية غير موجودة' };
  }

  if (body.sessionId) {
    const session = await Session.findByPk(body.sessionId);
    if (!session) {
      return { error: 'الجلسة غير موجودة' };
    }
    if (session.caseId !== caseRecord.id) {
      return { error: 'الجلسة لا تنتمي إلى هذه القضية' };
    }
  }

  return {
    data: {
      type,
      caseId: caseRecord.id,
      sessionId: body.sessionId || null,
      clientId: body.clientId || caseRecord.clientId || null,
      category,
      description: body.description || null,
      amount,
      entryDate: body.entryDate || new Date().toISOString().split('T')[0],
      billable: body.billable === undefined ? true : Boolean(body.billable),
      billingStatus: body.billingStatus || 'unbilled',
      paidBy: body.paidBy || null,
      receiptUrl: body.receiptUrl || null,
      notes: body.notes || null
    }
  };
};

exports.createFinancialEntry = async (req, res) => {
  try {
    const parsed = await parseEntry(req.body);
    if (parsed.error) {
      return res.status(400).json({ error: parsed.error });
    }

    const entry = await FinancialEntry.create(parsed.data);
    res.status(201).json({ message: 'تم إضافة الإدخال المالي بنجاح', entry });
  } catch (error) {
    console.error('Create financial entry error:', error);
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map(e => e.message).join(', ');
      return res.status(400).json({ error: 'خطأ في البيانات', details: messages });
    }
    res.status(500).json({ error: 'خطأ في إضافة الإدخال المالي', details: error.message });
  }
};

exports.getFinancialEntries = async (req, res) => {
  try {
    const {
      caseId, sessionId, type, billingStatus, billable,
      page = 1, limit = 50, sortBy = 'entryDate', sortOrder = 'DESC'
    } = req.query;

    const where = {};
    if (caseId) where.caseId = caseId;
    if (sessionId) where.sessionId = sessionId;
    if (type) where.type = type;
    if (billingStatus) where.billingStatus = billingStatus;
    if (billable !== undefined) where.billable = billable === 'true';

    const offset = (page - 1) * limit;

    const { count, rows: entries } = await FinancialEntry.findAndCountAll({
      where,
      include: [
        { model: Case, as: 'case', attributes: ['id', 'caseNumber', 'title'] },
        { model: Session, as: 'session', attributes: ['id', 'sessionNumber', 'date'] }
      ],
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      entries,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في جلب الإدخالات المالية', details: error.message });
  }
};

exports.getFinancialEntryById = async (req, res) => {
  try {
    const entry = await FinancialEntry.findByPk(req.params.id, {
      include: [
        { model: Case, as: 'case', attributes: ['id', 'caseNumber', 'title'] },
        { model: Session, as: 'session', attributes: ['id', 'sessionNumber', 'date'] }
      ]
    });

    if (!entry) {
      return res.status(404).json({ error: 'الإدخال المالي غير موجود' });
    }

    res.json({ entry });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في جلب الإدخال المالي', details: error.message });
  }
};

exports.updateFinancialEntry = async (req, res) => {
  try {
    const entry = await FinancialEntry.findByPk(req.params.id);

    if (!entry) {
      return res.status(404).json({ error: 'الإدخال المالي غير موجود' });
    }

    if (entry.billingStatus !== 'unbilled') {
      return res.status(400).json({ error: 'لا يمكن تعديل إدخال تمت فوترته أو دفعه' });
    }

    const parsed = await parseEntry({ ...entry.dataValues, ...req.body });
    if (parsed.error) {
      return res.status(400).json({ error: parsed.error });
    }

    await entry.update(parsed.data);
    res.json({ message: 'تم تحديث الإدخال المالي بنجاح', entry });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في تحديث الإدخال المالي', details: error.message });
  }
};

exports.deleteFinancialEntry = async (req, res) => {
  try {
    const entry = await FinancialEntry.findByPk(req.params.id);

    if (!entry) {
      return res.status(404).json({ error: 'الإدخال المالي غير موجود' });
    }

    if (entry.billingStatus !== 'unbilled') {
      return res.status(400).json({ error: 'لا يمكن حذف إدخال تمت فوترته أو دفعه' });
    }

    const lineCount = await InvoiceLine.count({
      where: { sourceId: entry.id, sourceType: entry.type }
    });
    if (lineCount > 0) {
      return res.status(400).json({ error: 'لا يمكن حذف الإدخال لارتباطه بفاتورة' });
    }

    await entry.destroy();
    res.json({ message: 'تم حذف الإدخال المالي بنجاح' });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في حذف الإدخال المالي', details: error.message });
  }
};

exports.uploadReceipt = async (req, res) => {
  try {
    const entry = await FinancialEntry.findByPk(req.params.id);
    if (!entry) {
      return res.status(404).json({ error: 'الإدخال المالي غير موجود' });
    }

    let receiptUrl = entry.receiptUrl;

    if (req.file) {
      const uploadResult = await uploadFile(req.file, `receipts/case-${entry.caseId}`);
      if (uploadResult.error && !uploadResult.url) {
        return res.status(500).json({ error: 'خطأ في رفع الملف', details: uploadResult.error });
      }
      receiptUrl = uploadResult.url || receiptUrl;
    } else if (req.body && req.body.data) {
      receiptUrl = req.body.data;
    }

    await entry.update({ receiptUrl });
    res.json({ message: 'تم رفع الإيصال بنجاح', entry });
  } catch (error) {
    console.error('Upload receipt error:', error);
    res.status(500).json({ error: 'خطأ في رفع الإيصال', details: error.message });
  }
};

exports.getCaseFinancials = async (req, res) => {
  try {
    const caseId = req.params.id;
    const caseRecord = await Case.findByPk(caseId);
    if (!caseRecord) {
      return res.status(404).json({ error: 'القضية غير موجودة' });
    }

    const entries = await FinancialEntry.findAll({ where: { caseId } });
    const invoices = await Invoice.findAll({ where: { caseId } });
    const feeAgreement = await CaseFeeAgreement.findOne({ where: { caseId } });

    const sumByType = (type) =>
      entries
        .filter(e => e.type === type)
        .reduce((sum, e) => sum + parseFloat(e.amount), 0);

    const professionalFees = sumByType('professional_fee');
    const caseExpenses = sumByType('case_expense');
    const sessionExpenses = sumByType('session_expense');

    const activeInvoices = invoices.filter(i => i.status !== 'cancelled');
    const totalInvoiced = activeInvoices.reduce((s, i) => s + parseFloat(i.totalAmount || 0), 0);
    const totalPaid = activeInvoices.reduce((s, i) => s + parseFloat(i.paidAmount || 0), 0);
    const outstanding = totalInvoiced - totalPaid;
    const overdue = invoices
      .filter(i => i.status === 'overdue')
      .reduce((s, i) => s + parseFloat(i.totalAmount || 0), 0);

    const unbilledBillable = entries
      .filter(e => e.billable && e.billingStatus === 'unbilled')
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);

    const statusCounts = invoices.reduce((acc, i) => {
      acc[i.status] = (acc[i.status] || 0) + 1;
      return acc;
    }, {});

    res.json({
      financials: {
        agreedFee: feeAgreement ? parseFloat(feeAgreement.agreedAmount || 0) : 0,
        professionalFees: parseFloat(professionalFees.toFixed(3)),
        caseExpenses: parseFloat(caseExpenses.toFixed(3)),
        sessionExpenses: parseFloat(sessionExpenses.toFixed(3)),
        totalExpenses: parseFloat((caseExpenses + sessionExpenses).toFixed(3)),
        totalInvoiced: parseFloat(totalInvoiced.toFixed(3)),
        totalPaid: parseFloat(totalPaid.toFixed(3)),
        outstanding: parseFloat(outstanding.toFixed(3)),
        overdue: parseFloat(overdue.toFixed(3)),
        unbilledBillable: parseFloat(unbilledBillable.toFixed(3)),
        invoiceStatusCounts: statusCounts,
        invoiceCount: invoices.length,
        entryCount: entries.length
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في حساب المالية', details: error.message });
  }
};

exports.getUnbilledItems = async (req, res) => {
  try {
    const caseId = req.params.id;
    const caseRecord = await Case.findByPk(caseId);
    if (!caseRecord) {
      return res.status(404).json({ error: 'القضية غير موجودة' });
    }

    const entries = await FinancialEntry.findAll({
      where: {
        caseId,
        billable: true,
        billingStatus: 'unbilled',
        type: { [Op.in]: ['professional_fee', 'case_expense', 'session_expense'] }
      },
      include: [{ model: Session, as: 'session', attributes: ['id', 'sessionNumber', 'date'] }],
      order: [['entryDate', 'ASC']]
    });

    res.json({ entries });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في جلب البنود غير المفوتورة', details: error.message });
  }
};

exports.getFeeAgreement = async (req, res) => {
  try {
    const caseId = req.params.id;
    const agreement = await CaseFeeAgreement.findOne({ where: { caseId } });

    if (!agreement) {
      return res.json({ agreement: null });
    }

    res.json({ agreement });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في جلب اتفاق الأتعاب', details: error.message });
  }
};

exports.upsertFeeAgreement = async (req, res) => {
  try {
    const caseId = req.params.id;
    const caseRecord = await Case.findByPk(caseId);
    if (!caseRecord) {
      return res.status(404).json({ error: 'القضية غير موجودة' });
    }

    const allowedArrangements = ['fixed_fee', 'per_session', 'hourly', 'monthly_retainer', 'stage_based', 'custom'];
    const feeArrangement = req.body.feeArrangement;
    if (feeArrangement && !allowedArrangements.includes(feeArrangement)) {
      return res.status(400).json({ error: 'ترتيب الأتعاب غير صالح' });
    }

    const agreementData = {
      caseId,
      feeArrangement: feeArrangement || 'fixed_fee',
      agreedAmount: parseFloat(req.body.agreedAmount) || 0,
      currency: req.body.currency || 'KWD',
      startDate: req.body.startDate || null,
      paymentTerms: req.body.paymentTerms || null,
      notes: req.body.notes || null
    };

    const existing = await CaseFeeAgreement.findOne({ where: { caseId } });
    if (existing) {
      await existing.update(agreementData);
      return res.json({ message: 'تم تحديث اتفاق الأتعاب بنجاح', agreement: existing });
    }

    const agreement = await CaseFeeAgreement.create(agreementData);
    res.status(201).json({ message: 'تم إنشاء اتفاق الأتعاب بنجاح', agreement });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في حفظ اتفاق الأتعاب', details: error.message });
  }
};
