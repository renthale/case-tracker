const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const transactionController = require('../controllers/transactionController');
const { auth } = require('../middleware/auth');

router.use(auth);

router.get('/stats', transactionController.getTransactionStats);

router.get('/', transactionController.getTransactions);

router.post('/', [
  body('type').isIn(['income', 'expense']).withMessage('نوع المعاملة مطلوب'),
  body('amount').isFloat({ min: 0.001 }).withMessage('المبلغ مطلوب')
], transactionController.createTransaction);

router.get('/:id', transactionController.getTransactionById);

router.put('/:id', [
  body('type').optional().isIn(['income', 'expense']),
  body('amount').optional().isFloat({ min: 0 })
], transactionController.updateTransaction);

router.delete('/:id', transactionController.deleteTransaction);

module.exports = router;
