const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const paymentController = require('../controllers/paymentController');
const { auth, authorize, canManageFinancials } = require('../middleware/auth');

router.use(auth);

router.post('/invoice/:invoiceId', authorize(...canManageFinancials), [
  body('amount').isFloat({ min: 0.001 }).withMessage('المبلغ مطلوب'),
  body('paymentMethod').optional().isIn(['cash', 'bank_transfer', 'check', 'credit_card', 'knet', 'other'])
], paymentController.addPayment);

router.get('/invoice/:invoiceId', authorize(...canManageFinancials), paymentController.getPayments);

router.post('/', authorize(...canManageFinancials), [
  body('amount').isFloat({ min: 0.001 }).withMessage('المبلغ مطلوب'),
  body('paymentMethod').optional().isIn(['cash', 'bank_transfer', 'check', 'credit_card', 'knet', 'other'])
], paymentController.addCasePayment);

router.get('/', authorize(...canManageFinancials), paymentController.getPayments);

router.delete('/:id', authorize(...canManageFinancials), paymentController.deletePayment);

module.exports = router;
