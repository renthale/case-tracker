import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

const DocumentForm = () => {
  const { id } = useParams();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [cases, setCases] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    caseId: searchParams.get('caseId') || '',
    type: 'memo',
    status: 'draft',
    content: '',
    notes: ''
  });

  useEffect(() => {
    fetchCases();
    if (id) {
      fetchDocument();
    } else {
      setFetching(false);
    }
  }, [id]);

  const fetchCases = async () => {
    try {
      const response = await api.get('/cases', { params: { limit: 100 } });
      setCases(response.data.cases);
    } catch (error) {
      toast.error('خطأ في جلب القضايا');
    }
  };

  const fetchDocument = async () => {
    try {
      const response = await api.get(`/legal-documents/${id}`);
      const doc = response.data.document;
      setFormData({
        title: doc.title || '',
        caseId: doc.caseId || '',
        type: doc.type || 'memo',
        status: doc.status || 'draft',
        content: doc.content || '',
        notes: doc.notes || ''
      });
    } catch (error) {
      toast.error('خطأ في جلب المستند');
      navigate('/documents');
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
        await api.put(`/legal-documents/${id}`, cleanedData);
        toast.success('تم تحديث المستند بنجاح');
      } else {
        await api.post('/legal-documents', cleanedData);
        toast.success('تم إنشاء المستند بنجاح');
      }
      navigate('/documents');
    } catch (error) {
      toast.error(error.response?.data?.details || error.response?.data?.error || 'خطأ في حفظ المستند');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="loading">{t.loading}</div>;
  }

  return (
    <div className="document-form">
      <div className="card-header">
        <h2 className="card-title">{id ? (t.editDocument || 'تعديل المستند') : (t.addDocument || 'إضافة مستند')}</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card">
          <div className="form-group">
            <label>{t.title || 'العنوان'} *</label>
            <input
              type="text"
              name="title"
              className="form-control"
              value={formData.title}
              onChange={handleChange}
              required
            />
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
              <label>{t.type || 'النوع'} *</label>
              <select
                name="type"
                className="form-control"
                value={formData.type}
                onChange={handleChange}
                required
              >
                <option value="memo">{t.memo || 'مذكرة'}</option>
                <option value="contract">{t.contract || 'عقد'}</option>
                <option value="petition">{t.petition || 'مذكرة تقديم'}</option>
                <option value="judgment">{t.judgment || 'حكم'}</option>
                <option value="evidence">{t.evidence || 'دليل'}</option>
                <option value="correspondence">{t.correspondence || 'مراسلات'}</option>
                <option value="other">{t.other}</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>{t.status || 'الحالة'}</label>
            <select
              name="status"
              className="form-control"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="draft">{t.draft || 'مسودة'}</option>
              <option value="under_review">{t.under_review || 'قيد المراجعة'}</option>
              <option value="approved">{t.approved || 'معتمد'}</option>
              <option value="archived">{t.archived || 'مؤرشف'}</option>
            </select>
          </div>

          <div className="form-group">
            <label>{t.content || 'المحتوى'}</label>
            <textarea
              name="content"
              className="form-control"
              rows="12"
              value={formData.content}
              onChange={handleChange}
              placeholder="أدخل محتوى المستند هنا..."
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
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/documents')}>
            {t.cancel}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DocumentForm;
