const { Case, Session, User, Notification, Client, Invoice, LegalDocument, FinancialEntry, CaseFeeAgreement, Payment, Transaction, AuditLog } = require('../models');
const { Op, fn, col, literal } = require('sequelize');
const { canManageFinancials } = require('../middleware/auth');

exports.createCase = async (req, res) => {
  try {
    let caseNumber = req.body.caseNumber;
    if (!caseNumber) {
      const year = new Date().getFullYear();
      const yearCount = await Case.count({
        where: {
          caseNumber: { [Op.like]: `${year}-25-%` }
        }
      });
      caseNumber = `${year}-25-${String(yearCount + 1).padStart(4, '0')}`;
    }

    const caseData = {
      ...req.body,
      caseNumber,
      assignedLawyerId: req.user.id
    };

    if (req.body.clientId) {
      const client = await Client.findByPk(req.body.clientId);
      if (!client) {
        return res.status(404).json({ error: 'العميل غير موجود' });
      }
    }

    const caseRecord = await Case.create(caseData);

    await Notification.create({
      userId: req.user.id,
      caseId: caseRecord.id,
      type: 'case_update',
      title: 'قضية جديدة',
      message: `تم إنشاء قضية جديدة: ${caseRecord.title}`,
      priority: 'medium'
    });

    res.status(201).json({ message: 'تم إنشاء القضية بنجاح', case: caseRecord });
  } catch (error) {
    console.error('Create case error:', error);
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map(e => e.message).join(', ');
      return res.status(400).json({ error: 'خطأ في البيانات', details: messages });
    }
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'رقم القضية مستخدم مسبقاً', details: 'يجب استخدام رقم قضية مختلف' });
    }
    res.status(500).json({ error: 'خطأ في إنشاء القضية', details: error.message });
  }
};

exports.getCases = async (req, res) => {
  try {
    const {
      status, type, priority, search, clientId,
      page = 1, limit = 10,
      sortBy = 'createdAt', sortOrder = 'DESC'
    } = req.query;

    const where = {};

    if (status) where.status = status;
    if (type) where.type = type;
    if (priority) where.priority = priority;
    if (clientId) where.clientId = clientId;

    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { caseNumber: { [Op.iLike]: `%${search}%` } },
        { clientName: { [Op.iLike]: `%${search}%` } },
        { opposingParty: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Role-based filtering
    const userRole = req.user.role;
    const userId = req.user.id;

    if (userRole === 'lawyer' || userRole === 'trainee_lawyer') {
      // Lawyers only see their own cases
      where[Op.or] = [
        { assignedLawyerId: userId },
        { secondaryLawyerId: userId }
      ];
    }

    if (userRole === 'court_agent') {
      // Court agents only see their assigned cases
      where.courtAgentId = userId;
    }

    const offset = (page - 1) * limit;

    const { count, rows: cases } = await Case.findAndCountAll({
      where,
      include: [
        { model: User, as: 'assignedLawyer', attributes: ['id', 'fullName'] },
        { model: User, as: 'courtAgent', attributes: ['id', 'fullName'] },
        { model: Client, as: 'client', attributes: ['id', 'name', 'phone'] }
      ],
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      cases,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في جلب القضايا', details: error.message });
  }
};

exports.getCaseById = async (req, res) => {
  try {
    const isFinancialUser = canManageFinancials.includes(req.user.role);

    const financialIncludes = [];
    if (isFinancialUser) {
      financialIncludes.push({
        model: Invoice,
        as: 'invoices',
        attributes: ['id', 'invoiceNumber', 'totalAmount', 'paidAmount', 'status', 'dueDate', 'issuedDate', 'taxAmount', 'discount', 'notes'],
        include: [
          { model: Payment, as: 'payments', attributes: ['id', 'amount', 'paymentDate', 'paymentMethod', 'referenceNumber', 'notes'] },
          { model: require('../models/InvoiceLine'), as: 'lines' }
        ]
      });
      financialIncludes.push(
        { model: FinancialEntry, as: 'financialEntries' },
        { model: CaseFeeAgreement, as: 'feeAgreement' }
      );
    }

    const caseRecord = await Case.findByPk(req.params.id, {
      include: [
        { model: User, as: 'assignedLawyer', attributes: ['id', 'fullName', 'email'] },
        { model: User, as: 'courtAgent', attributes: ['id', 'fullName', 'email'] },
        { model: Client, as: 'client' },
        { model: Session, as: 'sessions', order: [['date', 'DESC']] },
        { model: LegalDocument, as: 'legalDocuments', attributes: ['id', 'title', 'type', 'status', 'createdAt'] },
        { model: Transaction, as: 'transactions' },
        { model: Notification, as: 'notifications', order: [['createdAt', 'DESC']], limit: 10 },
        ...financialIncludes
      ]
    });

    if (!caseRecord) {
      return res.status(404).json({ error: 'القضية غير موجودة' });
    }

    res.json({ case: caseRecord });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في جلب القضية', details: error.message });
  }
};

exports.updateCase = async (req, res) => {
  try {
    const caseRecord = await Case.findByPk(req.params.id);

    if (!caseRecord) {
      return res.status(404).json({ error: 'القضية غير موجودة' });
    }

    const isAssignedLawyer = caseRecord.assignedLawyerId === req.user.id;
    const isSecondaryLawyer = caseRecord.secondaryLawyerId === req.user.id;
    const isCourtAgent = caseRecord.courtAgentId === req.user.id;
    const isAdminOrPartner = ['admin', 'partner'].includes(req.user.role);

    if (!isAssignedLawyer && !isSecondaryLawyer && !isCourtAgent && !isAdminOrPartner) {
      return res.status(403).json({ error: 'ليس لديك صلاحية لتحديث هذه القضية' });
    }

    const oldStatus = caseRecord.status;
    req.body.lastEditedBy = req.user.id;
    req.body.lastEditedAt = new Date();
    await caseRecord.update(req.body);

    if (req.body.status && oldStatus !== req.body.status) {
      await Notification.create({
        userId: req.user.id,
        caseId: caseRecord.id,
        type: 'case_update',
        title: 'تحديث حالة القضية',
        message: `تم تغيير حالة القضية "${caseRecord.title}" من ${oldStatus} إلى ${req.body.status}`,
        priority: 'high'
      });
    }

    res.json({ message: 'تم تحديث القضية بنجاح', case: caseRecord });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في تحديث القضية', details: error.message });
  }
};

exports.deleteCase = async (req, res) => {
  try {
    const caseRecord = await Case.findByPk(req.params.id);

    if (!caseRecord) {
      return res.status(404).json({ error: 'القضية غير موجودة' });
    }

    return res.status(403).json({ error: 'لا يمكن حذف تفاصيل القضية الأساسية - يمكنك التعديل فقط' });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في حذف القضية', details: error.message });
  }
};

exports.getCaseTimeline = async (req, res) => {
  try {
    const caseRecord = await Case.findByPk(req.params.id);
    if (!caseRecord) {
      return res.status(404).json({ error: 'القضية غير موجودة' });
    }

    const isFinancialUser = canManageFinancials.includes(req.user.role);
    const events = [];

    events.push({
      type: 'case_created',
      date: caseRecord.createdAt,
      title: caseRecord.title,
      user: null
    });

    const auditLogs = await AuditLog.findAll({
      where: { entityType: 'Case', entityId: caseRecord.id },
      include: [{ model: User, as: 'user', attributes: ['id', 'fullName'] }],
      order: [['createdAt', 'ASC']]
    });
    for (const log of auditLogs) {
      events.push({
        type: 'case_updated',
        date: log.createdAt,
        title: caseRecord.title,
        user: log.user?.fullName || null,
        data: {
          oldStatus: log.oldValues?.status || null,
          newStatus: log.newValues?.status || null,
          notes: log.notes || null
        }
      });
    }

    const sessions = await Session.findAll({
      where: { caseId: caseRecord.id },
      order: [['date', 'ASC']]
    });
    for (const s of sessions) {
      events.push({
        type: 'session',
        date: s.date,
        title: s.sessionNumber ? `${s.sessionNumber}` : null,
        user: null,
        data: {
          status: s.status,
          outcome: s.outcome || null,
          postponedTo: s.postponedTo || null,
          location: s.location || null,
          nextSessionDate: s.nextSessionDate || null
        }
      });
    }

    const documents = await LegalDocument.findAll({
      where: { caseId: caseRecord.id },
      order: [['createdAt', 'ASC']]
    });
    for (const d of documents) {
      events.push({
        type: 'document',
        date: d.createdAt,
        title: d.title,
        user: null,
        data: { type: d.type, status: d.status }
      });
    }

    const notifications = await Notification.findAll({
      where: { caseId: caseRecord.id },
      order: [['createdAt', 'ASC']]
    });
    for (const n of notifications) {
      events.push({
        type: 'notification',
        date: n.createdAt,
        title: n.title,
        user: null,
        data: { message: n.message }
      });
    }

    if (isFinancialUser) {
      const financialEntries = await FinancialEntry.findAll({
        where: { caseId: caseRecord.id },
        order: [['createdAt', 'ASC']]
      });
      for (const fe of financialEntries) {
        events.push({
          type: 'financial',
          date: fe.createdAt,
          title: fe.description || fe.category || null,
          user: null,
          data: {
            category: fe.category,
            type: fe.type,
            amount: parseFloat(fe.amount),
            billingStatus: fe.billingStatus,
            linkedSessionId: fe.sessionId || null
          }
        });
      }

      // Payments are linked to invoices (Payments.caseId does not exist yet on
      // the legacy schema; the opt-in financial migration is not applied).
      const caseInvoices = await Invoice.findAll({ where: { caseId: caseRecord.id }, attributes: ['id'] });
      const caseInvoiceIds = caseInvoices.map((inv) => inv.id);
      const payments = caseInvoiceIds.length
        ? await Payment.findAll({
            where: { invoiceId: { [Op.in]: caseInvoiceIds } },
            attributes: ['id', 'invoiceId', 'amount', 'paymentDate', 'paymentMethod', 'referenceNumber', 'notes', 'createdAt', 'updatedAt'],
            order: [['paymentDate', 'ASC']]
          })
        : [];
      for (const p of payments) {
        events.push({
          type: 'payment',
          date: p.paymentDate || p.createdAt,
          title: p.referenceNumber || null,
          user: null,
          data: {
            amount: parseFloat(p.amount),
            method: p.paymentMethod,
            referenceNumber: p.referenceNumber || null
          }
        });
      }
    }

    events.sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({ caseId: caseRecord.id, caseNumber: caseRecord.caseNumber, events });
  } catch (error) {
    console.error('Get case timeline error:', error);
    res.status(500).json({ error: 'خطأ في جلب الجدول الزمني للقضية', details: error.message });
  }
};

exports.getCaseStats = async (req, res) => {
  try {
    const totalCases = await Case.count();
    const activeCases = await Case.count({ where: { status: 'active' } });
    const pendingCases = await Case.count({ where: { status: 'pending' } });
    const closedCases = await Case.count({ where: { status: 'closed' } });
    const wonCases = await Case.count({ where: { status: 'won' } });
    const lostCases = await Case.count({ where: { status: 'lost' } });
    const appealCases = await Case.count({ where: { status: 'appeal' } });
    const settledCases = await Case.count({ where: { status: 'settled' } });

    const casesByType = await Case.findAll({
      attributes: ['type', [fn('COUNT', '*'), 'count']],
      group: ['type'],
      raw: true
    });

    const casesByStatus = await Case.findAll({
      attributes: ['status', [fn('COUNT', '*'), 'count']],
      group: ['status'],
      raw: true
    });

    const casesByPriority = await Case.findAll({
      attributes: ['priority', [fn('COUNT', '*'), 'count']],
      group: ['priority'],
      raw: true
    });

    const upcomingSessions = await Session.findAll({
      where: {
        date: { [Op.gte]: new Date() },
        status: 'scheduled'
      },
      include: [{ model: Case, attributes: ['id', 'title', 'caseNumber'] }],
      order: [['date', 'ASC']],
      limit: 5
    });

    const sessionsSummary = {
      total: await Session.count(),
      scheduled: await Session.count({ where: { status: 'scheduled' } }),
      completed: await Session.count({ where: { status: 'completed' } }),
      postponed: await Session.count({ where: { status: 'postponed' } }),
      cancelled: await Session.count({ where: { status: 'cancelled' } })
    };

    const response = {
      stats: {
        total: totalCases,
        active: activeCases,
        pending: pendingCases,
        closed: closedCases,
        won: wonCases,
        lost: lostCases,
        appeal: appealCases,
        settled: settledCases
      },
      casesByType,
      casesByStatus,
      casesByPriority,
      upcomingSessions,
      sessionsSummary
    };

    const isFinancialUser = canManageFinancials.includes(req.user.role);

    if (isFinancialUser) {
      // Invoice stats must tolerate the live legacy Invoice.status ENUM
      // ('pending' | 'paid' | 'overdue' | 'cancelled'). The opt-in financial
      // migration that widens status to VARCHAR(20) is NOT applied, so only
      // legacy enum values may be referenced in WHERE clauses here.
      try {
        const totalInvoiced = await Invoice.sum('totalAmount', { where: { status: { [Op.notIn]: ['cancelled'] } } }) || 0;
        const totalPaid = await Invoice.sum('paidAmount', { where: { status: { [Op.notIn]: ['cancelled'] } } }) || 0;
        const outstanding = await Invoice.sum('totalAmount', { where: { status: { [Op.in]: ['pending', 'overdue'] } } }) || 0;

        const invoiceCounts = await Invoice.findAll({
          attributes: ['status', [fn('COUNT', '*'), 'count']],
          group: ['status'],
          raw: true
        });

        const monthCol = literal("TO_CHAR(\"issuedDate\", 'YYYY-MM')");
        const monthlyRows = await Invoice.findAll({
          attributes: [
            [monthCol, 'month'],
            [fn('COALESCE', fn('SUM', col('totalAmount')), 0), 'invoiced'],
            [fn('COALESCE', fn('SUM', col('paidAmount')), 0), 'paid']
          ],
          where: { issuedDate: { [Op.ne]: null } },
          group: [monthCol],
          order: [[monthCol, 'ASC']],
          raw: true
        });

        response.invoiceStats = {
          totalInvoiced: parseFloat(totalInvoiced),
          totalPaid: parseFloat(totalPaid),
          outstanding: parseFloat(outstanding),
          counts: invoiceCounts
        };
        response.monthlyStats = monthlyRows.map((r) => ({
          month: r.month,
          invoiced: parseFloat(r.invoiced),
          paid: parseFloat(r.paid)
        }));
      } catch (invoiceError) {
        console.error('Dashboard stats: invoice stats failed, skipping:', invoiceError.message);
      }
    }

    res.json(response);
  } catch (error) {
    console.error('Get case stats error:', error.message);
    res.status(500).json({ error: 'خطأ في جلب الإحصائيات', details: error.message });
  }
};
