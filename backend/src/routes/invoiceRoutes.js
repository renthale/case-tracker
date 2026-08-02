const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const invoiceController = require('../controllers/invoiceController');
const { auth, authorize, canManageFinancials } = require('../middleware/auth');
const { Invoice, Client, Case } = require('../models');
const { generateInvoicePDF } = require('../utils/pdfGenerator');

router.use(auth);

router.get('/stats', authorize(...canManageFinancials), invoiceController.getInvoiceStats);
router.get('/overdue', authorize(...canManageFinancials), invoiceController.checkOverdueInvoices);
router.get('/fees-report', authorize(...canManageFinancials), invoiceController.getFeeReport);

router.get('/', authorize(...canManageFinancials), invoiceController.getInvoices);

router.post('/', authorize(...canManageFinancials), [
  body('clientId').isInt().withMessage('معرف العميل مطلوب')
], invoiceController.createInvoice);

router.get('/:id', authorize(...canManageFinancials), invoiceController.getInvoiceById);

router.get('/:id/pdf', authorize(...canManageFinancials), async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id, {
      include: [
        { model: Client, as: 'client' },
        { model: Case, as: 'case' },
        { model: require('../models/InvoiceLine'), as: 'lines' }
      ]
    });

    if (!invoice) {
      return res.status(404).json({ error: 'الفاتورة غير موجودة' });
    }

    const pdfBuffer = await generateInvoicePDF(invoice, invoice.client, invoice.case);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ error: 'خطأ في إنشاء ملف PDF', details: error.message });
  }
});

router.put('/:id', authorize('admin', 'partner', 'legal_secretary'), [
  body('totalAmount').optional().isFloat({ min: 0 })
], invoiceController.updateInvoice);

router.delete('/:id', authorize('admin', 'partner'), invoiceController.deleteInvoice);

module.exports = router;
