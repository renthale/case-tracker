const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const clientPortalController = require('../controllers/clientPortalController');

// Public routes
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], clientPortalController.portalLogin);

// Protected portal routes
router.use(clientPortalController.portalAuth);

router.post('/logout', clientPortalController.portalLogout);
router.get('/profile', clientPortalController.getMyProfile);
router.get('/cases', clientPortalController.getMyCases);
router.get('/cases/:id', clientPortalController.getMyCaseDetails);
router.get('/invoices', clientPortalController.getMyInvoices);

module.exports = router;
