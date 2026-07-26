const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const clientPortalController = require('../controllers/clientPortalController');
const { auth, authorize } = require('../middleware/auth');
const { ClientPortalUser, Client } = require('../models');

// Public routes
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], clientPortalController.portalLogin);

// Admin routes (use main app auth, not portal auth)
router.get('/admin/list', auth, authorize('admin', 'partner'), async (req, res) => {
  try {
    const portalUsers = await ClientPortalUser.findAll({
      include: [{ model: Client, as: 'client', attributes: ['id', 'name', 'email', 'phone'] }],
      attributes: ['id', 'email', 'isActive', 'lastLogin', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });
    res.json({ portalUsers });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في جلب المستخدمين', details: error.message });
  }
});

router.get('/admin/available-clients', auth, authorize('admin', 'partner'), async (req, res) => {
  try {
    const allClients = await Client.findAll({
      attributes: ['id', 'name', 'email', 'phone'],
      order: [['name', 'ASC']]
    });
    const portalClientIds = (await ClientPortalUser.findAll({ attributes: ['clientId'] })).map(p => p.clientId);
    const available = allClients.filter(c => !portalClientIds.includes(c.id));
    res.json({ clients: available, total: allClients.length, withPortal: portalClientIds.length });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في جلب العملاء', details: error.message });
  }
});

router.post('/admin/create', auth, authorize('admin'), [
  body('clientId').isInt(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  try {
    const { clientId, email, password } = req.body;
    const client = await Client.findByPk(clientId);
    if (!client) return res.status(404).json({ error: 'العميل غير موجود' });

    const existing = await ClientPortalUser.findOne({ where: { clientId } });
    if (existing) return res.status(400).json({ error: 'هذا العميل لديه حساب بالفعل' });

    const emailExists = await ClientPortalUser.findOne({ where: { email } });
    if (emailExists) return res.status(400).json({ error: 'البريد الإلكتروني مستخدم بالفعل' });

    const portalUser = await ClientPortalUser.create({ clientId, email, password, isActive: true });
    res.status(201).json({ message: 'تم إنشاء حساب العميل', portalUser: { id: portalUser.id, email: portalUser.email } });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في إنشاء الحساب', details: error.message });
  }
});

router.put('/admin/:id/toggle', auth, authorize('admin'), async (req, res) => {
  try {
    const portalUser = await ClientPortalUser.findByPk(req.params.id);
    if (!portalUser) return res.status(404).json({ error: 'المستخدم غير موجود' });
    await portalUser.update({ isActive: !portalUser.isActive });
    res.json({ message: `تم ${portalUser.isActive ? 'تفعيل' : 'تعطيل'} الحساب`, isActive: portalUser.isActive });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في تحديث الحساب', details: error.message });
  }
});

router.delete('/admin/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const portalUser = await ClientPortalUser.findByPk(req.params.id);
    if (!portalUser) return res.status(404).json({ error: 'المستخدم غير موجود' });
    await portalUser.destroy();
    res.json({ message: 'تم حذف الحساب' });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في حذف الحساب', details: error.message });
  }
});

router.post('/admin/:id/reset-password', auth, authorize('admin'), [
  body('password').isLength({ min: 6 })
], async (req, res) => {
  try {
    const portalUser = await ClientPortalUser.findByPk(req.params.id);
    if (!portalUser) return res.status(404).json({ error: 'المستخدم غير موجود' });
    await portalUser.update({ password: req.body.password });
    res.json({ message: 'تم إعادة تعيين كلمة المرور' });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في إعادة التعيين', details: error.message });
  }
});

// Protected portal routes
router.use(clientPortalController.portalAuth);

router.post('/logout', clientPortalController.portalLogout);
router.get('/profile', clientPortalController.getMyProfile);
router.get('/cases', clientPortalController.getMyCases);
router.get('/cases/:id', clientPortalController.getMyCaseDetails);
router.get('/invoices', clientPortalController.getMyInvoices);

module.exports = router;
