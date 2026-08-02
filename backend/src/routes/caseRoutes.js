const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const caseController = require('../controllers/caseController');
const financialController = require('../controllers/financialController');
const { auth, authorize, canManageFinancials } = require('../middleware/auth');
const { auditLog, captureOldValues } = require('../middleware/auditLog');
const { Case } = require('../models');
const { calculateCourtFees } = require('../utils/courtFeeCalculator');

router.use(auth);

router.get('/stats', caseController.getCaseStats);

router.get('/court-fees', (req, res) => {
  const { amount } = req.query;
  if (!amount) {
    return res.status(400).json({ error: 'المبلغ مطلوب' });
  }
  const result = calculateCourtFees(amount);
  res.json(result);
});

router.post('/', authorize('admin', 'partner', 'lawyer'), auditLog('Case'), [
  body('title').trim().notEmpty(),
  body('type').isIn(['civil', 'criminal', 'commercial', 'administrative', 'family', 'labor', 'sharia', 'traffic', 'other'])
], caseController.createCase);

router.get('/', caseController.getCases);
router.get('/:id', caseController.getCaseById);
router.get('/:id/timeline', caseController.getCaseTimeline);

router.get('/:id/financials', authorize(...canManageFinancials), financialController.getCaseFinancials);
router.get('/:id/unbilled-items', authorize(...canManageFinancials), financialController.getUnbilledItems);
router.get('/:id/fee-agreement', authorize(...canManageFinancials), financialController.getFeeAgreement);
router.put('/:id/fee-agreement', authorize(...canManageFinancials), financialController.upsertFeeAgreement);

router.put('/:id', captureOldValues(Case), auditLog('Case'), [
  body('title').optional().trim().notEmpty(),
  body('status').optional().isIn(['active', 'pending', 'closed', 'won', 'lost', 'settled', 'appeal', 'retrial', 'dismissed']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent'])
], caseController.updateCase);

router.delete('/:id', authorize('admin', 'partner'), auditLog('Case'), caseController.deleteCase);

module.exports = router;
