const jwt = require('jsonwebtoken');
const { ClientPortalUser, Client, Case, Session, Invoice, Payment, LegalDocument } = require('../models');
const { Op } = require('sequelize');

const generatePortalToken = (id) => {
  return jwt.sign({ id, type: 'portal' }, process.env.JWT_SECRET || 'default-secret', {
    expiresIn: '7d'
  });
};

exports.portalLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'البريد الإلكتروني وكلمة المرور مطلوبان' });
    }

    const portalUser = await ClientPortalUser.findOne({
      where: { email, isActive: true },
      include: [{ model: Client, as: 'client', attributes: ['id', 'name', 'phone', 'email'] }]
    });

    if (!portalUser) {
      return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
    }

    const isValid = await portalUser.comparePassword(password);
    if (!isValid) {
      return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
    }

    const token = generatePortalToken(portalUser.id);
    await portalUser.update({ lastLogin: new Date(), token });

    res.json({
      message: 'تم تسجيل الدخول بنجاح',
      token,
      client: portalUser.client
    });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في تسجيل الدخول', details: error.message });
  }
};

exports.portalLogout = async (req, res) => {
  try {
    await req.portalUser.update({ token: null });
    res.json({ message: 'تم تسجيل الخروج بنجاح' });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في تسجيل الخروج' });
  }
};

exports.portalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Portal ', '');
    if (!token) {
      return res.status(401).json({ error: 'يرجى تسجيل الدخول' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'portal') {
      return res.status(401).json({ error: 'رمز غير صالح' });
    }

    const portalUser = await ClientPortalUser.findByPk(decoded.id, {
      include: [{ model: Client, as: 'client' }]
    });

    if (!portalUser || !portalUser.isActive) {
      return res.status(401).json({ error: 'الحساب غير موجود أو معطل' });
    }

    req.portalUser = portalUser;
    req.client = portalUser.client;
    next();
  } catch (error) {
    res.status(401).json({ error: 'غير مصرح' });
  }
};

exports.getMyCases = async (req, res) => {
  try {
    const cases = await Case.findAll({
      where: { clientId: req.client.id },
      attributes: ['id', 'caseNumber', 'title', 'type', 'status', 'priority', 'court', 'judge', 'nextHearingDate', 'filingDate'],
      order: [['createdAt', 'DESC']]
    });

    res.json({ cases });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في جلب القضايا', details: error.message });
  }
};

exports.getMyCaseDetails = async (req, res) => {
  try {
    const caseRecord = await Case.findOne({
      where: { id: req.params.id, clientId: req.client.id },
      include: [
        { model: Session, as: 'sessions', attributes: ['id', 'sessionNumber', 'date', 'time', 'location', 'status', 'outcome'] },
        {
          model: Invoice,
          as: 'invoices',
          attributes: ['id', 'invoiceNumber', 'totalAmount', 'paidAmount', 'status', 'dueDate'],
          include: [{ model: Payment, as: 'payments', attributes: ['id', 'amount', 'paymentDate', 'paymentMethod', 'referenceNumber'] }]
        },
        { model: LegalDocument, as: 'legalDocuments', attributes: ['id', 'title', 'type', 'status', 'fileUrl', 'createdAt'] }
      ]
    });

    if (!caseRecord) {
      return res.status(404).json({ error: 'القضية غير موجودة' });
    }

    res.json({ case: caseRecord });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في جلب تفاصيل القضية', details: error.message });
  }
};

exports.getMyInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.findAll({
      where: { clientId: req.client.id },
      attributes: ['id', 'invoiceNumber', 'totalAmount', 'paidAmount', 'status', 'dueDate', 'issuedDate', 'createdAt'],
      include: [{ model: Payment, as: 'payments', attributes: ['id', 'amount', 'paymentDate', 'paymentMethod', 'referenceNumber'] }],
      order: [['createdAt', 'DESC']]
    });

    res.json({ invoices });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في جلب الفواتير', details: error.message });
  }
};

exports.getMySessions = async (req, res) => {
  try {
    const clientCases = await Case.findAll({
      where: { clientId: req.client.id },
      attributes: ['id']
    });
    const caseIds = clientCases.map(c => c.id);

    const sessions = caseIds.length > 0
      ? await Session.findAll({
          where: { caseId: { [Op.in]: caseIds } },
          include: [{ model: Case, as: 'case', attributes: ['id', 'caseNumber', 'title'] }],
          order: [['date', 'DESC']]
        })
      : [];

    res.json({ sessions });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في جلب الجلسات', details: error.message });
  }
};

exports.getMyDocuments = async (req, res) => {
  try {
    const clientCases = await Case.findAll({
      where: { clientId: req.client.id },
      attributes: ['id']
    });
    const caseIds = clientCases.map(c => c.id);

    const documents = caseIds.length > 0
      ? await LegalDocument.findAll({
          where: { caseId: { [Op.in]: caseIds } },
          include: [{ model: Case, as: 'case', attributes: ['id', 'caseNumber', 'title'] }],
          order: [['createdAt', 'DESC']]
        })
      : [];

    res.json({ documents });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في جلب المستندات', details: error.message });
  }
};

exports.getMyPayments = async (req, res) => {
  try {
    const clientInvoices = await Invoice.findAll({
      where: { clientId: req.client.id },
      attributes: ['id']
    });
    const invoiceIds = clientInvoices.map(i => i.id);

    const payments = invoiceIds.length > 0
      ? await Payment.findAll({
          where: { invoiceId: { [Op.in]: invoiceIds } },
          include: [{ model: Invoice, as: 'invoice', attributes: ['id', 'invoiceNumber'] }],
          order: [['paymentDate', 'DESC']]
        })
      : [];

    res.json({ payments });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في جلب الدفعات', details: error.message });
  }
};

exports.getMyProfile = async (req, res) => {
  try {
    const safeAttributes = [
      'id', 'name', 'email', 'phone', 'civilId', 'passportNumber',
      'nationality', 'address', 'dateOfBirth', 'firstCooperationDate', 'isActive'
    ];
    const clientData = {};
    safeAttributes.forEach(attr => {
      clientData[attr] = req.client[attr];
    });
    clientData.portalEmail = req.portalUser.email;
    clientData.lastLogin = req.portalUser.lastLogin;

    res.json({ client: clientData });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في جلب البيانات' });
  }
};
