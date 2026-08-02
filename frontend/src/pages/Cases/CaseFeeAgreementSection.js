import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiEdit } from 'react-icons/fi';

const FINANCIAL_ROLES = ['admin', 'partner', 'legal_secretary'];

const ARRANGEMENTS = ['fixed_fee', 'per_session', 'hourly', 'monthly_retainer', 'stage_based', 'custom'];

const ARRANGEMENT_LABELS = (ar) => ({
  fixed_fee: ar ? 'أتعاب ثابتة' : 'Fixed Fee',
  per_session: ar ? 'لكل جلسة' : 'Per Session',
  hourly: ar ? 'بالساعة' : 'Hourly',
  monthly_retainer: ar ? 'راتب شهري' : 'Monthly Retainer',
  stage_based: ar ? 'مراحل العمل' : 'Stage-based',
  custom: ar ? 'مخصص' : 'Custom'
});

const CaseFeeAgreementSection = ({ caseId }) => {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const { user } = useAuth();
  const [agreement, setAgreement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    feeArrangement: 'fixed_fee',
    agreedAmount: '',
    currency: 'KWD',
    startDate: '',
    paymentTerms: '',
    notes: ''
  });

  const canManage = FINANCIAL_ROLES.includes(user?.role);
  const labels = ARRANGEMENT_LABELS(isArabic);

  useEffect(() => {
    load();
  }, [caseId]);

  const load = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/cases/${caseId}/fee-agreement`);
      const ag = response.data.agreement;
      setAgreement(ag);
      if (ag) {
        setFormData({
          feeArrangement: ag.feeArrangement,
          agreedAmount: ag.agreedAmount,
          currency: ag.currency || 'KWD',
          startDate: ag.startDate ? ag.startDate.split('T')[0] : '',
          paymentTerms: ag.paymentTerms || '',
          notes: ag.notes || ''
        });
      }
    } catch (error) {
      if (error.response?.status !== 403) {
        toast.error(isArabic ? 'خطأ في جلب اتفاق الأتعاب' : 'Error loading fee agreement');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/cases/${caseId}/fee-agreement`, formData);
      toast.success(isArabic ? 'تم حفظ اتفاق الأتعاب' : 'Fee agreement saved');
      setEditing(false);
      load();
    } catch (error) {
      toast.error(error.response?.data?.error || (isArabic ? 'خطأ في الحفظ' : 'Error saving'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading">{isArabic ? 'جاري التحميل...' : 'Loading...'}</div>;

  if (!canManage) {
    return null;
  }

  return (
    <div className="card" style={{ marginBottom: '1rem' }}>
      <div className="card-header">
        <h3 className="card-title">{isArabic ? 'اتفاق الأتعاب' : 'Fee Agreement'}</h3>
        <button className="btn btn-secondary" onClick={() => setEditing(!editing)}>
          <FiEdit /> {agreement ? (isArabic ? 'تعديل' : 'Edit') : (isArabic ? 'إضافة' : 'Add')}
        </button>
      </div>

      {editing ? (
        <form onSubmit={handleSubmit}>
          <div className="grid grid-2">
            <div className="form-group">
              <label>{isArabic ? 'ترتيب الأتعاب' : 'Fee Arrangement'}</label>
              <select name="feeArrangement" className="form-control" value={formData.feeArrangement} onChange={handleChange}>
                {ARRANGEMENTS.map(a => <option key={a} value={a}>{labels[a]}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>{isArabic ? 'المبلغ المتفق عليه' : 'Agreed Amount'}</label>
              <input type="number" name="agreedAmount" className="form-control" value={formData.agreedAmount} onChange={handleChange} step="0.001" min="0" />
            </div>
            <div className="form-group">
              <label>{isArabic ? 'العملة' : 'Currency'}</label>
              <input type="text" name="currency" className="form-control" value={formData.currency} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>{isArabic ? 'تاريخ البدء' : 'Start Date'}</label>
              <input type="date" name="startDate" className="form-control" value={formData.startDate} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>{isArabic ? 'شروط الدفع' : 'Payment Terms'}</label>
              <textarea name="paymentTerms" className="form-control" rows={2} value={formData.paymentTerms} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>{isArabic ? 'ملاحظات' : 'Notes'}</label>
              <textarea name="notes" className="form-control" rows={2} value={formData.notes} onChange={handleChange} />
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? (isArabic ? 'جاري الحفظ...' : 'Saving...') : (isArabic ? 'حفظ' : 'Save')}</button>
            <button type="button" className="btn btn-secondary" onClick={() => setEditing(false)}>{isArabic ? 'إلغاء' : 'Cancel'}</button>
          </div>
        </form>
      ) : agreement ? (
        <div className="details-grid">
          <div className="detail-item">
            <label>{isArabic ? 'ترتيب الأتعاب' : 'Fee Arrangement'}</label>
            <span>{labels[agreement.feeArrangement] || agreement.feeArrangement}</span>
          </div>
          <div className="detail-item">
            <label>{isArabic ? 'المبلغ المتفق عليه' : 'Agreed Amount'}</label>
            <span>{parseFloat(agreement.agreedAmount || 0).toFixed(3)} {agreement.currency || 'KWD'}</span>
          </div>
          <div className="detail-item">
            <label>{isArabic ? 'تاريخ البدء' : 'Start Date'}</label>
            <span>{agreement.startDate ? new Date(agreement.startDate).toLocaleDateString() : '-'}</span>
          </div>
          <div className="detail-item">
            <label>{isArabic ? 'شروط الدفع' : 'Payment Terms'}</label>
            <span>{agreement.paymentTerms || '-'}</span>
          </div>
          <div className="detail-item">
            <label>{isArabic ? 'ملاحظات' : 'Notes'}</label>
            <span>{agreement.notes || '-'}</span>
          </div>
        </div>
      ) : (
        <p className="no-data">{isArabic ? 'لا يوجد اتفاق أتعاب' : 'No fee agreement yet'}</p>
      )}
    </div>
  );
};

export default CaseFeeAgreementSection;
