const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const invoiceController = require('../controllers/invoiceController');
const { auth } = require('../middleware/auth');

router.use(auth);

router.get('/stats', invoiceController.getInvoiceStats);

router.get('/', invoiceController.getInvoices);

router.post('/', [
  body('clientId').isInt().withMessage('معرف العميل مطلوب'),
  body('totalAmount').isFloat({ min: 0 }).withMessage('المبلغ الإجمالي مطلوب')
], invoiceController.createInvoice);

router.get('/:id', invoiceController.getInvoiceById);

router.put('/:id', [
  body('totalAmount').optional().isFloat({ min: 0 })
], invoiceController.updateInvoice);

router.delete('/:id', invoiceController.deleteInvoice);

module.exports = router;
