const { Session, Case, Notification } = require('../models');
const { Op } = require('sequelize');

exports.createSession = async (req, res) => {
  try {
    const { caseId } = req.params;

    const caseRecord = await Case.findByPk(caseId);
    if (!caseRecord) {
      return res.status(404).json({ error: 'القضية غير موجودة' });
    }

    const isAssignedLawyer = caseRecord.assignedLawyerId === req.user.id;
    const isCourtAgent = req.user.role === 'court_agent';
    const isAdminOrPartner = ['admin', 'partner'].includes(req.user.role);

    if (!isAssignedLawyer && !isCourtAgent && !isAdminOrPartner) {
      return res.status(403).json({ error: 'ليس لديك صلاحية لإنشاء جلسة لهذه القضية' });
    }

    const sessionCount = await Session.count({ where: { caseId } });

    const session = await Session.create({
      ...req.body,
      caseId,
      sessionNumber: sessionCount + 1
    });

    await Case.update(
      { nextHearingDate: session.date },
      { where: { id: caseId } }
    );

    await Notification.create({
      userId: req.user.id,
      caseId,
      sessionId: session.id,
      type: 'session_scheduled',
      title: 'جلسة جديدة',
      message: `تم جدولة جلسة جديدة للقضية "${caseRecord.title}"`,
      priority: 'medium'
    });

    res.status(201).json({ message: 'تم إنشاء الجلسة بنجاح', session });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في إنشاء الجلسة', details: error.message });
  }
};

exports.getSessions = async (req, res) => {
  try {
    const { caseId, status, upcoming, page = 1, limit = 10 } = req.query;

    const where = {};
    if (caseId) where.caseId = caseId;
    if (status) where.status = status;

    if (upcoming === 'true') {
      where.date = { [Op.gte]: new Date() };
      where.status = 'scheduled';
    }

    const offset = (page - 1) * limit;

    const { count, rows: sessions } = await Session.findAndCountAll({
      where,
      include: [{ model: Case, attributes: ['id', 'title', 'caseNumber'] }],
      order: [['date', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      sessions,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في جلب الجلسات' });
  }
};

exports.getSessionById = async (req, res) => {
  try {
    const session = await Session.findByPk(req.params.id, {
      include: [{ model: Case }]
    });

    if (!session) {
      return res.status(404).json({ error: 'الجلسة غير موجودة' });
    }

    res.json({ session });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في جلب الجلسة' });
  }
};

exports.updateSession = async (req, res) => {
  try {
    const session = await Session.findByPk(req.params.id);

    if (!session) {
      return res.status(404).json({ error: 'الجلسة غير موجودة' });
    }

    const caseRecord = await Case.findByPk(session.caseId);

    const isAssignedLawyer = caseRecord && caseRecord.assignedLawyerId === req.user.id;
    const isCourtAgent = req.user.role === 'court_agent';
    const isAdminOrPartner = ['admin', 'partner'].includes(req.user.role);

    if (!isAssignedLawyer && !isCourtAgent && !isAdminOrPartner) {
      return res.status(403).json({ error: 'ليس لديك صلاحية لتحديث هذه الجلسة' });
    }

    const oldStatus = session.status;
    await session.update(req.body);

    if (oldStatus !== req.body.status) {
      await Notification.create({
        userId: req.user.id,
        caseId: session.caseId,
        sessionId: session.id,
        type: 'session_reminder',
        title: 'تحديث حالة الجلسة',
        message: `تم تغيير حالة الجلسة رقم ${session.sessionNumber} للقضية "${caseRecord?.title}"`,
        priority: 'high'
      });
    }

    res.json({ message: 'تم تحديث الجلسة بنجاح', session });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في تحديث الجلسة' });
  }
};

exports.deleteSession = async (req, res) => {
  try {
    const session = await Session.findByPk(req.params.id);

    if (!session) {
      return res.status(404).json({ error: 'الجلسة غير موجودة' });
    }

    await session.destroy();

    res.json({ message: 'تم حذف الجلسة بنجاح' });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في حذف الجلسة' });
  }
};

exports.getUpcomingSessions = async (req, res) => {
  try {
    const sessions = await Session.findAll({
      where: {
        date: { [Op.gte]: new Date() },
        status: 'scheduled'
      },
      include: [{ model: Case, attributes: ['id', 'title', 'caseNumber', 'court'] }],
      order: [['date', 'ASC']],
      limit: 10
    });

    res.json({ sessions });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في جلب الجلسات القادمة' });
  }
};
