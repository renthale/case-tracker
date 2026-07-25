const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendarController');
const { auth } = require('../middleware/auth');

router.use(auth);

router.get('/sessions.ics', calendarController.downloadCalendar);

module.exports = router;
