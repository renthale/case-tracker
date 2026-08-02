const { Payment, Invoice, FinancialEntry, Case } = require('../models');

const getInvoiceEntries = async (invoice) => {
  const { InvoiceLine } = require('../models');
  const lines = await InvoiceLine.findAll({ where: { invoiceId: invoice.id } });
  return lines.filter(l => l.sourceId);
};

const markInvoiceEntriesPaid = async (invoice) => {
  const lines = await getInvoiceEntries(invoice);
  for (const line of lines) {
    await FinancialEntry.update(
      { billingStatus: 'paid' },
      { where: { id: line.sourceId } }
    );
  }
};

const revertInvoiceEntriesToInvoiced = async (invoice) => {
  const lines = await getInvoiceEntries(invoice);
  for (const line of lines) {
    await FinancialEntry.update(
      { billingStatus: 'invoiced' },
      { where: { id: line.sourceId } }
    );
  }
};

const computeInvoiceStatus = (invoice, totalPaid) => {
  if (invoice.status === 'cancelled') return invoice.status;
  if (totalPaid <= 0) return 'sent';
  const roundedPaid = Math.round(totalPaid * 1000) / 1000;
  const roundedTotal = Math.round(parseFloat(invoice.totalAmount) * 1000) / 1000;
  if (roundedPaid >= roundedTotal) return 'paid';
  return 'partially_paid';
};

exports.addPayment = async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.invoiceId);

    if (!invoice) {
      return res.status(404).json({ error: 'الفاتورة غير موجودة' });
    }

    if (invoice.status === 'cancelled') {
      return res.status(400).json({ error: 'لا يمكن إضافة دفعة لفاتورة ملغاة' });
    }

    if (invoice.status === 'draft') {
      return res.status(400).json({ error: 'لا يمكن إضافة دفعة لفاتورة مسودة — أرسل الفاتورة أولاً' });
    }

    const currentPaid = parseFloat(invoice.paidAmount);
    const amount = parseFloat(req.body.amount);
    const remaining = parseFloat(invoice.totalAmount) - currentPaid;

    if (amount > remaining + 0.001) {
      return res.status(400).json({ error: 'المبلغ يتجاوز الرصيد المستحق للفاتورة' });
    }

    const payment = await Payment.create({
      ...req.body,
      invoiceId: invoice.id,
      caseId: invoice.caseId || req.body.caseId || null,
      clientId: invoice.clientId || req.body.clientId || null
    });

    const totalPaid = currentPaid + amount;
    const newStatus = computeInvoiceStatus(invoice, totalPaid);

    await invoice.update({ paidAmount: totalPaid, status: newStatus });

    if (newStatus === 'paid') {
      await markInvoiceEntriesPaid(invoice);
    }

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

exports.addCasePayment = async (req, res) => {
  try {
    const caseId = req.body.caseId || req.params.caseId;

    if (!caseId) {
      return res.status(400).json({ error: 'رقم القضية مطلوب' });
    }

    const caseRecord = await Case.findByPk(caseId);
    if (!caseRecord) {
      return res.status(404).json({ error: 'القضية غير موجودة' });
    }

    const amount = parseFloat(req.body.amount);
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'المبلغ مطلوب' });
    }

    const payment = await Payment.create({
      ...req.body,
      caseId: caseRecord.id,
      clientId: req.body.clientId || caseRecord.clientId || null,
      invoiceId: req.body.invoiceId || null
    });

    if (payment.invoiceId) {
      const invoice = await Invoice.findByPk(payment.invoiceId);
      if (invoice && invoice.caseId !== caseRecord.id) {
        await payment.destroy();
        return res.status(400).json({ error: 'الفاتورة لا تنتمي إلى هذه القضية' });
      }
      if (invoice) {
        const currentPaid = parseFloat(invoice.paidAmount);
        const remaining = parseFloat(invoice.totalAmount) - currentPaid;
        if (amount > remaining + 0.001) {
          await payment.destroy();
          return res.status(400).json({ error: 'المبلغ يتجاوز الرصيد المستحق للفاتورة' });
        }
        const totalPaid = currentPaid + amount;
        const newStatus = computeInvoiceStatus(invoice, totalPaid);
        await invoice.update({ paidAmount: totalPaid, status: newStatus });
        if (newStatus === 'paid') {
          await markInvoiceEntriesPaid(invoice);
        }
      }
    }

    res.status(201).json({ message: 'تم إضافة الدفعة بنجاح', payment });
  } catch (error) {
    console.error('Add case payment error:', error);
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map(e => e.message).join(', ');
      return res.status(400).json({ error: 'خطأ في البيانات', details: messages });
    }
    res.status(500).json({ error: 'خطأ في إضافة الدفعة', details: error.message });
  }
};

exports.getPayments = async (req, res) => {
  try {
    const where = {};

    if (req.params.invoiceId) {
      where.invoiceId = req.params.invoiceId;
    }
    if (req.query.caseId) {
      where.caseId = req.query.caseId;
    }
    if (req.query.clientId) {
      where.clientId = req.query.clientId;
    }

    const payments = await Payment.findAll({
      where: Object.keys(where).length ? where : undefined,
      include: [{ model: Invoice, as: 'invoice', attributes: ['id', 'invoiceNumber', 'status', 'totalAmount'] }],
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

    if (payment.invoiceId) {
      const invoice = await Invoice.findByPk(payment.invoiceId);
      if (invoice) {
        const beforePaid = parseFloat(invoice.paidAmount);
        const wasFullyPaid = beforePaid >= parseFloat(invoice.totalAmount);
        const totalPaid = Math.max(0, beforePaid - parseFloat(payment.amount));
        const newStatus = computeInvoiceStatus(invoice, totalPaid);

        await invoice.update({ paidAmount: totalPaid, status: newStatus });

        if (wasFullyPaid) {
          await revertInvoiceEntriesToInvoiced(invoice);
        }
      }
    }

    await payment.destroy();

    res.json({ message: 'تم حذف الدفعة بنجاح' });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في حذف الدفعة', details: error.message });
  }
};
