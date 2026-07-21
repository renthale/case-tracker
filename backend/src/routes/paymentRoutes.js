const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const paymentController = require('../controllers/paymentController');
const { auth } = require('../middleware/auth');

router.use(auth);

router.post('/invoice/:invoiceId', [
  body('amount').isFloat({ min: 0.001 }).withMessage('المبلغ مطلوب'),
  body('paymentMethod').optional().isIn(['cash', 'bank_transfer', 'check', 'credit_card', 'other'])
], paymentController.addPayment);

router.get('/invoice/:invoiceId', paymentController.getPayments);

router.delete('/:id', paymentController.deletePayment);

module.exports = router;
