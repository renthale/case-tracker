const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const sessionController = require('../controllers/sessionController');
const { auth, authorize } = require('../middleware/auth');

router.use(auth);

router.get('/upcoming', sessionController.getUpcomingSessions);
router.get('/daily-report', sessionController.getDailyReport);
router.get('/', sessionController.getSessions);

router.post('/case/:caseId', authorize('admin', 'partner', 'lawyer', 'court_agent'), [
  body('date').isISO8601(),
  body('location').optional().trim()
], sessionController.createSession);

router.get('/:id', sessionController.getSessionById);

router.put('/:id', authorize('admin', 'partner', 'lawyer', 'court_agent'), [
  body('status').optional().isIn(['scheduled', 'completed', 'postponed', 'cancelled'])
], sessionController.updateSession);

router.post('/:id/documents', authorize('admin', 'partner', 'lawyer', 'court_agent'), sessionController.uploadDocument);

router.delete('/:id/documents/:docIndex', authorize('admin', 'partner', 'lawyer', 'court_agent'), sessionController.deleteDocument);

router.delete('/:id', authorize('admin', 'partner'), sessionController.deleteSession);

module.exports = router;
