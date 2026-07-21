import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

const templates = {
  consultation: {
    title: 'استشارة قانونية',
    content: `بسم الله الرحمن الرحيم

الاستشارة القانونية

التاريخ: ___/___/______
رقم القضية: ___

الأطراف:
- الموكل: ___
- الطرف المقابل: ___

موضوع الاستشارة:
___

السؤال المطروح:
___

الرأي القانوني:
___

الأساس القانوني:
___

التوصيات:
___

المحامي المشرف: ___
التوقيع: ___`
  },
  defense_memo: {
    title: 'مذكرة دفاع',
    content: `بسم الله الرحمن الرحيم

مذكرة دفاع

رقم القضية: ___
المحكمة: ___
القسم: ___

أولاً: وقائع القضية
___

ثانياً: أسباب الطعن
___

ثالثاً: الدفع القانوني
___

رابعاً: المرفقات
___

المطالبات:
___

الخاتمة:
___

التاريخ: ___/___/______
المحامي المدافع: ___
التوقيع: ___`
  },
  contract: {
    title: 'عقد قانوني',
    content: `بسم الله الرحمن الرحيم

العقد

في يوم ___/___/______، تم الإتفاق بين:

الطرف الأول: ___
الرقم المدني: ___
العنوان: ___

الطرف الثاني: ___
الرقم المدني: ___
العنوان:___

موضوع العقد:
___

الأحكام والشروط:
___

المادة الأولى: ___
المادة الثانية: ___
المادة الثالثة: ___

قيمة العقد: ___ د.ك
طريقة الدفع: ___
مدة العقد: ___

توقيع الطرف الأول: ___
توقيع الطرف الثاني: ___
التاريخ: ___/___/______`
  },
  petition: {
    title: 'التماس / عريضة',
    content: `بسم الله الرحمن الرحيم

إلى السيد/ قاضي ___ المحكمة ___

الclamation: ___

أولاً: الوقائع
___

ثانياً: المطلوب
___

ثالثاً: الأسباب القانونية
___

المستندات المرفقة:
___

وتفضلوا بقبول فائق الاحترام والتقدير

التاريخ: ___/___/______
المقدم: ___
التوقيع: ___`
  }
};

const DocumentForm = () => {
  const { id } = useParams();
  const { language } = useLanguage();
  const isArabic = language === 'ar';
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
    reviewDate: '',
    approvalDate: '',
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
      toast.error(isArabic ? 'خطأ في جلب القضايا' : 'Error loading cases');
    }
  };

  const fetchDocument = async () => {
    try {
      const response = await api.get(`/documents/${id}`);
      const doc = response.data.document;
      setFormData({
        title: doc.title || '',
        caseId: doc.caseId || '',
        type: doc.type || 'memo',
        status: doc.status || 'draft',
        content: doc.content || '',
        reviewDate: doc.reviewDate || '',
        approvalDate: doc.approvalDate || '',
        notes: doc.notes || ''
      });
    } catch (error) {
      toast.error(isArabic ? 'خطأ في جلب المستند' : 'Error loading document');
      navigate('/documents');
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const applyTemplate = (templateKey) => {
    const template = templates[templateKey];
    if (template) {
      setFormData(prev => ({
        ...prev,
        title: template.title,
        content: template.content,
        type: templateKey === 'defense_memo' ? 'memo' : templateKey
      }));
      toast.success(isArabic ? 'تم تطبيق القالب' : 'Template applied');
    }
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
        await api.put(`/documents/${id}`, cleanedData);
        toast.success(isArabic ? 'تم تحديث المستند بنجاح' : 'Document updated');
      } else {
        await api.post('/documents', cleanedData);
        toast.success(isArabic ? 'تم إنشاء المستند بنجاح' : 'Document created');
      }
      navigate('/documents');
    } catch (error) {
      toast.error(error.response?.data?.details || error.response?.data?.error || (isArabic ? 'خطأ في حفظ المستند' : 'Error saving'));
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="loading">{isArabic ? 'جاري التحميل...' : 'Loading...'}</div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>{id ? (isArabic ? 'تعديل المستند' : 'Edit Document') : (isArabic ? 'إضافة مستند' : 'Add Document')}</h1>
      </div>

      {!id && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h3 className="card-title">{isArabic ? 'قوالب جاهزة' : 'Quick Templates'}</h3>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-secondary" onClick={() => applyTemplate('consultation')}>
              {isArabic ? 'قالب استشارة' : 'Consultation Template'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => applyTemplate('defense_memo')}>
              {isArabic ? 'قالب مذكرة دفاع' : 'Defense Memo Template'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => applyTemplate('contract')}>
              {isArabic ? 'قالب عقد' : 'Contract Template'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => applyTemplate('petition')}>
              {isArabic ? 'قالب التماس' : 'Petition Template'}
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="card">
          <div className="form-group">
            <label>{isArabic ? 'العنوان' : 'Title'} *</label>
            <input type="text" name="title" className="form-control" value={formData.title}
              onChange={handleChange} required />
          </div>

          <div className="grid grid-2">
            <div className="form-group">
              <label>{isArabic ? 'القضية' : 'Case'}</label>
              <select name="caseId" className="form-control" value={formData.caseId} onChange={handleChange}>
                <option value="">{isArabic ? 'اختر القضية' : 'Select case'}</option>
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>{c.title} - {c.caseNumber}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>{isArabic ? 'النوع' : 'Type'} *</label>
              <select name="type" className="form-control" value={formData.type} onChange={handleChange} required>
                <option value="memo">{isArabic ? 'مذكرة قانونية' : 'Legal Memo'}</option>
                <option value="contract">{isArabic ? 'عقد' : 'Contract'}</option>
                <option value="petition">{isArabic ? 'التماس / عريضة' : 'Petition'}</option>
                <option value="judgment">{isArabic ? 'حكم' : 'Judgment'}</option>
                <option value="evidence">{isArabic ? 'دليل' : 'Evidence'}</option>
                <option value="correspondence">{isArabic ? 'مراسلات' : 'Correspondence'}</option>
                <option value="other">{isArabic ? 'أخرى' : 'Other'}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-2">
            <div className="form-group">
              <label>{isArabic ? 'الحالة' : 'Status'}</label>
              <select name="status" className="form-control" value={formData.status} onChange={handleChange}>
                <option value="draft">{isArabic ? 'مسودة' : 'Draft'}</option>
                <option value="under_review">{isArabic ? 'قيد المراجعة' : 'Under Review'}</option>
                <option value="approved">{isArabic ? 'معتمد' : 'Approved'}</option>
                <option value="archived">{isArabic ? 'مؤرشف' : 'Archived'}</option>
              </select>
            </div>

            {(formData.status === 'under_review' || formData.reviewDate) && (
              <div className="form-group">
                <label>{isArabic ? 'تاريخ المراجعة' : 'Review Date'}</label>
                <input type="date" name="reviewDate" className="form-control" value={formData.reviewDate}
                  onChange={handleChange} />
              </div>
            )}

            {(formData.status === 'approved' || formData.approvalDate) && (
              <div className="form-group">
                <label>{isArabic ? 'تاريخ الاعتماد' : 'Approval Date'}</label>
                <input type="date" name="approvalDate" className="form-control" value={formData.approvalDate}
                  onChange={handleChange} />
              </div>
            )}
          </div>

          <div className="form-group">
            <label>{isArabic ? 'المحتوى' : 'Content'}</label>
            <textarea name="content" className="form-control" rows="15" value={formData.content}
              onChange={handleChange} placeholder={isArabic ? 'أدخل محتوى المستند هنا...' : 'Enter document content here...'}
              style={{ fontFamily: 'monospace', direction: 'rtl', textAlign: 'right', lineHeight: '2' }} />
          </div>

          <div className="form-group">
            <label>{isArabic ? 'ملاحظات' : 'Notes'}</label>
            <textarea name="notes" className="form-control" rows="3" value={formData.notes}
              onChange={handleChange} />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/documents')}>
            {isArabic ? 'إلغاء' : 'Cancel'}
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? (isArabic ? 'جاري الحفظ...' : 'Saving...') : (isArabic ? 'حفظ' : 'Save')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DocumentForm;
