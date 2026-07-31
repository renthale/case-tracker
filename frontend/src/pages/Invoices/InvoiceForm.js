import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

const InvoiceForm = () => {
  const { id } = useParams();
  const { t, language } = useLanguage();
  const isArabic = language === 'ar';
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
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
    const mql = window.matchMedia('(max-width: 768px)');
    setIsMobile(mql.matches);
    const handler = (e) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

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
      toast.error(isArabic ? 'خطأ في تحميل البيانات' : 'Error loading data');
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
      toast.error(isArabic ? 'خطأ في جلب بيانات الفاتورة' : 'Error fetching invoice data');
      navigate('/dashboard/invoices');
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.clientId) {
      toast.error(isArabic ? 'الموكل مطلوب' : 'Client is required');
      return;
    }
    if (!formData.type) {
      toast.error(isArabic ? 'نوع الفاتورة مطلوب' : 'Invoice type is required');
      return;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error(isArabic ? 'المبلغ مطلوب' : 'Amount is required');
      return;
    }

    setLoading(true);

    const cleanedData = { ...formData };
    Object.keys(cleanedData).forEach(key => {
      if (cleanedData[key] === '') cleanedData[key] = null;
    });

    try {
      if (id) {
        await api.put(`/invoices/${id}`, cleanedData);
        toast.success(isArabic ? 'تم تحديث الفاتورة بنجاح' : 'Invoice updated successfully');
      } else {
        await api.post('/invoices', cleanedData);
        toast.success(isArabic ? 'تم إنشاء الفاتورة بنجاح' : 'Invoice created successfully');
      }
      navigate('/dashboard/invoices');
    } catch (error) {
      toast.error(error.response?.data?.details || error.response?.data?.error || (isArabic ? 'خطأ في حفظ الفاتورة' : 'Error saving invoice'));
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="loading">{t.loading}</div>;
  }

  return (
      <div className={`invoice-form ${isMobile ? 'invoice-form-mobile' : ''}`}>
      <div className="card-header">
        <h2 className="card-title">{id ? t.editInvoice : t.addInvoice}</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <div className={`grid grid-2 ${isMobile ? 'grid-mobile-stack' : ''}`}>
          <div className="card">
            <h3 className="card-title">{t.invoiceFormSection}</h3>

            <div className="form-group">
              <label>{t.client} *</label>
              <select
                name="clientId"
                className="form-control"
                value={formData.clientId}
                onChange={handleChange}
                required
              >
                <option value="">{t.selectClient}</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>{t.caseLabel}</label>
              <select
                name="caseId"
                className="form-control"
                value={formData.caseId}
                onChange={handleChange}
              >
                <option value="">{t.selectCaseOptional}</option>
                {cases.map(c => (
                  <option key={c.id} value={c.id}>{c.caseNumber || c.title} - {c.title}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>{t.invoiceType} *</label>
              <select
                name="type"
                className="form-control"
                value={formData.type}
                onChange={handleChange}
                required
              >
                <option value="consultation">{t.consultation}</option>
                <option value="litigation">{t.litigation}</option>
                <option value="session">{t.sessionLabel}</option>
                <option value="documents">{t.documentsLabel}</option>
                <option value="other">{t.other}</option>
              </select>
            </div>

            <div className="form-group">
              <label>{t.description}</label>
              <textarea
                name="description"
                className="form-control"
                rows={isMobile ? 2 : 3}
                value={formData.description}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>{t.amount} (د.ك) *</label>
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
              <label>{t.dueDate}</label>
              <input
                type="date"
                name="dueDate"
                className="form-control"
                value={formData.dueDate}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>{t.paymentMethod}</label>
              <select
                name="paymentMethod"
                className="form-control"
                value={formData.paymentMethod}
                onChange={handleChange}
              >
                <option value="">{t.selectPaymentMethod}</option>
                <option value="cash">{t.cash}</option>
                <option value="bank_transfer">{t.bankTransfer}</option>
                <option value="cheque">{t.cheque}</option>
              </select>
            </div>

            <div className="form-group">
              <label>{t.notes}</label>
              <textarea
                name="notes"
                className="form-control"
                rows={isMobile ? 2 : 3}
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
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/dashboard/invoices')}>
            {t.cancel}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InvoiceForm;
