const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const legalDocumentController = require('../controllers/legalDocumentController');
const { auth, authorize } = require('../middleware/auth');

router.use(auth);

router.get('/', legalDocumentController.getDocuments);

router.post('/', authorize('admin', 'partner', 'lawyer', 'legal_consultant', 'trainee_lawyer'), [
  body('caseId').isInt().withMessage('معرف القضية مطلوب'),
  body('title').trim().notEmpty().withMessage('عنوان المستند مطلوب'),
  body('type').isIn(['contract', 'petition', 'judgment', 'evidence', 'correspondence', 'memo', 'other']).withMessage('نوع المستند غير صالح')
], legalDocumentController.createDocument);

router.get('/:id', legalDocumentController.getDocumentById);

router.put('/:id', authorize('admin', 'partner', 'lawyer', 'legal_consultant', 'trainee_lawyer'), [
  body('title').optional().trim().notEmpty(),
  body('type').optional().isIn(['contract', 'petition', 'judgment', 'evidence', 'correspondence', 'memo', 'other'])
], legalDocumentController.updateDocument);

router.delete('/:id', authorize('admin', 'partner'), legalDocumentController.deleteDocument);

router.patch('/:id/status', authorize('admin', 'partner', 'legal_consultant'), [
  body('status').isIn(['draft', 'under_review', 'approved', 'archived']).withMessage('حالة غير صالحة')
], legalDocumentController.changeStatus);

module.exports = router;
