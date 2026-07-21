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
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
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
    try {
      const response = await api.get(`/invoices/${id}`);
      setInvoice(response.data.invoice);
    } catch (error) {
      toast.error('خطأ في جلب بيانات الفاتورة');
      navigate('/invoices');
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
      paid: 'مدفوع',
      partial: 'مدفوع جزئياً',
      pending: 'معلق',
      overdue: 'متأخر'
    };
    return <span className={`badge ${statusClasses[status] || ''}`}>{statusLabels[status] || t[status]}</span>;
  };

  const formatAmount = (amount) => {
    if (amount == null) return '-';
    return `${Number(amount).toFixed(3)} د.ك`;
  };

  const handlePaymentChange = (e) => {
    setPaymentForm({ ...paymentForm, [e.target.name]: e.target.value });
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    try {
      await api.post('/payments', { invoiceId: id, ...paymentForm });
      toast.success('تم إضافة الدفعة بنجاح');
      setPaymentForm({
        amount: '',
        paymentDate: format(new Date(), 'yyyy-MM-dd'),
        paymentMethod: 'cash',
        reference: '',
        notes: ''
      });
      fetchInvoice();
    } catch (error) {
      toast.error(error.response?.data?.details || error.response?.data?.error || 'خطأ في إضافة الدفعة');
    }
  };

  const handleDeletePayment = async (paymentId) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الدفعة؟')) {
      try {
        await api.delete(`/payments/${paymentId}`);
        toast.success('تم حذف الدفعة بنجاح');
        fetchInvoice();
      } catch (error) {
        toast.error('خطأ في حذف الدفعة');
      }
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await api.put(`/invoices/${id}`, { status: newStatus });
      toast.success('تم تحديث حالة الفاتورة');
      fetchInvoice();
    } catch (error) {
      toast.error('خطأ في تحديث الحالة');
    }
  };

  if (loading) {
    return <div className="loading">{t.loading}</div>;
  }

  if (!invoice) {
    return <div className="no-data">الفاتورة غير موجودة</div>;
  }

  return (
    <div className="invoice-details">
      <div className="card-header">
        <h2 className="card-title">فاتورة #{invoice.invoiceNumber}</h2>
        <div className="actions">
          <Link to={`/invoices/${id}/edit`} className="btn btn-primary">
            <FiEdit /> تعديل
          </Link>
          <button className="btn btn-secondary" onClick={() => window.print()}>
            <FiPrinter /> طباعة
          </button>
          <Link to="/invoices" className="btn btn-secondary">
            <FiArrowRight /> العودة للفواتير
          </Link>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3 className="card-title">تفاصيل الفاتورة</h3>
          <div className="details-grid">
            <div className="detail-item">
              <label>رقم الفاتورة</label>
              <span>{invoice.invoiceNumber || '-'}</span>
            </div>
            <div className="detail-item">
              <label>النوع</label>
              <span>{t[invoice.type] || invoice.type}</span>
            </div>
            <div className="detail-item">
              <label>حالة الدفع</label>
              {getStatusBadge(invoice.status)}
            </div>
            <div className="detail-item">
              <label>المبلغ</label>
              <span>{formatAmount(invoice.amount)}</span>
            </div>
            <div className="detail-item">
              <label>المبلغ المدفوع</label>
              <span>{formatAmount(invoice.paidAmount || 0)}</span>
            </div>
            <div className="detail-item">
              <label>المبلغ المتبقي</label>
              <span>{formatAmount(invoice.remainingAmount || invoice.amount)}</span>
            </div>
            <div className="detail-item">
              <label>تاريخ الإنشاء</label>
              <span>
                {invoice.createdAt
                  ? format(new Date(invoice.createdAt), 'dd/MM/yyyy', { locale: ar })
                  : '-'
                }
              </span>
            </div>
            <div className="detail-item">
              <label>تاريخ الاستحقاق</label>
              <span>
                {invoice.dueDate
                  ? format(new Date(invoice.dueDate), 'dd/MM/yyyy', { locale: ar })
                  : '-'
                }
              </span>
            </div>
            <div className="detail-item">
              <label>طريقة الدفع</label>
              <span>{invoice.paymentMethod || '-'}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">الموكل والقضية</h3>
          <div className="details-grid">
            <div className="detail-item">
              <label>الموكل</label>
              <span>{invoice.clientName || '-'}</span>
            </div>
            <div className="detail-item">
              <label>القضية</label>
              <span>
                {invoice.caseId ? (
                  <Link to={`/cases/${invoice.caseId}`}>{invoice.caseNumber || invoice.caseTitle || '-'}</Link>
                ) : '-'}
              </span>
            </div>
          </div>

          {invoice.status !== 'paid' && (
            <div style={{ marginTop: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>تغيير الحالة</label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {['paid', 'partial', 'pending', 'overdue'].map(s => (
                  <button
                    key={s}
                    className={`btn ${invoice.status === s ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => handleStatusChange(s)}
                    disabled={invoice.status === s}
                  >
                    <FiCheckCircle /> {s === 'paid' ? 'مدفوع' : s === 'partial' ? 'مدفوع جزئياً' : s === 'pending' ? 'معلق' : 'متأخر'}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {invoice.description && (
        <div className="card">
          <h3 className="card-title">الوصف</h3>
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
        <h3 className="card-title">سجل الدفعات</h3>

        {invoice.payments?.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>المبلغ</th>
                  <th>تاريخ الدفع</th>
                  <th>طريقة الدفع</th>
                  <th>المرجع</th>
                  <th>ملاحظات</th>
                  <th>إجراءات</th>
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
                      {payment.paymentMethod === 'cash' ? 'نقداً'
                        : payment.paymentMethod === 'bank_transfer' ? 'تحويل بنكي'
                        : payment.paymentMethod === 'cheque' ? 'شيك'
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
          <p className="no-data">لا توجد دفعات</p>
        )}

        <div className="card" style={{ marginTop: '1.5rem' }}>
          <h3 className="card-title">إضافة دفعة</h3>
          <form onSubmit={handleAddPayment}>
            <div className="grid grid-3">
              <div className="form-group">
                <label>المبلغ (د.ك) *</label>
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
                <label>تاريخ الدفع *</label>
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
                <label>طريقة الدفع *</label>
                <select
                  name="paymentMethod"
                  className="form-control"
                  value={paymentForm.paymentMethod}
                  onChange={handlePaymentChange}
                  required
                >
                  <option value="cash">نقداً</option>
                  <option value="bank_transfer">تحويل بنكي</option>
                  <option value="cheque">شيك</option>
                </select>
              </div>
              <div className="form-group">
                <label>المرجع</label>
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
                  إضافة دفعة
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
