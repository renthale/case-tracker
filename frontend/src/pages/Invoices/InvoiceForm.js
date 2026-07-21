import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

const InvoiceForm = () => {
  const { id } = useParams();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [clients, setClients] = useState([]);
  const [cases, setCases] = useState([]);
  const [formData, setFormData] = useState({
    clientId: '',
    caseId: '',
    type: 'consultation',
    description: '',
    amount: '',
    dueDate: '',
    paymentMethod: '',
    notes: ''
  });

  useEffect(() => {
    loadOptions();
    if (id) {
      fetchInvoice();
    } else {
      setFetching(false);
    }
  }, [id]);

  const loadOptions = async () => {
    try {
      const [clientsRes, casesRes] = await Promise.all([
        api.get('/clients'),
        api.get('/cases', { params: { limit: 100 } })
      ]);
      setClients(clientsRes.data.clients || clientsRes.data);
      setCases(casesRes.data.cases || casesRes.data);
    } catch (error) {
      // non-blocking
    }
  };

  const fetchInvoice = async () => {
    try {
      const response = await api.get(`/invoices/${id}`);
      const invoice = response.data.invoice;
      setFormData({
        clientId: invoice.clientId || '',
        caseId: invoice.caseId || '',
        type: invoice.type || 'consultation',
        description: invoice.description || '',
        amount: invoice.amount || '',
        dueDate: invoice.dueDate?.split('T')[0] || '',
        paymentMethod: invoice.paymentMethod || '',
        notes: invoice.notes || ''
      });
    } catch (error) {
      toast.error('خطأ في جلب بيانات الفاتورة');
      navigate('/invoices');
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const cleanedData = { ...formData };
    Object.keys(cleanedData).forEach(key => {
      if (cleanedData[key] === '') cleanedData[key] = null;
    });

    try {
      if (id) {
        await api.put(`/invoices/${id}`, cleanedData);
        toast.success('تم تحديث الفاتورة بنجاح');
      } else {
        await api.post('/invoices', cleanedData);
        toast.success('تم إنشاء الفاتورة بنجاح');
      }
      navigate('/invoices');
    } catch (error) {
      toast.error(error.response?.data?.details || error.response?.data?.error || 'خطأ في حفظ الفاتورة');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="loading">{t.loading}</div>;
  }

  return (
    <div className="invoice-form">
      <div className="card-header">
        <h2 className="card-title">{id ? 'تعديل الفاتورة' : 'إضافة فاتورة'}</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-2">
          <div className="card">
            <h3 className="card-title">بيانات الفاتورة</h3>

            <div className="form-group">
              <label>الموكل *</label>
              <select
                name="clientId"
                className="form-control"
                value={formData.clientId}
                onChange={handleChange}
                required
              >
                <option value="">اختر الموكل</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>القضية</label>
              <select
                name="caseId"
                className="form-control"
                value={formData.caseId}
                onChange={handleChange}
              >
                <option value="">اختر القضية (اختياري)</option>
                {cases.map(c => (
                  <option key={c.id} value={c.id}>{c.caseNumber || c.title} - {c.title}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>النوع *</label>
              <select
                name="type"
                className="form-control"
                value={formData.type}
                onChange={handleChange}
                required
              >
                <option value="consultation">استشارة</option>
                <option value="litigation">تقاضي</option>
                <option value="session">جلسة</option>
                <option value="documents">مستندات</option>
                <option value="other">أخرى</option>
              </select>
            </div>

            <div className="form-group">
              <label>الوصف</label>
              <textarea
                name="description"
                className="form-control"
                rows="3"
                value={formData.description}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>المبلغ (د.ك) *</label>
              <input
                type="number"
                name="amount"
                className="form-control"
                value={formData.amount}
                onChange={handleChange}
                step="0.001"
                min="0"
                required
              />
            </div>

            <div className="form-group">
              <label>تاريخ الاستحقاق</label>
              <input
                type="date"
                name="dueDate"
                className="form-control"
                value={formData.dueDate}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>طريقة الدفع</label>
              <select
                name="paymentMethod"
                className="form-control"
                value={formData.paymentMethod}
                onChange={handleChange}
              >
                <option value="">اختر طريقة الدفع</option>
                <option value="cash">نقداً</option>
                <option value="bank_transfer">تحويل بنكي</option>
                <option value="cheque">شيك</option>
              </select>
            </div>

            <div className="form-group">
              <label>{t.notes}</label>
              <textarea
                name="notes"
                className="form-control"
                rows="3"
                value={formData.notes}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? t.loading : t.save}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/invoices')}>
            {t.cancel}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InvoiceForm;
