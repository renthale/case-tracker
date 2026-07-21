import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

const TransactionForm = () => {
  const { id } = useParams();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [cases, setCases] = useState([]);
  const [clients, setClients] = useState([]);
  const [formData, setFormData] = useState({
    type: 'income',
    amount: '',
    status: 'pending',
    description: '',
    category: '',
    caseId: '',
    clientId: '',
    notes: ''
  });

  useEffect(() => {
    fetchDropdowns();
    if (id) {
      fetchTransaction();
    } else {
      setFetching(false);
    }
  }, [id]);

  const fetchDropdowns = async () => {
    try {
      const [casesRes, clientsRes] = await Promise.all([
        api.get('/cases', { params: { limit: 100 } }),
        api.get('/clients', { params: { limit: 100 } })
      ]);
      setCases(casesRes.data.cases);
      setClients(clientsRes.data.clients);
    } catch (error) {
      toast.error('خطأ في جلب البيانات');
    }
  };

  const fetchTransaction = async () => {
    try {
      const response = await api.get(`/transactions/${id}`);
      const tx = response.data.transaction;
      setFormData({
        type: tx.type || 'income',
        amount: tx.amount || '',
        status: tx.status || 'pending',
        description: tx.description || '',
        category: tx.category || '',
        caseId: tx.caseId || '',
        clientId: tx.clientId || '',
        notes: tx.notes || ''
      });
    } catch (error) {
      toast.error('خطأ في جلب المعاملة');
      navigate('/transactions');
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
        await api.put(`/transactions/${id}`, cleanedData);
        toast.success('تم تحديث المعاملة بنجاح');
      } else {
        await api.post('/transactions', cleanedData);
        toast.success('تم إنشاء المعاملة بنجاح');
      }
      navigate('/transactions');
    } catch (error) {
      toast.error(error.response?.data?.details || error.response?.data?.error || 'خطأ في حفظ المعاملة');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="loading">{t.loading}</div>;
  }

  return (
    <div className="transaction-form">
      <div className="card-header">
        <h2 className="card-title">{id ? (t.editTransaction || 'تعديل المعاملة') : (t.addTransaction || 'إضافة معاملة')}</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card">
          <div className="grid grid-2">
            <div className="form-group">
              <label>{t.type || 'النوع'} *</label>
              <select
                name="type"
                className="form-control"
                value={formData.type}
                onChange={handleChange}
                required
              >
                <option value="income">{t.income || 'إيراد'}</option>
                <option value="expense">{t.expense || 'مصروف'}</option>
              </select>
            </div>

            <div className="form-group">
              <label>{t.amount || 'المبلغ'} (د.ك) *</label>
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
          </div>

          <div className="grid grid-2">
            <div className="form-group">
              <label>{t.caseTitle || 'القضية'}</label>
              <select
                name="caseId"
                className="form-control"
                value={formData.caseId}
                onChange={handleChange}
              >
                <option value="">اختر القضية</option>
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>{c.title} - {c.caseNumber}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>{t.clientName || 'العميل'}</label>
              <select
                name="clientId"
                className="form-control"
                value={formData.clientId}
                onChange={handleChange}
              >
                <option value="">اختر العميل</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-2">
            <div className="form-group">
              <label>{t.category || 'الفئة'}</label>
              <input
                type="text"
                name="category"
                className="form-control"
                value={formData.category}
                onChange={handleChange}
                placeholder="مثال: رسوم محاماة، رسوم محكمة"
              />
            </div>

            <div className="form-group">
              <label>{t.status || 'الحالة'}</label>
              <select
                name="status"
                className="form-control"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="pending">{t.pending}</option>
                <option value="completed">{t.completed}</option>
                <option value="cancelled">{t.cancelled || 'ملغي'}</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>{t.description || 'الوصف'}</label>
            <textarea
              name="description"
              className="form-control"
              rows="4"
              value={formData.description}
              onChange={handleChange}
            />
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

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? t.loading : t.save}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/transactions')}>
            {t.cancel}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TransactionForm;
