const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const financialController = require('../controllers/financialController');
const { auth, authorize, canManageFinancials } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(auth);

router.get('/', authorize(...canManageFinancials), financialController.getFinancialEntries);

router.post('/', authorize(...canManageFinancials), [
  body('type').isIn(['professional_fee', 'case_expense', 'session_expense']).withMessage('نوع الإدخال مطلوب'),
  body('caseId').isInt().withMessage('معرف القضية مطلوب'),
  body('amount').isFloat({ min: 0.001 }).withMessage('المبلغ مطلوب')
], financialController.createFinancialEntry);

router.get('/:id', authorize(...canManageFinancials), financialController.getFinancialEntryById);

router.put('/:id', authorize(...canManageFinancials), financialController.updateFinancialEntry);

router.delete('/:id', authorize(...canManageFinancials), financialController.deleteFinancialEntry);

router.post('/:id/receipt', authorize(...canManageFinancials), upload.single('file'), financialController.uploadReceipt);

module.exports = router;
