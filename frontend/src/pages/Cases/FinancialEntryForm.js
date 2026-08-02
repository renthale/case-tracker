import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiX } from 'react-icons/fi';

const TYPES = ['professional_fee', 'case_expense', 'session_expense'];

const TYPE_LABELS = (ar) => ({
  professional_fee: ar ? 'أتعاب مهنية' : 'Professional Fee',
  case_expense: ar ? 'مصروف قضية' : 'Case Expense',
  session_expense: ar ? 'مصروف جلسة' : 'Session Expense'
});

const CATEGORIES = {  professional_fee: {
    consultation: ['استشارة', 'Consultation'],
    case_opening: ['فتح قضية', 'Case Opening'],
    court_attendance: ['حضور جلسات المحكمة', 'Court Attendance'],
    legal_memorandum: ['مذكرة قانونية', 'Legal Memorandum'],
    contract_drafting: ['صياغة عقد', 'Contract Drafting'],
    contract_review: ['مراجعة عقد', 'Contract Review'],
    appeal_preparation: ['تحضير استئناف', 'Appeal Preparation'],
    legal_opinion: ['رأي قانوني', 'Legal Opinion'],
    negotiation: ['تفاوض', 'Negotiation'],
    government_transaction_service: ['خدمة معاملة حكومية', 'Government Transaction Service'],
    execution_follow_up: ['متابعة تنفيذ', 'Execution Follow-up'],
    other: ['أخرى', 'Other']
  },
  case_expense: {
    court_filing_fee: ['رسوم قيد الدعوى', 'Court Filing Fee'],
    ministry_of_justice_fee: ['رسوم وزارة العدل', 'Ministry of Justice Fee'],
    court_stamp: ['طابع المحكمة', 'Court Stamp'],
    expert_fee: ['أتعاب خبير', 'Expert Fee'],
    translation: ['ترجمة', 'Translation'],
    certified_translation: ['ترجمة معتمدة', 'Certified Translation'],
    notary_fee: ['رسوم كاتب العدل', 'Notary Fee'],
    government_fee: ['رسوم حكومية', 'Government Fee'],
    execution_fee: ['رسوم تنفيذ', 'Execution Fee'],
    appeal_fee: ['رسوم استئناف', 'Appeal Fee'],
    medical_report: ['تقرير طبي', 'Medical Report'],
    police_report: ['تقرير شرطة', 'Police Report'],
    courier: ['مندوب توصيل', 'Courier'],
    shipping: ['شحن', 'Shipping'],
    printing_copies: ['طباعة ونسخ', 'Printing & Copying'],
    travel: ['سفر', 'Travel'],
    other: ['أخرى', 'Other']
  },
  session_expense: {
    court_agent_fee: ['أتعاب مندوب المحاكم', 'Court Agent Fee'],
    lawyer_attendance_fee: ['أتعاب حضور محامٍ', 'Lawyer Attendance Fee'],
    transportation: ['مواصلات', 'Transportation'],
    parking: ['مواقف', 'Parking'],
    taxi: ['تاكسي', 'Taxi'],
    fuel: ['وقود', 'Fuel'],
    printing: ['طباعة', 'Printing'],
    court_copies: ['نسخ محكمة', 'Court Copies'],
    waiting_time: ['وقت انتظار', 'Waiting Time'],
    other: ['أخرى', 'Other']
  }
};

const FinancialEntryForm = ({ caseId, sessions = [], initialType = 'professional_fee', initialSessionId = '', onClose, onSaved }) => {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    type: initialType,
    sessionId: initialSessionId,
    category: '',
    description: '',
    amount: '',
    entryDate: new Date().toISOString().split('T')[0],
    billable: 'true',
    billingStatus: 'unbilled',
    paidBy: '',
    notes: ''
  });
  const [receiptFile, setReceiptFile] = useState(null);

  const typeLabels = TYPE_LABELS(isArabic);
  const categories = CATEGORIES[formData.type] || {};

  const handleChange = (e) => {
    const { name, value } = e.target;
    const next = { ...formData, [name]: value };
    if (name === 'type') next.category = '';
    setFormData(next);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.category) {
      toast.error(isArabic ? 'يرجى اختيار الفئة' : 'Please select a category');
      return;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error(isArabic ? 'المبلغ مطلوب' : 'Amount is required');
      return;
    }
    if (formData.type === 'session_expense' && !formData.sessionId) {
      toast.error(isArabic ? 'الجلسة مطلوبة لمصروف الجلسة' : 'Session is required for a session expense');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        caseId,
        sessionId: formData.sessionId || null,
        billable: formData.billable === 'true'
      };
      const response = await api.post('/financial-entries', payload);
      const entryId = response.data.entry.id;

      if (receiptFile) {
        const fd = new FormData();
        fd.append('file', receiptFile);
        await api.post(`/financial-entries/${entryId}/receipt`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }

      toast.success(isArabic ? 'تمت إضافة الإدخال المالي بنجاح' : 'Financial entry added');
      if (onSaved) onSaved();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.details || error.response?.data?.error || (isArabic ? 'خطأ في الحفظ' : 'Error saving'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal financial-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{typeLabels[formData.type]}</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close"><FiX /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-2">
            <div className="form-group">
              <label>{isArabic ? 'النوع' : 'Type'}</label>
              <select name="type" className="form-control" value={formData.type} onChange={handleChange} disabled={initialType}>
                {TYPES.map(type => (
                  <option key={type} value={type}>{typeLabels[type]}</option>
                ))}
              </select>
            </div>

            {formData.type === 'session_expense' && (
              <div className="form-group">
                <label>{isArabic ? 'الجلسة' : 'Session'}</label>
                <select name="sessionId" className="form-control" value={formData.sessionId} onChange={handleChange} required>
                  <option value="">{isArabic ? 'اختر الجلسة' : 'Select session'}</option>
                  {sessions.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.sessionNumber || s.hearingNumber} - {new Date(s.date).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group">
              <label>{isArabic ? 'الفئة' : 'Category'}</label>
              <select name="category" className="form-control" value={formData.category} onChange={handleChange} required>
                <option value="">{isArabic ? 'اختر الفئة' : 'Select category'}</option>
                {Object.entries(categories).map(([key, [arLabel, enLabel]]) => (
                  <option key={key} value={key}>{isArabic ? arLabel : enLabel}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>{isArabic ? 'الوصف' : 'Description'}</label>
              <input type="text" name="description" className="form-control" value={formData.description} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>{isArabic ? 'المبلغ (د.ك)' : 'Amount (KWD)'} *</label>
              <input type="number" name="amount" className="form-control" value={formData.amount} onChange={handleChange} step="0.001" min="0" required />
            </div>

            <div className="form-group">
              <label>{isArabic ? 'التاريخ' : 'Date'}</label>
              <input type="date" name="entryDate" className="form-control" value={formData.entryDate} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>{isArabic ? 'قابل للفوترة' : 'Billable'}</label>
              <select name="billable" className="form-control" value={formData.billable} onChange={handleChange}>
                <option value="true">{isArabic ? 'نعم' : 'Yes'}</option>
                <option value="false">{isArabic ? 'لا' : 'No'}</option>
              </select>
            </div>

            <div className="form-group">
              <label>{isArabic ? 'الدفع بواسطة' : 'Paid By'}</label>
              <select name="paidBy" className="form-control" value={formData.paidBy} onChange={handleChange}>
                <option value="">{isArabic ? '—' : '—'}</option>
                <option value="firm">{isArabic ? 'المكتب' : 'Firm'}</option>
                <option value="client_direct">{isArabic ? 'الموكل مباشرة' : 'Client Directly'}</option>
              </select>
            </div>

            <div className="form-group">
              <label>{isArabic ? 'الإيصال (اختياري)' : 'Receipt (optional)'}</label>
              <input type="file" className="form-control" accept="image/*,application/pdf" onChange={(e) => setReceiptFile(e.target.files[0] || null)} />
            </div>

            <div className="form-group">
              <label>{isArabic ? 'ملاحظات' : 'Notes'}</label>
              <textarea name="notes" className="form-control" rows={2} value={formData.notes} onChange={handleChange} />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? (isArabic ? 'جاري الحفظ...' : 'Saving...') : (isArabic ? 'حفظ' : 'Save')}
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>{isArabic ? 'إلغاء' : 'Cancel'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export { CATEGORIES, TYPE_LABELS };

export default FinancialEntryForm;
