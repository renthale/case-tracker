const { Session, Case, Notification, User } = require('../models');
const { Op } = require('sequelize');
const { fn, col } = require('sequelize');

const updateCaseNextHearing = async (caseId) => {
  const nextSession = await Session.findOne({
    where: {
      caseId,
      date: { [Op.gte]: new Date() },
      status: { [Op.in]: ['scheduled', 'postponed'] }
    },
    order: [['date', 'ASC']]
  });
  await Case.update(
    { nextHearingDate: nextSession ? nextSession.date : null },
    { where: { id: caseId } }
  );
};

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

    await updateCaseNextHearing(caseId);

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

    await updateCaseNextHearing(session.caseId);

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

    const caseId = session.caseId;
    await session.destroy();

    await updateCaseNextHearing(caseId);

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

exports.uploadDocument = async (req, res) => {
  try {
    const session = await Session.findByPk(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'الجلسة غير موجودة' });
    }

    const { name, type, data } = req.body;
    if (!name || !data) {
      return res.status(400).json({ error: 'اسم المستند والبيانات مطلوبان' });
    }

    const existingDocs = session.documents || [];
    const newDoc = {
      name,
      type: type || 'image',
      data,
      uploadedAt: new Date().toISOString(),
      uploadedBy: req.user.id
    };

    await session.update({ documents: [...existingDocs, newDoc] });

    res.json({ message: 'تم رفع المستند بنجاح', documents: session.documents });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في رفع المستند', details: error.message });
  }
};

exports.deleteDocument = async (req, res) => {
  try {
    const session = await Session.findByPk(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'الجلسة غير موجودة' });
    }

    const docIndex = parseInt(req.params.docIndex);
    const existingDocs = session.documents || [];
    if (docIndex < 0 || docIndex >= existingDocs.length) {
      return res.status(404).json({ error: 'المستند غير موجود' });
    }

    existingDocs.splice(docIndex, 1);
    await session.update({ documents: existingDocs });

    res.json({ message: 'تم حذف المستند بنجاح', documents: session.documents });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في حذف المستند', details: error.message });
  }
};

exports.getDailyReport = async (req, res) => {
  try {
    const { date } = req.query;
    const reportDate = date || new Date().toISOString().split('T')[0];

    const sessions = await Session.findAll({
      where: {
        date: {
          [Op.and]: [
            { [Op.gte]: `${reportDate}T00:00:00` },
            { [Op.lte]: `${reportDate}T23:59:59` }
          ]
        }
      },
      include: [{ model: Case, attributes: ['id', 'title', 'caseNumber', 'court'] }],
      order: [['time', 'ASC']]
    });

    const total = sessions.length;
    const completed = sessions.filter(s => s.status === 'completed').length;
    const postponed = sessions.filter(s => s.status === 'postponed').length;
    const scheduled = sessions.filter(s => s.status === 'scheduled').length;
    const cancelled = sessions.filter(s => s.status === 'cancelled').length;

    res.json({
      date: reportDate,
      summary: { total, completed, postponed, scheduled, cancelled },
      sessions: sessions.map(s => ({
        id: s.id,
        caseTitle: s.Case?.title,
        caseNumber: s.Case?.caseNumber,
        court: s.Case?.court,
        sessionNumber: s.sessionNumber,
        time: s.time,
        location: s.location,
        status: s.status,
        outcome: s.outcome,
        postponedTo: s.postponedTo,
        documentsCount: (s.documents || []).length,
        notes: s.notes
      }))
    });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في إنشاء التقرير', details: error.message });
  }
};
