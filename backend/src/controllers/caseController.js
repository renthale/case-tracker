const { Case, Session, User, Notification } = require('../models');
const { Op } = require('sequelize');

exports.createCase = async (req, res) => {
  try {
    let caseNumber = req.body.caseNumber;
    if (!caseNumber) {
      const count = await Case.count();
      caseNumber = `CASE-${String(count + 1).padStart(4, '0')}`;
    }

    const caseData = {
      ...req.body,
      caseNumber,
      assignedLawyerId: req.user.id
    };

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
      status, type, priority, search, 
      page = 1, limit = 10,
      sortBy = 'createdAt', sortOrder = 'DESC'
    } = req.query;

    const where = {};
    
    if (status) where.status = status;
    if (type) where.type = type;
    if (priority) where.priority = priority;
    
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { caseNumber: { [Op.iLike]: `%${search}%` } },
        { clientName: { [Op.iLike]: `%${search}%` } },
        { opposingParty: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const offset = (page - 1) * limit;
    
    const { count, rows: cases } = await Case.findAndCountAll({
      where,
      include: [
        { model: User, as: 'assignedLawyer', attributes: ['id', 'fullName'] }
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
        { model: Session, as: 'sessions', order: [['date', 'DESC']] },
        { model: Notification, as: 'notifications', order: [['createdAt', 'DESC']], limit: 10 }
      ]
    });

    if (!caseRecord) {
      return res.status(404).json({ error: 'القضية غير موجودة' });
    }

    res.json({ case: caseRecord });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في جلب القضية' });
  }
};

exports.updateCase = async (req, res) => {
  try {
    const caseRecord = await Case.findByPk(req.params.id);

    if (!caseRecord) {
      return res.status(404).json({ error: 'القضية غير موجودة' });
    }

    const oldStatus = caseRecord.status;
    await caseRecord.update(req.body);

    if (oldStatus !== req.body.status) {
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
    res.status(500).json({ error: 'خطأ في تحديث القضية' });
  }
};

exports.deleteCase = async (req, res) => {
  try {
    const caseRecord = await Case.findByPk(req.params.id);

    if (!caseRecord) {
      return res.status(404).json({ error: 'القضية غير موجودة' });
    }

    await caseRecord.destroy();

    res.json({ message: 'تم حذف القضية بنجاح' });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في حذف القضية' });
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
      upcomingSessions
    });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في جلب الإحصائيات' });
  }
};
