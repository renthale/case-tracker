const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { auth, authorize } = require('../middleware/auth');

router.post('/register', [
  body('username').trim().isLength({ min: 3 }),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('fullName').trim().notEmpty()
], authController.register);

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], authController.login);

router.get('/profile', auth, authController.getProfile);
router.put('/profile', auth, authController.updateProfile);
router.put('/change-password', auth, authController.changePassword);

// Lightweight user list for dropdowns (any authenticated user)
router.get('/users/list', auth, authController.getUserList);

// Admin user management
router.get('/users', auth, authorize('admin'), authController.getAllUsers);
router.post('/users', auth, authorize('admin'), authController.createUser);
router.put('/users/:id', auth, authorize('admin'), authController.updateUser);
router.post('/users/:id/reset-password', auth, authorize('admin'), authController.resetPassword);
router.delete('/users/:id', auth, authorize('admin'), authController.deleteUser);

module.exports = router;
