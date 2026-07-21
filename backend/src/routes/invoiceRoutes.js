const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const invoiceController = require('../controllers/invoiceController');
const { auth, authorize } = require('../middleware/auth');

router.use(auth);

router.get('/stats', invoiceController.getInvoiceStats);
router.get('/overdue', invoiceController.checkOverdueInvoices);
router.get('/fees-report', invoiceController.getFeeReport);

router.get('/', invoiceController.getInvoices);

router.post('/', authorize('admin', 'partner', 'legal_secretary'), [
  body('clientId').isInt().withMessage('معرف العميل مطلوب'),
  body('totalAmount').isFloat({ min: 0 }).withMessage('المبلغ الإجمالي مطلوب')
], invoiceController.createInvoice);

router.get('/:id', invoiceController.getInvoiceById);

router.put('/:id', authorize('admin', 'partner', 'legal_secretary'), [
  body('totalAmount').optional().isFloat({ min: 0 })
], invoiceController.updateInvoice);

router.delete('/:id', authorize('admin', 'partner'), invoiceController.deleteInvoice);

module.exports = router;
