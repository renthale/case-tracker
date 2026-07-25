const { TimeEntry, Case, User } = require('../models');
const { Op } = require('sequelize');

exports.createTimeEntry = async (req, res) => {
  try {
    const { caseId, date, hours, description, billable, rate, category, notes } = req.body;

    if (!caseId || !hours || !description) {
      return res.status(400).json({ error: 'القضية والساعات والوصف مطلوبة' });
    }

    const caseRecord = await Case.findByPk(caseId);
    if (!caseRecord) {
      return res.status(404).json({ error: 'القضية غير موجودة' });
    }

    const timeEntry = await TimeEntry.create({
      caseId,
      userId: req.user.id,
      date: date || new Date().toISOString().split('T')[0],
      hours,
      description,
      billable: billable !== false,
      rate: rate || 0,
      category: category || 'general',
      notes
    });

    res.status(201).json({ message: 'تم إضافة الوقت بنجاح', timeEntry });
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map(e => e.message).join(', ');
      return res.status(400).json({ error: 'خطأ في البيانات', details: messages });
    }
    res.status(500).json({ error: 'خطأ في إضافة الوقت', details: error.message });
  }
};

exports.getTimeEntries = async (req, res) => {
  try {
    const {
      caseId, userId, startDate, endDate, billable, status,
      page = 1, limit = 20
    } = req.query;

    const where = {};

    if (caseId) where.caseId = caseId;
    if (userId) where.userId = userId;
    if (billable !== undefined) where.billable = billable === 'true';
    if (status) where.status = status;

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date[Op.gte] = startDate;
      if (endDate) where.date[Op.lte] = endDate;
    }

    if (req.user.role === 'lawyer' || req.user.role === 'trainee_lawyer') {
      where.userId = req.user.id;
    }

    const offset = (page - 1) * limit;

    const { count, rows: entries } = await TimeEntry.findAndCountAll({
      where,
      include: [
        { model: Case, as: 'case', attributes: ['id', 'caseNumber', 'title'] },
        { model: User, as: 'user', attributes: ['id', 'fullName'] }
      ],
      order: [['date', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const totalHours = entries.reduce((sum, e) => sum + parseFloat(e.hours), 0);
    const billableHours = entries.filter(e => e.billable).reduce((sum, e) => sum + parseFloat(e.hours), 0);
    const totalAmount = entries.reduce((sum, e) => sum + parseFloat(e.totalAmount), 0);

    res.json({
      entries,
      summary: {
        totalHours: totalHours.toFixed(2),
        billableHours: billableHours.toFixed(2),
        totalAmount: totalAmount.toFixed(3)
      },
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في جلب بيانات الوقت', details: error.message });
  }
};

exports.getTimeEntryById = async (req, res) => {
  try {
    const entry = await TimeEntry.findByPk(req.params.id, {
      include: [
        { model: Case, as: 'case', attributes: ['id', 'caseNumber', 'title'] },
        { model: User, as: 'user', attributes: ['id', 'fullName', 'email'] }
      ]
    });

    if (!entry) {
      return res.status(404).json({ error: 'السجل غير موجود' });
    }

    res.json({ timeEntry: entry });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في جلب السجل', details: error.message });
  }
};

exports.updateTimeEntry = async (req, res) => {
  try {
    const entry = await TimeEntry.findByPk(req.params.id);

    if (!entry) {
      return res.status(404).json({ error: 'السجل غير موجود' });
    }

    if (entry.userId !== req.user.id && !['admin', 'partner'].includes(req.user.role)) {
      return res.status(403).json({ error: 'ليس لديك صلاحية لتعديل هذا السجل' });
    }

    await entry.update(req.body);
    res.json({ message: 'تم تحديث السجل بنجاح', timeEntry: entry });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في تحديث السجل', details: error.message });
  }
};

exports.deleteTimeEntry = async (req, res) => {
  try {
    const entry = await TimeEntry.findByPk(req.params.id);

    if (!entry) {
      return res.status(404).json({ error: 'السجل غير موجود' });
    }

    if (entry.userId !== req.user.id && !['admin', 'partner'].includes(req.user.role)) {
      return res.status(403).json({ error: 'ليس لديك صلاحية لحذف هذا السجل' });
    }

    await entry.destroy();
    res.json({ message: 'تم حذف السجل بنجاح' });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في حذف السجل', details: error.message });
  }
};

exports.getTimeStats = async (req, res) => {
  try {
    const { startDate, endDate, caseId } = req.query;

    const where = {};
    if (caseId) where.caseId = caseId;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date[Op.gte] = startDate;
      if (endDate) where.date[Op.lte] = endDate;
    }

    const entries = await TimeEntry.findAll({ where });

    const totalHours = entries.reduce((sum, e) => sum + parseFloat(e.hours), 0);
    const billableHours = entries.filter(e => e.billable).reduce((sum, e) => sum + parseFloat(e.hours), 0);
    const nonBillableHours = totalHours - billableHours;
    const totalAmount = entries.reduce((sum, e) => sum + parseFloat(e.totalAmount), 0);

    const byCategory = {};
    entries.forEach(e => {
      if (!byCategory[e.category]) byCategory[e.category] = { hours: 0, amount: 0 };
      byCategory[e.category].hours += parseFloat(e.hours);
      byCategory[e.category].amount += parseFloat(e.totalAmount);
    });

    const byUser = {};
    entries.forEach(e => {
      if (!byUser[e.userId]) byUser[e.userId] = { hours: 0, amount: 0, count: 0 };
      byUser[e.userId].hours += parseFloat(e.hours);
      byUser[e.userId].amount += parseFloat(e.totalAmount);
      byUser[e.userId].count++;
    });

    res.json({
      summary: {
        totalHours: totalHours.toFixed(2),
        billableHours: billableHours.toFixed(2),
        nonBillableHours: nonBillableHours.toFixed(2),
        totalAmount: totalAmount.toFixed(3),
        utilizationRate: totalHours > 0 ? ((billableHours / totalHours) * 100).toFixed(1) : 0
      },
      byCategory,
      byUser
    });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في إحصائيات الوقت', details: error.message });
  }
};
