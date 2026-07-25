const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const timeEntryController = require('../controllers/timeEntryController');
const { auth, authorize } = require('../middleware/auth');

router.use(auth);

router.get('/stats', timeEntryController.getTimeStats);

router.post('/', authorize('admin', 'partner', 'lawyer', 'trainee_lawyer', 'legal_consultant', 'court_agent'), [
  body('caseId').isInt().withMessage('معرف القضية مطلوب'),
  body('hours').isFloat({ min: 0.25, max: 24 }).withMessage('الساعات يجب أن تكون بين 0.25 و 24'),
  body('description').trim().notEmpty().withMessage('الوصف مطلوب')
], timeEntryController.createTimeEntry);

router.get('/', timeEntryController.getTimeEntries);
router.get('/:id', timeEntryController.getTimeEntryById);

router.put('/:id', timeEntryController.updateTimeEntry);
router.delete('/:id', timeEntryController.deleteTimeEntry);

module.exports = router;
