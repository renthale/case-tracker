const { LegalDocument, Case, User } = require('../models');
const { Op } = require('sequelize');

exports.createDocument = async (req, res) => {
  try {
    if (req.body.caseId) {
      const caseRecord = await Case.findByPk(req.body.caseId);
      if (!caseRecord) {
        return res.status(404).json({ error: 'القضية غير موجودة' });
      }
    }

    const document = await LegalDocument.create({
      ...req.body,
      caseId: req.body.caseId || null,
      uploadedBy: req.user.id
    });

    res.status(201).json({ message: 'تم إنشاء المستند بنجاح', document });
  } catch (error) {
    console.error('Create document error:', error);
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map(e => e.message).join(', ');
      return res.status(400).json({ error: 'خطأ في البيانات', details: messages });
    }
    res.status(500).json({ error: 'خطأ في إنشاء المستند', details: error.message });
  }
};

exports.getDocuments = async (req, res) => {
  try {
    const {
      type, status, caseId, search,
      page = 1, limit = 10,
      sortBy = 'createdAt', sortOrder = 'DESC'
    } = req.query;

    const where = {};

    if (type) where.type = type;
    if (status) where.status = status;
    if (caseId) where.caseId = caseId;

    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { content: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const offset = (page - 1) * limit;

    const { count, rows: documents } = await LegalDocument.findAndCountAll({
      where,
      include: [
        { model: Case, as: 'case', attributes: ['id', 'caseNumber', 'title'] },
        { model: User, as: 'uploader', attributes: ['id', 'fullName'] }
      ],
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      documents,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في جلب المستندات', details: error.message });
  }
};

exports.getDocumentById = async (req, res) => {
  try {
    const document = await LegalDocument.findByPk(req.params.id, {
      include: [
        { model: Case, as: 'case', attributes: ['id', 'caseNumber', 'title'] },
        { model: User, as: 'uploader', attributes: ['id', 'fullName', 'email'] }
      ]
    });

    if (!document) {
      return res.status(404).json({ error: 'المستند غير موجود' });
    }

    res.json({ document });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في جلب المستند', details: error.message });
  }
};

exports.updateDocument = async (req, res) => {
  try {
    const document = await LegalDocument.findByPk(req.params.id);

    if (!document) {
      return res.status(404).json({ error: 'المستند غير موجود' });
    }

    await document.update(req.body);
    res.json({ message: 'تم تحديث المستند بنجاح', document });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في تحديث المستند', details: error.message });
  }
};

exports.deleteDocument = async (req, res) => {
  try {
    const document = await LegalDocument.findByPk(req.params.id);

    if (!document) {
      return res.status(404).json({ error: 'المستند غير موجود' });
    }

    await document.destroy();
    res.json({ message: 'تم حذف المستند بنجاح' });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في حذف المستند', details: error.message });
  }
};

exports.changeStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['draft', 'under_review', 'approved', 'archived'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'حالة غير صالحة', details: `الحالات المسموح بها: ${validStatuses.join(', ')}` });
    }

    const document = await LegalDocument.findByPk(req.params.id);

    if (!document) {
      return res.status(404).json({ error: 'المستند غير موجود' });
    }

    await document.update({ status });
    res.json({ message: 'تم تغيير حالة المستند بنجاح', document });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في تغيير الحالة', details: error.message });
  }
};
