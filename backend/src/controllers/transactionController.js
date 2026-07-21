const { Transaction, Case, Client, Invoice, User } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

exports.createTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.create({
      ...req.body,
      createdBy: req.user.id
    });

    res.status(201).json({ message: 'تم إنشاء المعاملة بنجاح', transaction });
  } catch (error) {
    console.error('Create transaction error:', error);
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map(e => e.message).join(', ');
      return res.status(400).json({ error: 'خطأ في البيانات', details: messages });
    }
    res.status(500).json({ error: 'خطأ في إنشاء المعاملة', details: error.message });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const {
      status, type, caseId, clientId, category,
      dateFrom, dateTo,
      page = 1, limit = 10,
      sortBy = 'createdAt', sortOrder = 'DESC'
    } = req.query;

    const where = {};

    if (status) where.status = status;
    if (type) where.type = type;
    if (caseId) where.caseId = caseId;
    if (clientId) where.clientId = clientId;
    if (category) where.category = category;

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt[Op.gte] = new Date(dateFrom);
      if (dateTo) where.createdAt[Op.lte] = new Date(dateTo);
    }

    const offset = (page - 1) * limit;

    const { count, rows: transactions } = await Transaction.findAndCountAll({
      where,
      include: [
        { model: Case, as: 'case', attributes: ['id', 'caseNumber', 'title'] },
        { model: Client, as: 'client', attributes: ['id', 'name'] },
        { model: User, as: 'creator', attributes: ['id', 'fullName'] }
      ],
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      transactions,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في جلب المعاملات', details: error.message });
  }
};

exports.getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findByPk(req.params.id, {
      include: [
        { model: Case, as: 'case', attributes: ['id', 'caseNumber', 'title'] },
        { model: Client, as: 'client', attributes: ['id', 'name', 'phone'] },
        { model: Invoice, as: 'invoice', attributes: ['id', 'invoiceNumber', 'totalAmount'] },
        { model: User, as: 'creator', attributes: ['id', 'fullName'] }
      ]
    });

    if (!transaction) {
      return res.status(404).json({ error: 'المعاملة غير موجودة' });
    }

    res.json({ transaction });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في جلب المعاملة', details: error.message });
  }
};

exports.updateTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findByPk(req.params.id);

    if (!transaction) {
      return res.status(404).json({ error: 'المعاملة غير موجودة' });
    }

    await transaction.update(req.body);
    res.json({ message: 'تم تحديث المعاملة بنجاح', transaction });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في تحديث المعاملة', details: error.message });
  }
};

exports.deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findByPk(req.params.id);

    if (!transaction) {
      return res.status(404).json({ error: 'المعاملة غير موجودة' });
    }

    await transaction.destroy();
    res.json({ message: 'تم حذف المعاملة بنجاح' });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في حذف المعاملة', details: error.message });
  }
};

exports.getTransactionStats = async (req, res) => {
  try {
    const countByStatus = await Transaction.findAll({
      attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count'], [sequelize.fn('SUM', sequelize.col('amount')), 'total']],
      group: ['status']
    });

    const countByType = await Transaction.findAll({
      attributes: ['type', [sequelize.fn('COUNT', sequelize.col('id')), 'count'], [sequelize.fn('SUM', sequelize.col('amount')), 'total']],
      group: ['type']
    });

    res.json({ countByStatus, countByType });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في جلب إحصائيات المعاملات', details: error.message });
  }
};
