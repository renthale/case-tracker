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
  { value: 'paci', label: { ar: 'الهيئة العامة للسكان', en: 'PACI' } },
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
        api.get('/cases?limit=200'),
        api.get('/clients?limit=200')
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

  const sectionStyle = { marginBottom: '1.5rem' };
  const sectionTitle = { fontSize: '1rem', fontWeight: 600, color: '#1a365d', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '2px solid #e2e8f0' };

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '1.3rem', color: '#1a365d' }}>{id ? (isArabic ? 'تعديل المعاملة' : 'Edit Transaction') : (isArabic ? 'إضافة معاملة جديدة' : 'New Transaction')}</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div style={sectionTitle}>{isArabic ? 'معلومات المعاملة' : 'Transaction Information'}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label style={{ fontWeight: 500, color: '#4a5568', marginBottom: '0.4rem', display: 'block' }}>
                {isArabic ? 'عنوان المعاملة' : 'Transaction Title'} *
              </label>
              <input type="text" name="title" value={formData.title} onChange={handleChange}
                className="form-control"
                placeholder={isArabic ? 'مثال: طلب صك عقاري' : 'e.g: Real estate deed request'} required />
            </div>

            <div className="form-group">
              <label style={{ fontWeight: 500, color: '#4a5568', marginBottom: '0.4rem', display: 'block' }}>
                {isArabic ? 'الجهة الحكومية' : 'Government Entity'} *
              </label>
              <input type="text" name="governmentEntity" value={formData.governmentEntity} onChange={handleChange}
                className="form-control"
                placeholder={isArabic ? 'مثال: وزارة العدل - قسم الأراضي' : 'e.g: Ministry of Justice - Land Department'} required />
            </div>

            <div className="form-group">
              <label style={{ fontWeight: 500, color: '#4a5568', marginBottom: '0.4rem', display: 'block' }}>
                {isArabic ? 'نوع الجهة' : 'Entity Type'}
              </label>
              <select name="entityType" value={formData.entityType} onChange={handleChange} className="form-control">
                {governmentEntities.map(entity => (
                  <option key={entity.value} value={entity.value}>
                    {entity.label[language]}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label style={{ fontWeight: 500, color: '#4a5568', marginBottom: '0.4rem', display: 'block' }}>
                {isArabic ? 'حالة المعاملة' : 'Status'}
              </label>
              <select name="status" value={formData.status} onChange={handleChange} className="form-control">
                {statusOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label[language]}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: '1rem' }}>
          <div style={sectionTitle}>{isArabic ? 'المرتبطة' : 'Related Information'}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label style={{ fontWeight: 500, color: '#4a5568', marginBottom: '0.4rem', display: 'block' }}>
                {isArabic ? 'رقم القضية' : 'Case'}
              </label>
              <select name="caseId" value={formData.caseId} onChange={handleChange} className="form-control">
                <option value="">{isArabic ? 'بدون قضية' : 'No case'}</option>
                {cases.map(c => (
                  <option key={c.id} value={c.id}>{c.caseNumber} - {c.title}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label style={{ fontWeight: 500, color: '#4a5568', marginBottom: '0.4rem', display: 'block' }}>
                {isArabic ? 'الموكل' : 'Client'}
              </label>
              <select name="clientId" value={formData.clientId} onChange={handleChange} className="form-control">
                <option value="">{isArabic ? 'بدون موكل' : 'No client'}</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: '1rem' }}>
          <div style={sectionTitle}>{isArabic ? 'التواريخ' : 'Dates'}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label style={{ fontWeight: 500, color: '#4a5568', marginBottom: '0.4rem', display: 'block' }}>
                {isArabic ? 'تاريخ التقديم' : 'Submission Date'}
              </label>
              <input type="date" name="submissionDate" value={formData.submissionDate} onChange={handleChange} className="form-control" />
            </div>

            <div className="form-group">
              <label style={{ fontWeight: 500, color: '#4a5568', marginBottom: '0.4rem', display: 'block' }}>
                {isArabic ? 'التاريخ المتوقع' : 'Expected Date'}
              </label>
              <input type="date" name="expectedDate" value={formData.expectedDate} onChange={handleChange} className="form-control" />
            </div>

            {formData.status === 'completed' && (
              <div className="form-group">
                <label style={{ fontWeight: 500, color: '#4a5568', marginBottom: '0.4rem', display: 'block' }}>
                  {isArabic ? 'تاريخ الإنجاز' : 'Completion Date'}
                </label>
                <input type="date" name="completionDate" value={formData.completionDate} onChange={handleChange} className="form-control" />
              </div>
            )}
          </div>
        </div>

        <div className="card" style={{ marginBottom: '1rem' }}>
          <div style={sectionTitle}>{isArabic ? 'ملاحظات' : 'Notes'}</div>
          <div className="form-group" style={{ margin: 0 }}>
            <textarea name="notes" value={formData.notes} onChange={handleChange} rows="4"
              className="form-control"
              placeholder={isArabic ? 'أضف ملاحظات...' : 'Add notes...'} />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/transactions')}>
            {t.cancel}
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? (isArabic ? 'جاري الحفظ...' : 'Saving...') : (isArabic ? 'حفظ' : t.save)}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TransactionForm;
