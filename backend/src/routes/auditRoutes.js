const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const { AuditLog, User } = require('../models');
const { Op } = require('sequelize');

router.use(auth);
router.use(authorize('admin'));

router.get('/', async (req, res) => {
  try {
    const {
      entityType, entityId, userId, action,
      startDate, endDate,
      page = 1, limit = 20
    } = req.query;

    const where = {};

    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (userId) where.userId = userId;
    if (action) where.action = action;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[Op.lte] = new Date(endDate);
    }

    const offset = (page - 1) * limit;

    const { count, rows: logs } = await AuditLog.findAndCountAll({
      where,
      include: [{ model: User, as: 'user', attributes: ['id', 'fullName', 'email'] }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      logs,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في جلب سجل التدقيق', details: error.message });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const { Op } = require('sequelize');

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentCount = await AuditLog.count({
      where: { createdAt: { [Op.gte]: thirtyDaysAgo } }
    });

    const byAction = await AuditLog.findAll({
      attributes: ['action', [require('sequelize').fn('COUNT', '*'), 'count']],
      where: { createdAt: { [Op.gte]: thirtyDaysAgo } },
      group: ['action']
    });

    const byEntity = await AuditLog.findAll({
      attributes: ['entityType', [require('sequelize').fn('COUNT', '*'), 'count']],
      where: { createdAt: { [Op.gte]: thirtyDaysAgo } },
      group: ['entityType']
    });

    const mostActive = await AuditLog.findAll({
      attributes: ['userId', [require('sequelize').fn('COUNT', '*'), 'count']],
      where: { createdAt: { [Op.gte]: thirtyDaysAgo } },
      include: [{ model: User, as: 'user', attributes: ['fullName'] }],
      group: ['userId', 'user.id'],
      order: [[require('sequelize').fn('COUNT', '*'), 'DESC']],
      limit: 5
    });

    res.json({
      recentCount,
      byAction,
      byEntity,
      mostActive
    });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في إحصائيات التدقيق', details: error.message });
  }
});

module.exports = router;
