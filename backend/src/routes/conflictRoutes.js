const express = require('express');
const router = express.Router();
const conflictController = require('../controllers/conflictController');
const { auth } = require('../middleware/auth');

router.use(auth);

router.post('/check', conflictController.checkConflict);

module.exports = router;
