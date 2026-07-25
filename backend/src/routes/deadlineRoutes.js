const express = require('express');
const router = express.Router();
const deadlineController = require('../controllers/deadlineController');
const { auth } = require('../middleware/auth');

router.use(auth);

router.get('/', deadlineController.getUpcomingDeadlines);
router.get('/case/:id', deadlineController.getCaseDeadline);

module.exports = router;
