const { Case, User, Session } = require('../models');
const { Op } = require('sequelize');

exports.getUpcomingDeadlines = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const now = new Date();
    const futureDate = new Date(now.getTime() + parseInt(days) * 24 * 60 * 60 * 1000);

    const cases = await Case.findAll({
      where: {
        status: { [Op.in]: ['won', 'lost', 'closed'] },
        verdictDate: { [Op.not]: null },
        appealDate: null
      },
      include: [
        { model: User, as: 'assignedLawyer', attributes: ['id', 'fullName'] },
        { model: User, as: 'courtAgent', attributes: ['id', 'fullName'] }
      ]
    });

    const deadlines = cases.map(caseRecord => {
      const verdictDate = new Date(caseRecord.verdictDate);
      const appealDeadline = new Date(verdictDate.getTime() + 30 * 24 * 60 * 60 * 1000);
      const daysUntil = Math.ceil((appealDeadline - now) / (1000 * 60 * 60 * 24));
      const isUrgent = daysUntil <= 7;
      const isPast = daysUntil < 0;

      return {
        caseId: caseRecord.id,
        caseNumber: caseRecord.caseNumber,
        title: caseRecord.title,
        court: caseRecord.court,
        verdictDate: caseRecord.verdictDate,
        appealDeadline: appealDeadline.toISOString().split('T')[0],
        daysUntil,
        isUrgent,
        isPast,
        status: caseRecord.status,
        assignedLawyer: caseRecord.assignedLawyer?.fullName,
        courtAgent: caseRecord.courtAgent?.fullName
      };
    });

    deadlines.sort((a, b) => a.daysUntil - b.daysUntil);

    const active = deadlines.filter(d => !d.isPast);
    const overdue = deadlines.filter(d => d.isPast);

    res.json({
      total: deadlines.length,
      active: active.length,
      overdue: overdue.length,
      urgent: active.filter(d => d.isUrgent).length,
      deadlines: active
    });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في جلب مواعيد الاستئناف', details: error.message });
  }
};

exports.getCaseDeadline = async (req, res) => {
  try {
    const caseRecord = await Case.findByPk(req.params.id);

    if (!caseRecord) {
      return res.status(404).json({ error: 'القضية غير موجودة' });
    }

    if (!caseRecord.verdictDate) {
      return res.json({ hasDeadline: false });
    }

    const verdictDate = new Date(caseRecord.verdictDate);
    const appealDeadline = new Date(verdictDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const daysUntil = Math.ceil((appealDeadline - now) / (1000 * 60 * 60 * 24));

    res.json({
      hasDeadline: true,
      verdictDate: caseRecord.verdictDate,
      appealDeadline: appealDeadline.toISOString().split('T')[0],
      daysUntil,
      isUrgent: daysUntil <= 7,
      isPast: daysUntil < 0,
      appealFiled: !!caseRecord.appealDate
    });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في جلب ميعاد الاستئناف', details: error.message });
  }
};
