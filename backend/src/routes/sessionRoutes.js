const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const sessionController = require('../controllers/sessionController');
const { auth } = require('../middleware/auth');

router.use(auth);

router.get('/upcoming', sessionController.getUpcomingSessions);
router.get('/', sessionController.getSessions);

router.post('/case/:caseId', [
  body('date').isISO8601(),
  body('location').optional().trim()
], sessionController.createSession);

router.get('/:id', sessionController.getSessionById);

router.put('/:id', [
  body('status').optional().isIn(['scheduled', 'completed', 'postponed', 'cancelled'])
], sessionController.updateSession);

router.delete('/:id', sessionController.deleteSession);

module.exports = router;
