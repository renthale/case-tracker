const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const clientController = require('../controllers/clientController');
const { auth } = require('../middleware/auth');

router.use(auth);

router.get('/', clientController.getClients);

router.post('/', [
  body('name').trim().notEmpty().withMessage('اسم العميل مطلوب'),
  body('civilId').optional().trim(),
  body('phone').optional().trim(),
  body('email').optional().isEmail().withMessage('بريد غير صالح')
], clientController.createClient);

router.get('/:id', clientController.getClientById);

router.put('/:id', [
  body('name').optional().trim().notEmpty(),
  body('email').optional().isEmail()
], clientController.updateClient);

router.delete('/:id', clientController.deleteClient);

module.exports = router;
