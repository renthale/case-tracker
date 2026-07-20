const { Notification, Case, Session } = require('../models');
const { Op } = require('sequelize');

exports.getNotifications = async (req, res) => {
  try {
    const { unreadOnly, page = 1, limit = 20 } = req.query;

    const where = { userId: req.user.id };
    if (unreadOnly === 'true') {
      where.isRead = false;
    }

    const offset = (page - 1) * limit;

    const { count, rows: notifications } = await Notification.findAndCountAll({
      where,
      include: [
        { model: Case, attributes: ['id', 'title', 'caseNumber'] },
        { model: Session, attributes: ['id', 'sessionNumber', 'date'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const unreadCount = await Notification.count({
      where: { userId: req.user.id, isRead: false }
    });

    res.json({
      notifications,
      unreadCount,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في جلب الإشعارات' });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!notification) {
      return res.status(404).json({ error: 'الإشعار غير موجود' });
    }

    await notification.update({ isRead: true });

    res.json({ message: 'تم تحديد الإشعار كمقروء' });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في تحديث الإشعار' });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.update(
      { isRead: true },
      { where: { userId: req.user.id, isRead: false } }
    );

    res.json({ message: 'تم تحديد جميع الإشعارات كمقروءة' });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في تحديث الإشعارات' });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!notification) {
      return res.status(404).json({ error: 'الإشعار غير موجود' });
    }

    await notification.destroy();

    res.json({ message: 'تم حذف الإشعار' });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في حذف الإشعار' });
  }
};
