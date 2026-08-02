import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

const CasePaymentForm = () => {
  const { id } = useParams();
  const { t, language } = useLanguage();
  const isArabic = language === 'ar';
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [caseData, setCaseData] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [formData, setFormData] = useState({
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash',
    referenceNumber: '',
    invoiceId: '',
    notes: ''
  });

  useEffect(() => {
    load();
  }, [id]);

  const load = async () => {
    setFetching(true);
    try {
      const response = await api.get(`/cases/${id}`);
      const caseRecord = response.data.case;
      setCaseData(caseRecord);
      const activeInvoices = (caseRecord.invoices || []).filter(i => i.status !== 'cancelled' && i.status !== 'draft');
      setInvoices(activeInvoices);
    } catch (error) {
      toast.error(isArabic ? 'خطأ في جلب القضية' : 'Error loading case');
      navigate('/dashboard/cases');
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error(isArabic ? 'المبلغ مطلوب' : 'Amount is required');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...formData,
        caseId: id,
        invoiceId: formData.invoiceId || null
      };
      await api.post('/payments', payload);
      toast.success(isArabic ? 'تمت إضافة الدفعة بنجاح' : 'Payment added successfully');
      navigate(`/dashboard/cases/${id}`);
    } catch (error) {
      toast.error(error.response?.data?.details || error.response?.data?.error || (isArabic ? 'خطأ في إضافة الدفعة' : 'Error adding payment'));
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="loading">{t.loading}</div>;
  }

  const outstanding = (inv) => parseFloat(inv.totalAmount || 0) - parseFloat(inv.paidAmount || 0);

  return (
    <div className="invoice-form">
      <div className="card-header">
        <h2 className="card-title">{isArabic ? 'تسجيل دفعة' : 'Record Payment'}</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-2">
          <div className="card">
            <h3 className="card-title">{caseData ? `${caseData.caseNumber || ''} - ${caseData.title}` : ''}</h3>

            <div className="form-group">
              <label>{isArabic ? 'الفاتورة (اختياري)' : 'Invoice (optional)'}</label>
              <select name="invoiceId" className="form-control" value={formData.invoiceId} onChange={handleChange}>
                <option value="">{isArabic ? '— دفعة على مستوى القضية —' : '— Case-level payment —'}</option>
                {invoices.map(inv => (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoiceNumber} - {outstanding(inv).toFixed(3)} {isArabic ? 'د.ك متبقية' : 'KWD due'}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>{isArabic ? 'المبلغ (د.ك)' : 'Amount (KWD)'} *</label>
              <input type="number" name="amount" className="form-control" value={formData.amount} onChange={handleChange} step="0.001" min="0" required />
            </div>

            <div className="form-group">
              <label>{isArabic ? 'تاريخ الدفع' : 'Payment Date'} *</label>
              <input type="date" name="paymentDate" className="form-control" value={formData.paymentDate} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>{isArabic ? 'طريقة الدفع' : 'Payment Method'} *</label>
              <select name="paymentMethod" className="form-control" value={formData.paymentMethod} onChange={handleChange} required>
                <option value="cash">{isArabic ? 'نقداً' : 'Cash'}</option>
                <option value="bank_transfer">{isArabic ? 'تحويل بنكي' : 'Bank Transfer'}</option>
                <option value="check">{isArabic ? 'شيك' : 'Cheque'}</option>
                <option value="credit_card">{isArabic ? 'بطاقة ائتمان/خصم' : 'Credit/Debit Card'}</option>
                <option value="knet">{isArabic ? 'كي نت' : 'KNET'}</option>
                <option value="other">{isArabic ? 'أخرى' : 'Other'}</option>
              </select>
            </div>

            <div className="form-group">
              <label>{isArabic ? 'رقم المرجع' : 'Reference Number'}</label>
              <input type="text" name="referenceNumber" className="form-control" value={formData.referenceNumber} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>{t.notes}</label>
              <textarea name="notes" className="form-control" rows={2} value={formData.notes} onChange={handleChange} />
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? t.loading : (isArabic ? 'تسجيل الدفعة' : 'Record Payment')}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate(`/dashboard/cases/${id}`)}>{t.cancel}</button>
        </div>
      </form>
    </div>
  );
};

export default CasePaymentForm;
