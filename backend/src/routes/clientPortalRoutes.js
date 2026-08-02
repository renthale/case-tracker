const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const clientPortalController = require('../controllers/clientPortalController');
const { auth, authorize } = require('../middleware/auth');
const { ClientPortalUser, Client } = require('../models');
const { generateToken, hashToken, expiresAt } = require('../utils/tokenService');
const { sendPortalInvitation, PORTAL_BASE } = require('../utils/emailService');

const serializeAdminUser = (pu) => ({
  id: pu.id,
  email: pu.email,
  isActive: pu.isActive,
  lastLogin: pu.lastLogin,
  createdAt: pu.createdAt,
  invitationSentAt: pu.invitationSentAt,
  invitationTokenExpiry: pu.invitationTokenExpiry,
  status: pu.isActive ? (pu.password ? 'active' : 'invited') : 'disabled',
  client: pu.client
});

// Public routes
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], clientPortalController.portalLogin);

router.get('/invite/:token', clientPortalController.getInvitation);

router.post('/invite/:token/set-password', clientPortalController.acceptInvitation);

router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail()
], clientPortalController.requestPasswordReset);

router.post('/reset-password/:token', clientPortalController.completePasswordReset);

// Admin routes (use main app auth, not portal auth)
router.get('/admin/list', auth, authorize('admin', 'partner'), async (req, res) => {
  try {
    const portalUsers = await ClientPortalUser.findAll({
      attributes: { exclude: ['invitationToken', 'passwordResetToken'] },
      include: [{ model: Client, as: 'client', attributes: ['id', 'name', 'email', 'phone'] }],
      order: [['createdAt', 'DESC']]
    });
    res.json({ portalUsers: portalUsers.map(serializeAdminUser) });
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

router.post('/admin/invite', auth, authorize('admin'), [
  body('clientId').isInt(),
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const { clientId, email } = req.body;
    const client = await Client.findByPk(clientId);
    if (!client) return res.status(404).json({ error: 'العميل غير موجود' });

    const existing = await ClientPortalUser.findOne({ where: { clientId } });
    if (existing) return res.status(400).json({ error: 'هذا العميل لديه حساب بالفعل' });

    const emailExists = await ClientPortalUser.findOne({ where: { email } });
    if (emailExists) return res.status(400).json({ error: 'البريد الإلكتروني مستخدم بالفعل' });

    const rawToken = generateToken();
    const portalUser = await ClientPortalUser.create({
      clientId,
      email,
      password: null,
      isActive: true,
      invitationToken: hashToken(rawToken),
      invitationTokenExpiry: expiresAt('invitation'),
      invitationSentAt: new Date()
    });

    const invitationUrl = `${PORTAL_BASE}/invite/${rawToken}`;
    sendPortalInvitation(client, email, rawToken, invitationUrl).catch(err => {
      console.error('Failed to send portal invitation email:', err.message);
    });

    res.status(201).json({
      message: 'تم إنشاء حساب العميل وإرسال الدعوة',
      portalUser: serializeAdminUser(portalUser),
      invitationLink: invitationUrl
    });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في إنشاء الحساب', details: error.message });
  }
});

router.post('/admin/resend-invitation/:clientId', auth, authorize('admin', 'partner'), async (req, res) => {
  try {
    const client = await Client.findByPk(req.params.clientId);
    if (!client) return res.status(404).json({ error: 'العميل غير موجود' });

    const portalUser = await ClientPortalUser.findOne({ where: { clientId: client.id } });
    if (!portalUser) return res.status(404).json({ error: 'هذا العميل ليس لديه حساب بوابة' });
    if (portalUser.password) return res.status(400).json({ error: 'الحساب مفعل بالفعل - استخدم خيار إعادة تعيين كلمة المرور' });

    const rawToken = generateToken();
    await portalUser.update({
      invitationToken: hashToken(rawToken),
      invitationTokenExpiry: expiresAt('invitation'),
      invitationSentAt: new Date(),
      isActive: true
    });

    const invitationUrl = `${PORTAL_BASE}/invite/${rawToken}`;
    sendPortalInvitation(client, portalUser.email, rawToken, invitationUrl).catch(err => {
      console.error('Failed to send portal invitation email:', err.message);
    });

    res.json({
      message: 'تم إعادة إرسال الدعوة للعميل',
      invitationLink: invitationUrl
    });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في الإرسال', details: error.message });
  }
});

router.put('/admin/:id/toggle', auth, authorize('admin'), async (req, res) => {
  try {
    const portalUser = await ClientPortalUser.findByPk(req.params.id);
    if (!portalUser) return res.status(404).json({ error: 'المستخدم غير موجود' });
    await portalUser.update({ isActive: !portalUser.isActive, token: null });
    res.json({ message: `تم ${portalUser.isActive ? 'تفعيل' : 'تعطيل'} الحساب`, isActive: portalUser.isActive });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في تحديث الحساب', details: error.message });
  }
});

router.post('/admin/:id/generate-reset-link', auth, authorize('admin'), clientPortalController.generateAdminResetLink);

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

// Protected portal routes
router.use(clientPortalController.portalAuth);

router.post('/logout', clientPortalController.portalLogout);
router.get('/profile', clientPortalController.getMyProfile);
router.get('/cases', clientPortalController.getMyCases);
router.get('/cases/:id', clientPortalController.getMyCaseDetails);
router.get('/invoices', clientPortalController.getMyInvoices);
router.get('/sessions', clientPortalController.getMySessions);
router.get('/documents', clientPortalController.getMyDocuments);
router.get('/payments', clientPortalController.getMyPayments);

module.exports = router;
