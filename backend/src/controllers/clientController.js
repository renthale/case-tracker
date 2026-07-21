const { Client, Case, Invoice, Payment } = require('../models');
const { Op } = require('sequelize');

exports.createClient = async (req, res) => {
  try {
    const client = await Client.create(req.body);
    res.status(201).json({ message: 'تم إنشاء العميل بنجاح', client });
  } catch (error) {
    console.error('Create client error:', error);
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map(e => e.message).join(', ');
      return res.status(400).json({ error: 'خطأ في البيانات', details: messages });
    }
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'العميل موجود مسبقاً', details: 'رقم الهوية مسجل مسبقاً' });
    }
    res.status(500).json({ error: 'خطأ في إنشاء العميل', details: error.message });
  }
};

exports.getClients = async (req, res) => {
  try {
    const {
      search, isActive,
      page = 1, limit = 10,
      sortBy = 'createdAt', sortOrder = 'DESC'
    } = req.query;

    const where = {};

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { civilId: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const offset = (page - 1) * limit;

    const { count, rows: clients } = await Client.findAndCountAll({
      where,
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      clients,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في جلب العملاء', details: error.message });
  }
};

exports.getClientById = async (req, res) => {
  try {
    const client = await Client.findByPk(req.params.id, {
      include: [
        { model: Case, as: 'cases', attributes: ['id', 'caseNumber', 'title', 'status', 'type'] },
        { 
          model: Invoice, 
          as: 'invoices', 
          attributes: ['id', 'invoiceNumber', 'totalAmount', 'paidAmount', 'status', 'dueDate'],
          include: [
            { model: Payment, as: 'payments', attributes: ['id', 'amount', 'paymentDate', 'paymentMethod', 'referenceNumber'] }
          ]
        }
      ]
    });

    if (!client) {
      return res.status(404).json({ error: 'العميل غير موجود' });
    }

    res.json({ client });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في جلب العميل', details: error.message });
  }
};

exports.updateClient = async (req, res) => {
  try {
    const client = await Client.findByPk(req.params.id);

    if (!client) {
      return res.status(404).json({ error: 'العميل غير موجود' });
    }

    await client.update(req.body);
    res.json({ message: 'تم تحديث بيانات العميل بنجاح', client });
  } catch (error) {
    console.error('Update client error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'رقم الهوية مسجل مسبقاً لعميل آخر' });
    }
    res.status(500).json({ error: 'خطأ في تحديث العميل', details: error.message });
  }
};

exports.deleteClient = async (req, res) => {
  try {
    const client = await Client.findByPk(req.params.id);

    if (!client) {
      return res.status(404).json({ error: 'العميل غير موجود' });
    }

    const caseCount = await Case.count({ where: { clientId: client.id } });
    if (caseCount > 0) {
      return res.status(400).json({ error: 'لا يمكن حذف العميل لوجود قضايا مرتبطة به', details: `يوجد ${caseCount} قضية مرتبطة` });
    }

    await client.destroy();
    res.json({ message: 'تم حذف العميل بنجاح' });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في حذف العميل', details: error.message });
  }
};
