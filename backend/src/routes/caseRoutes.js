const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const caseController = require('../controllers/caseController');
const { auth } = require('../middleware/auth');

router.use(auth);

router.get('/stats', caseController.getCaseStats);

router.post('/', [
  body('caseNumber').trim().notEmpty(),
  body('title').trim().notEmpty(),
  body('type').isIn(['civil', 'criminal', 'commercial', 'administrative', 'family', 'labor', 'other'])
], caseController.createCase);

router.get('/', caseController.getCases);
router.get('/:id', caseController.getCaseById);

router.put('/:id', [
  body('title').optional().trim().notEmpty(),
  body('status').optional().isIn(['active', 'pending', 'closed', 'won', 'lost', 'settled', 'appeal']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent'])
], caseController.updateCase);

router.delete('/:id', caseController.deleteCase);

module.exports = router;
