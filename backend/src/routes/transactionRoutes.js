const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const transactionController = require('../controllers/transactionController');
const { auth } = require('../middleware/auth');

router.use(auth);

router.get('/stats', transactionController.getTransactionStats);

router.get('/', transactionController.getTransactions);

router.post('/', [
  body('title').trim().notEmpty().withMessage('عنوان المعاملة مطلوب'),
  body('governmentEntity').trim().notEmpty().withMessage('الجهة الحكومية مطلوبة')
], transactionController.createTransaction);

router.get('/:id', transactionController.getTransactionById);

router.put('/:id', [
  body('title').optional().trim().notEmpty(),
  body('governmentEntity').optional().trim().notEmpty()
], transactionController.updateTransaction);

router.delete('/:id', transactionController.deleteTransaction);

module.exports = router;
