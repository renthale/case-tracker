const { Client, Case, Invoice, Payment, ClientPortalUser, FinancialEntry } = require('../models');
const { Op } = require('sequelize');
const { generateToken, hashToken, expiresAt } = require('../utils/tokenService');
const { sendPortalInvitation, PORTAL_BASE } = require('../utils/emailService');
const { canManageFinancials } = require('../middleware/auth');

exports.createClient = async (req, res) => {
  try {
    const { createPortalAccount, sendCredentials, ...clientData } = req.body;

    if (createPortalAccount && !['admin', 'partner'].includes(req.user.role)) {
      return res.status(403).json({ error: 'إنشاء حساب بوابة العميل يتطلب صلاحية مدير أو شريك' });
    }

    const client = await Client.create(clientData);

    let portalAccount = null;

    if (createPortalAccount && client.email) {
      const rawToken = generateToken();
      portalAccount = await ClientPortalUser.create({
        clientId: client.id,
        email: client.email,
        password: null,
        isActive: true,
        invitationToken: hashToken(rawToken),
        invitationTokenExpiry: expiresAt('invitation'),
        invitationSentAt: new Date()
      });

      const invitationUrl = `${PORTAL_BASE}/invite/${rawToken}`;
      if (sendCredentials) {
        sendPortalInvitation(client, client.email, rawToken, invitationUrl).catch(emailErr => {
          console.error('Failed to send portal invitation email:', emailErr.message);
        });
        portalAccount = { email: portalAccount.email, status: 'invited' };
      } else {
        portalAccount = { email: portalAccount.email, status: 'invited', invitationLink: invitationUrl };
      }
    }

    res.status(201).json({
      message: 'تم إنشاء العميل بنجاح',
      client,
      portalAccount
    });
  } catch (error) {
    console.error('Create client error:', error);
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map(e => e.message).join(', ');
      return res.status(400).json({ error: 'خطأ في البيانات', details: messages });
    }
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'العميل موجود مسبقاً', details: 'رقم الهوية مسجل مسبقاً' });
    }
    res.status(500).json({ error: 'خطأ في إنشاء العميل', details: error.message });
  }
};

exports.getClients = async (req, res) => {
  try {
    const {
      search, isActive,
      page = 1, limit = 10,
      sortBy = 'createdAt', sortOrder = 'DESC'
    } = req.query;

    const where = {};

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { civilId: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const offset = (page - 1) * limit;

    const { count, rows: clients } = await Client.findAndCountAll({
      where,
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      clients,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في جلب العملاء', details: error.message });
  }
};

exports.getClientById = async (req, res) => {
  try {
    const isFinancialUser = canManageFinancials.includes(req.user.role);

    const include = [
      { model: Case, as: 'cases', attributes: ['id', 'caseNumber', 'title', 'status', 'type'] },
      { model: ClientPortalUser, as: 'portalUser', attributes: ['id', 'email', 'isActive', 'lastLogin', 'invitationSentAt', 'invitationTokenExpiry', 'password'] }
    ];

    if (isFinancialUser) {
      include.push({
        model: Invoice,
        as: 'invoices',
        attributes: ['id', 'invoiceNumber', 'totalAmount', 'paidAmount', 'status', 'dueDate'],
        include: [
          { model: Payment, as: 'payments', attributes: ['id', 'amount', 'paymentDate', 'paymentMethod', 'referenceNumber'] }
        ]
      });
    }

    const client = await Client.findByPk(req.params.id, { include });

    if (!client) {
      return res.status(404).json({ error: 'العميل غير موجود' });
    }

    if (client.portalUser) {
      const pu = client.portalUser;
      pu.dataValues.status = pu.password ? (pu.isActive ? 'active' : 'disabled') : 'invited';
      delete pu.dataValues.password;
    }

    res.json({ client });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في جلب العميل', details: error.message });
  }
};

exports.getClientFinancialSummary = async (req, res) => {
  try {
    const clientId = req.params.id;
    const client = await Client.findByPk(clientId);
    if (!client) {
      return res.status(404).json({ error: 'العميل غير موجود' });
    }

    const cases = await Case.findAll({ where: { clientId } });
    const invoices = await Invoice.findAll({ where: { clientId } });
    const entries = await FinancialEntry.findAll({ where: { clientId } });

    const caseIds = cases.map(c => c.id);
    const invoicesByCase = invoices.reduce((acc, i) => {
      if (!acc[i.caseId]) acc[i.caseId] = [];
      acc[i.caseId].push(i);
      return acc;
    }, {});
    const entriesByCase = entries.reduce((acc, e) => {
      if (!acc[e.caseId]) acc[e.caseId] = [];
      acc[e.caseId].push(e);
      return acc;
    }, {});

    let totals = {
      activeCases: 0,
      totalInvoiced: 0,
      totalPaid: 0,
      outstanding: 0,
      unbilledBillable: 0
    };

    const caseBreakdown = cases.map(c => {
      const caseInvoices = (invoicesByCase[c.id] || []).filter(i => i.status !== 'cancelled');
      const caseEntries = entriesByCase[c.id] || [];

      const invoiced = caseInvoices.reduce((s, i) => s + parseFloat(i.totalAmount || 0), 0);
      const paid = caseInvoices.reduce((s, i) => s + parseFloat(i.paidAmount || 0), 0);
      const unbilled = caseEntries
        .filter(e => e.billable && e.billingStatus === 'unbilled')
        .reduce((s, e) => s + parseFloat(e.amount), 0);

      if (c.status === 'active') totals.activeCases += 1;
      totals.totalInvoiced += invoiced;
      totals.totalPaid += paid;
      totals.unbilledBillable += unbilled;

      return {
        caseId: c.id,
        caseNumber: c.caseNumber,
        title: c.title,
        status: c.status,
        invoiced: parseFloat(invoiced.toFixed(3)),
        paid: parseFloat(paid.toFixed(3)),
        outstanding: parseFloat((invoiced - paid).toFixed(3)),
        unbilledBillable: parseFloat(unbilled.toFixed(3))
      };
    });

    totals.outstanding = parseFloat((totals.totalInvoiced - totals.totalPaid).toFixed(3));
    totals.totalInvoiced = parseFloat(totals.totalInvoiced.toFixed(3));
    totals.totalPaid = parseFloat(totals.totalPaid.toFixed(3));
    totals.unbilledBillable = parseFloat(totals.unbilledBillable.toFixed(3));

    res.json({ summary: totals, caseBreakdown });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في حساب الملخص المالي للعميل', details: error.message });
  }
};

exports.updateClient = async (req, res) => {
  try {
    const client = await Client.findByPk(req.params.id);

    if (!client) {
      return res.status(404).json({ error: 'العميل غير موجود' });
    }

    await client.update(req.body);
    res.json({ message: 'تم تحديث بيانات العميل بنجاح', client });
  } catch (error) {
    console.error('Update client error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'رقم الهوية مسجل مسبقاً لعميل آخر' });
    }
    res.status(500).json({ error: 'خطأ في تحديث العميل', details: error.message });
  }
};

exports.deleteClient = async (req, res) => {
  try {
    const client = await Client.findByPk(req.params.id);

    if (!client) {
      return res.status(404).json({ error: 'العميل غير موجود' });
    }

    const caseCount = await Case.count({ where: { clientId: client.id } });
    if (caseCount > 0) {
      return res.status(400).json({ error: 'لا يمكن حذف العميل لوجود قضايا مرتبطة به', details: `يوجد ${caseCount} قضية مرتبطة` });
    }

    await client.destroy();
    res.json({ message: 'تم حذف العميل بنجاح' });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في حذف العميل', details: error.message });
  }
};
