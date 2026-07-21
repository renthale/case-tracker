import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

const governmentEntities = [
  { value: 'ministry_of_justice', label: { ar: 'وزارة العدل', en: 'Ministry of Justice' } },
  { value: 'awqaf', label: { ar: 'هيئة الأوقاف', en: 'General Authority of Awqaf' } },
  { value: 'general_sec', label: { ar: 'الأمانة العامة', en: 'General Secretariat' } },
  { value: 'kuwait_municipality', label: { ar: 'البلدية الكويتية', en: 'Kuwait Municipality' } },
  { value: 'paci', label: { ar: 'الهيئة العامة لل Population', en: 'PACI' } },
  { value: 'embassy', label: { ar: 'السفارة', en: 'Embassy' } },
  { value: 'court', label: { ar: 'المحاكم', en: 'Courts' } },
  { value: 'other', label: { ar: 'أخرى', en: 'Other' } },
];

const statusOptions = [
  { value: 'submitted', label: { ar: 'مقدمة', en: 'Submitted' } },
  { value: 'processing', label: { ar: 'قيد المعالجة', en: 'Processing' } },
  { value: 'completed', label: { ar: 'منجزة', en: 'Completed' } },
  { value: 'rejected', label: { ar: 'مرفوضة', en: 'Rejected' } },
  { value: 'pending', label: { ar: 'معلقة', en: 'Pending' } },
];

const TransactionForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const isArabic = language === 'ar';

  const [loading, setLoading] = useState(false);
  const [cases, setCases] = useState([]);
  const [clients, setClients] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    governmentEntity: '',
    entityType: 'other',
    caseId: '',
    clientId: '',
    status: 'submitted',
    submissionDate: new Date().toISOString().split('T')[0],
    expectedDate: '',
    completionDate: '',
    notes: ''
  });

  useEffect(() => {
    if (id) fetchTransaction();
    fetchCasesAndClients();
  }, [id]);

  const fetchTransaction = async () => {
    try {
      const { data } = await api.get(`/transactions/${id}`);
      const tx = data.transaction;
      setFormData({
        title: tx.title || '',
        governmentEntity: tx.governmentEntity || '',
        entityType: tx.entityType || 'other',
        caseId: tx.caseId || '',
        clientId: tx.clientId || '',
        status: tx.status || 'submitted',
        submissionDate: tx.submissionDate || '',
        expectedDate: tx.expectedDate || '',
        completionDate: tx.completionDate || '',
        notes: tx.notes || ''
      });
    } catch (error) {
      toast.error(isArabic ? 'خطأ في جلب المعاملة' : 'Error loading transaction');
    }
  };

  const fetchCasesAndClients = async () => {
    try {
      const [casesRes, clientsRes] = await Promise.all([
        api.get('/cases?limit=100'),
        api.get('/clients?limit=100')
      ]);
      setCases(casesRes.data.cases || []);
      setClients(clientsRes.data.clients || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error(isArabic ? 'عنوان المعاملة مطلوب' : 'Title is required');
      return;
    }
    if (!formData.governmentEntity.trim()) {
      toast.error(isArabic ? 'الجهة الحكومية مطلوبة' : 'Government entity is required');
      return;
    }

    setLoading(true);
    try {
      const payload = { ...formData };
      if (payload.caseId === '') delete payload.caseId;
      if (payload.clientId === '') delete payload.clientId;
      if (payload.expectedDate === '') delete payload.expectedDate;
      if (payload.completionDate === '') delete payload.completionDate;

      if (id) {
        await api.put(`/transactions/${id}`, payload);
        toast.success(isArabic ? 'تم تحديث المعاملة بنجاح' : 'Transaction updated');
      } else {
        await api.post('/transactions', payload);
        toast.success(isArabic ? 'تم إنشاء المعاملة بنجاح' : 'Transaction created');
      }
      navigate('/transactions');
    } catch (error) {
      toast.error(error.response?.data?.error || (isArabic ? 'خطأ في حفظ المعاملة' : 'Error saving transaction'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>{id ? t.editTransaction : t.addTransaction}</h1>
      </div>
      <form onSubmit={handleSubmit} className="form-container">
        <div className="form-grid">
          <div className="form-group">
            <label>{isArabic ? 'عنوان المعاملة' : 'Transaction Title'} *</label>
            <input type="text" name="title" value={formData.title} onChange={handleChange}
              placeholder={isArabic ? 'مثال: طلب صك عقاري' : 'e.g: Real estate deed request'} required />
          </div>

          <div className="form-group">
            <label>{isArabic ? 'الجهة الحكومية' : 'Government Entity'} *</label>
            <input type="text" name="governmentEntity" value={formData.governmentEntity} onChange={handleChange}
              placeholder={isArabic ? 'مثال: وزارة العدل - قسم الأراضي' : 'e.g: Ministry of Justice - Land Department'} required />
          </div>

          <div className="form-group">
            <label>{isArabic ? 'نوع الجهة' : 'Entity Type'}</label>
            <select name="entityType" value={formData.entityType} onChange={handleChange}>
              {governmentEntities.map(entity => (
                <option key={entity.value} value={entity.value}>
                  {entity.label[language]}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>{isArabic ? 'حالة المعاملة' : 'Status'}</label>
            <select name="status" value={formData.status} onChange={handleChange}>
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label[language]}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>{t.caseNumber}</label>
            <select name="caseId" value={formData.caseId} onChange={handleChange}>
              <option value="">{isArabic ? 'بدون قضية' : 'No case'}</option>
              {cases.map(c => (
                <option key={c.id} value={c.id}>{c.caseNumber} - {c.title}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>{isArabic ? 'الموكل' : 'Client'}</label>
            <select name="clientId" value={formData.clientId} onChange={handleChange}>
              <option value="">{isArabic ? 'بدون موكل' : 'No client'}</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>{isArabic ? 'تاريخ التقديم' : 'Submission Date'}</label>
            <input type="date" name="submissionDate" value={formData.submissionDate} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>{isArabic ? 'التاريخ المتوقع' : 'Expected Date'}</label>
            <input type="date" name="expectedDate" value={formData.expectedDate} onChange={handleChange} />
          </div>

          {formData.status === 'completed' && (
            <div className="form-group">
              <label>{isArabic ? 'تاريخ الإنجاز' : 'Completion Date'}</label>
              <input type="date" name="completionDate" value={formData.completionDate} onChange={handleChange} />
            </div>
          )}

          <div className="form-group full-width">
            <label>{isArabic ? 'ملاحظات' : 'Notes'}</label>
            <textarea name="notes" value={formData.notes} onChange={handleChange} rows="3" />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/transactions')}>
            {t.cancel}
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? (isArabic ? 'جاري الحفظ...' : 'Saving...') : t.save}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TransactionForm;
