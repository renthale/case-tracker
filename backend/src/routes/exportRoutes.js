const express = require('express');
const router = express.Router();
const exportController = require('../controllers/exportController');
const { auth, authorize } = require('../middleware/auth');

router.use(auth);
router.use(authorize('admin', 'partner'));

router.get('/cases', exportController.exportCases);
router.get('/clients', exportController.exportClients);
router.get('/invoices', exportController.exportInvoices);

module.exports = router;
