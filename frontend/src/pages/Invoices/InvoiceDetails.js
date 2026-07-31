import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';
import { FiEdit, FiArrowRight, FiPrinter, FiTrash2, FiCheckCircle } from 'react-icons/fi';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import toast from 'react-hot-toast';

const InvoiceDetails = () => {
  const { id } = useParams();
  const { t, language } = useLanguage();
  const isArabic = language === 'ar';
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentDate: format(new Date(), 'yyyy-MM-dd'),
    paymentMethod: 'cash',
    reference: '',
    notes: ''
  });

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const fetchInvoice = async () => {
    setFetchError(false);
    setLoading(true);
    try {
      const response = await api.get(`/invoices/${id}`);
      setInvoice(response.data.invoice);
    } catch (error) {
      toast.error(isArabic ? 'خطأ في جلب بيانات الفاتورة' : 'Error fetching invoice data');
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      paid: 'badge-won',
      partial: 'badge-pending',
      pending: 'badge-pending',
      overdue: 'badge-lost'
    };
    const statusLabels = {
      paid: isArabic ? 'مدفوع' : 'Paid',
      partial: isArabic ? 'مدفوع جزئياً' : 'Partially Paid',
      pending: isArabic ? 'معلق' : 'Pending',
      overdue: isArabic ? 'متأخر' : 'Overdue'
    };
    return <span className={`badge ${statusClasses[status] || ''}`}>{statusLabels[status] || t[status]}</span>;
  };

  const formatAmount = (amount) => {
    if (amount == null) return '-';
    return `${Number(amount).toFixed(3)} ${isArabic ? 'د.ك' : 'KWD'}`;
  };

  const handlePaymentChange = (e) => {
    setPaymentForm({ ...paymentForm, [e.target.name]: e.target.value });
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/payments/invoice/${id}`, paymentForm);
      toast.success(isArabic ? 'تم إضافة الدفعة بنجاح' : 'Payment added successfully');
      setPaymentForm({
        amount: '',
        paymentDate: format(new Date(), 'yyyy-MM-dd'),
        paymentMethod: 'cash',
        reference: '',
        notes: ''
      });
      fetchInvoice();
    } catch (error) {
      toast.error(error.response?.data?.details || error.response?.data?.error || (isArabic ? 'خطأ في إضافة الدفعة' : 'Error adding payment'));
    }
  };

  const handleDeletePayment = async (paymentId) => {
    if (window.confirm(isArabic ? 'هل أنت متأكد من حذف هذه الدفعة؟' : 'Are you sure you want to delete this payment?')) {
      try {
        await api.delete(`/payments/${paymentId}`);
        toast.success(isArabic ? 'تم حذف الدفعة بنجاح' : 'Payment deleted successfully');
        fetchInvoice();
      } catch (error) {
        toast.error(isArabic ? 'خطأ في حذف الدفعة' : 'Error deleting payment');
      }
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await api.put(`/invoices/${id}`, { status: newStatus });
      toast.success(isArabic ? 'تم تحديث حالة الفاتورة' : 'Invoice status updated');
      fetchInvoice();
    } catch (error) {
      toast.error(isArabic ? 'خطأ في تحديث الحالة' : 'Error updating status');
    }
  };

  if (loading) {
    return <div className="loading">{t.loading}</div>;
  }

  if (fetchError) {
    return (
      <div className="error-state">
        <p>{isArabic ? 'خطأ في جلب بيانات الفاتورة' : 'Error fetching invoice data'}</p>
        <button className="btn btn-primary" onClick={fetchInvoice}>{t.retry || (isArabic ? 'إعادة المحاولة' : 'Retry')}</button>
      </div>
    );
  }

  if (!invoice) {
    return <div className="no-data">{isArabic ? 'الفاتورة غير موجودة' : 'Invoice not found'}</div>;
  }

  return (
    <div className="invoice-details">
      <div className="card-header">
        <h2 className="card-title">{isArabic ? 'فاتورة' : 'Invoice'} #{invoice.invoiceNumber}</h2>
        <div className="actions">
          <Link to={`/dashboard/invoices/${id}/edit`} className="btn btn-primary">
            <FiEdit /> {isArabic ? 'تعديل' : 'Edit'}
          </Link>
          <button className="btn btn-secondary" onClick={() => window.print()}>
            <FiPrinter /> {isArabic ? 'طباعة' : 'Print'}
          </button>
          <Link to="/dashboard/invoices" className="btn btn-secondary">
            <FiArrowRight /> {isArabic ? 'العودة للفواتير' : 'Back to Invoices'}
          </Link>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3 className="card-title">{isArabic ? 'تفاصيل الفاتورة' : 'Invoice Details'}</h3>
          <div className="details-grid">
            <div className="detail-item">
              <label>{isArabic ? 'رقم الفاتورة' : 'Invoice #'}</label>
              <span>{invoice.invoiceNumber || '-'}</span>
            </div>
            <div className="detail-item">
              <label>{isArabic ? 'النوع' : 'Type'}</label>
              <span>{t[invoice.type] || invoice.type}</span>
            </div>
            <div className="detail-item">
              <label>{isArabic ? 'حالة الدفع' : 'Payment Status'}</label>
              {getStatusBadge(invoice.status)}
            </div>
            <div className="detail-item">
              <label>{isArabic ? 'المبلغ' : 'Amount'}</label>
              <span>{formatAmount(invoice.amount)}</span>
            </div>
            <div className="detail-item">
              <label>{isArabic ? 'المبلغ المدفوع' : 'Paid Amount'}</label>
              <span>{formatAmount(invoice.paidAmount || 0)}</span>
            </div>
            <div className="detail-item">
              <label>{isArabic ? 'المبلغ المتبقي' : 'Remaining Amount'}</label>
              <span>{formatAmount(invoice.remainingAmount || invoice.amount)}</span>
            </div>
            <div className="detail-item">
              <label>{isArabic ? 'تاريخ الإنشاء' : 'Created Date'}</label>
              <span>
                {invoice.createdAt
                  ? format(new Date(invoice.createdAt), 'dd/MM/yyyy', { locale: ar })
                  : '-'
                }
              </span>
            </div>
            <div className="detail-item">
              <label>{isArabic ? 'تاريخ الاستحقاق' : 'Due Date'}</label>
              <span>
                {invoice.dueDate
                  ? format(new Date(invoice.dueDate), 'dd/MM/yyyy', { locale: ar })
                  : '-'
                }
              </span>
            </div>
            <div className="detail-item">
              <label>{isArabic ? 'طريقة الدفع' : 'Payment Method'}</label>
              <span>{invoice.paymentMethod || '-'}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">{isArabic ? 'الموكل والقضية' : 'Client & Case'}</h3>
          <div className="details-grid">
            <div className="detail-item">
              <label>{isArabic ? 'الموكل' : 'Client'}</label>
              <span>{invoice.clientName || '-'}</span>
            </div>
            <div className="detail-item">
              <label>{isArabic ? 'القضية' : 'Case'}</label>
              <span>
                {invoice.caseId ? (
                  <Link to={`/dashboard/cases/${invoice.caseId}`}>{invoice.caseNumber || invoice.caseTitle || '-'}</Link>
                ) : '-'}
              </span>
            </div>
          </div>

          {invoice.status !== 'paid' && (
            <div style={{ marginTop: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>{isArabic ? 'تغيير الحالة' : 'Change Status'}</label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {['paid', 'partial', 'pending', 'overdue'].map(s => (
                  <button
                    key={s}
                    className={`btn ${invoice.status === s ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => handleStatusChange(s)}
                    disabled={invoice.status === s}
                  >
                    <FiCheckCircle /> {s === 'paid' ? (isArabic ? 'مدفوع' : 'Paid') : s === 'partial' ? (isArabic ? 'مدفوع جزئياً' : 'Partial') : s === 'pending' ? (isArabic ? 'معلق' : 'Pending') : (isArabic ? 'متأخر' : 'Overdue')}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {invoice.description && (
        <div className="card">
          <h3 className="card-title">{isArabic ? 'الوصف' : 'Description'}</h3>
          <p>{invoice.description}</p>
        </div>
      )}

      {invoice.notes && (
        <div className="card">
          <h3 className="card-title">{t.notes}</h3>
          <p>{invoice.notes}</p>
        </div>
      )}

      <div className="card">
        <h3 className="card-title">{isArabic ? 'سجل الدفعات' : 'Payment History'}</h3>

        {invoice.payments?.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>{isArabic ? 'المبلغ' : 'Amount'}</th>
                  <th>{isArabic ? 'تاريخ الدفع' : 'Payment Date'}</th>
                  <th>{isArabic ? 'طريقة الدفع' : 'Method'}</th>
                  <th>{isArabic ? 'المرجع' : 'Reference'}</th>
                  <th>{isArabic ? 'ملاحظات' : 'Notes'}</th>
                  <th>{isArabic ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {invoice.payments.map((payment) => (
                  <tr key={payment.id}>
                    <td>{formatAmount(payment.amount)}</td>
                    <td>
                      {payment.paymentDate
                        ? format(new Date(payment.paymentDate), 'dd/MM/yyyy', { locale: ar })
                        : '-'
                      }
                    </td>
                    <td>
                      {payment.paymentMethod === 'cash' ? (isArabic ? 'نقداً' : 'Cash')
                        : payment.paymentMethod === 'bank_transfer' ? (isArabic ? 'تحويل بنكي' : 'Bank Transfer')
                        : payment.paymentMethod === 'cheque' ? (isArabic ? 'شيك' : 'Cheque')
                        : payment.paymentMethod || '-'
                      }
                    </td>
                    <td>{payment.reference || '-'}</td>
                    <td>{payment.notes || '-'}</td>
                    <td>
                      <button
                        className="btn btn-danger"
                        title={t.delete}
                        onClick={() => handleDeletePayment(payment.id)}
                      >
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="no-data">{isArabic ? 'لا توجد دفعات' : 'No payments'}</p>
        )}

        <div className="card" style={{ marginTop: '1.5rem' }}>
          <h3 className="card-title">{isArabic ? 'إضافة دفعة' : 'Add Payment'}</h3>
          <form onSubmit={handleAddPayment}>
            <div className="grid grid-3">
              <div className="form-group">
                <label>{isArabic ? 'المبلغ (د.ك)' : 'Amount (KWD)'} *</label>
                <input
                  type="number"
                  name="amount"
                  className="form-control"
                  value={paymentForm.amount}
                  onChange={handlePaymentChange}
                  step="0.001"
                  min="0"
                  required
                />
              </div>
              <div className="form-group">
                <label>{isArabic ? 'تاريخ الدفع' : 'Payment Date'} *</label>
                <input
                  type="date"
                  name="paymentDate"
                  className="form-control"
                  value={paymentForm.paymentDate}
                  onChange={handlePaymentChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>{isArabic ? 'طريقة الدفع' : 'Payment Method'} *</label>
                <select
                  name="paymentMethod"
                  className="form-control"
                  value={paymentForm.paymentMethod}
                  onChange={handlePaymentChange}
                  required
                >
                  <option value="cash">{isArabic ? 'نقداً' : 'Cash'}</option>
                  <option value="bank_transfer">{isArabic ? 'تحويل بنكي' : 'Bank Transfer'}</option>
                  <option value="cheque">{isArabic ? 'شيك' : 'Cheque'}</option>
                </select>
              </div>
              <div className="form-group">
                <label>{isArabic ? 'المرجع' : 'Reference'}</label>
                <input
                  type="text"
                  name="reference"
                  className="form-control"
                  value={paymentForm.reference}
                  onChange={handlePaymentChange}
                />
              </div>
              <div className="form-group">
                <label>{t.notes}</label>
                <input
                  type="text"
                  name="notes"
                  className="form-control"
                  value={paymentForm.notes}
                  onChange={handlePaymentChange}
                />
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button type="submit" className="btn btn-primary">
                  {isArabic ? 'إضافة دفعة' : 'Add Payment'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetails;
