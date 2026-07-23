const { Case, Session, User, Notification, Client, Invoice, LegalDocument } = require('../models');
const { Op } = require('sequelize');

exports.createCase = async (req, res) => {
  try {
    let caseNumber = req.body.caseNumber;
    if (!caseNumber) {
      const year = new Date().getFullYear();
      const count = await Case.count();
      caseNumber = `${year}-25-${String(count + 1).padStart(4, '0')}`;
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
    const caseRecord = await Case.findByPk(req.params.id, {
      include: [
        { model: User, as: 'assignedLawyer', attributes: ['id', 'fullName', 'email'] },
        { model: User, as: 'courtAgent', attributes: ['id', 'fullName', 'email'] },
        { model: Client, as: 'client' },
        { model: Session, as: 'sessions', order: [['date', 'DESC']] },
        { model: Invoice, as: 'invoices', attributes: ['id', 'invoiceNumber', 'totalAmount', 'paidAmount', 'status', 'dueDate'] },
        { model: LegalDocument, as: 'legalDocuments', attributes: ['id', 'title', 'type', 'status', 'createdAt'] },
        { model: Notification, as: 'notifications', order: [['createdAt', 'DESC']], limit: 10 }
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
    const isAdminOrPartner = ['admin', 'partner'].includes(req.user.role);

    if (!isAssignedLawyer && !isSecondaryLawyer && !isAdminOrPartner) {
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

exports.getCaseStats = async (req, res) => {
  try {
    const totalCases = await Case.count();
    const activeCases = await Case.count({ where: { status: 'active' } });
    const pendingCases = await Case.count({ where: { status: 'pending' } });
    const closedCases = await Case.count({ where: { status: 'closed' } });
    const wonCases = await Case.count({ where: { status: 'won' } });
    const lostCases = await Case.count({ where: { status: 'lost' } });

    const casesByType = await Case.findAll({
      attributes: ['type', [require('sequelize').fn('COUNT', '*'), 'count']],
      group: ['type']
    });

    const casesByPriority = await Case.findAll({
      attributes: ['priority', [require('sequelize').fn('COUNT', '*'), 'count']],
      group: ['priority']
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

    const totalInvoicePending = await Invoice.sum('totalAmount', { where: { status: 'pending' } }) || 0;
    const totalInvoicePaid = await Invoice.sum('paidAmount', { where: { status: 'paid' } }) || 0;

    res.json({
      stats: {
        total: totalCases,
        active: activeCases,
        pending: pendingCases,
        closed: closedCases,
        won: wonCases,
        lost: lostCases
      },
      casesByType,
      casesByPriority,
      upcomingSessions,
      invoiceStats: {
        totalPending: parseFloat(totalInvoicePending),
        totalPaid: parseFloat(totalInvoicePaid)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في جلب الإحصائيات' });
  }
};
