const { Payment, Invoice } = require('../models');

exports.addPayment = async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.invoiceId);

    if (!invoice) {
      return res.status(404).json({ error: 'الفاتورة غير موجودة' });
    }

    if (invoice.status === 'cancelled') {
      return res.status(400).json({ error: 'لا يمكن إضافة دفعة لفاتورة ملغاة' });
    }

    const payment = await Payment.create({
      ...req.body,
      invoiceId: invoice.id
    });

    const totalPaid = parseFloat(invoice.paidAmount) + parseFloat(payment.amount);
    const newStatus = totalPaid >= parseFloat(invoice.totalAmount) ? 'paid' : invoice.status;

    await invoice.update({ paidAmount: totalPaid, status: newStatus });

    res.status(201).json({ message: 'تم إضافة الدفعة بنجاح', payment, invoice });
  } catch (error) {
    console.error('Add payment error:', error);
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map(e => e.message).join(', ');
      return res.status(400).json({ error: 'خطأ في البيانات', details: messages });
    }
    res.status(500).json({ error: 'خطأ في إضافة الدفعة', details: error.message });
  }
};

exports.getPayments = async (req, res) => {
  try {
    const payments = await Payment.findAll({
      where: { invoiceId: req.params.invoiceId },
      order: [['paymentDate', 'DESC']]
    });

    res.json({ payments });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في جلب المدفوعات', details: error.message });
  }
};

exports.deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findByPk(req.params.id);

    if (!payment) {
      return res.status(404).json({ error: 'الدفعة غير موجودة' });
    }

    const invoice = await Invoice.findByPk(payment.invoiceId);
    if (!invoice) {
      return res.status(404).json({ error: 'الفاتورة غير موجودة' });
    }

    await payment.destroy();

    const totalPaid = parseFloat(invoice.paidAmount) - parseFloat(payment.amount);
    const newStatus = totalPaid <= 0 ? 'pending' : totalPaid >= parseFloat(invoice.totalAmount) ? 'paid' : 'pending';

    await invoice.update({ paidAmount: Math.max(0, totalPaid), status: newStatus });

    res.json({ message: 'تم حذف الدفعة بنجاح', invoice });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في حذف الدفعة', details: error.message });
  }
};
