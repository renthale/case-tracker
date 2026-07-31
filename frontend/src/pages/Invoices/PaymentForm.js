import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const PaymentForm = ({ invoiceId, onSuccess }) => {
  const { t, language } = useLanguage();
  const isArabic = language === 'ar';
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    paymentDate: format(new Date(), 'yyyy-MM-dd'),
    paymentMethod: 'cash',
    reference: '',
    notes: ''
  });

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
      await api.post(`/payments/invoice/${invoiceId}`, cleanedData);
      toast.success(isArabic ? 'تم إضافة الدفعة بنجاح' : 'Payment added successfully');
      setFormData({
        amount: '',
        paymentDate: format(new Date(), 'yyyy-MM-dd'),
        paymentMethod: 'cash',
        reference: '',
        notes: ''
      });
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.details || error.response?.data?.error || (isArabic ? 'خطأ في إضافة الدفعة' : 'Error adding payment'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-3">
        <div className="form-group">
          <label>{isArabic ? 'المبلغ (د.ك)' : 'Amount (KWD)'} *</label>
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
          <label>{isArabic ? 'تاريخ الدفع' : 'Payment Date'} *</label>
          <input
            type="date"
            name="paymentDate"
            className="form-control"
            value={formData.paymentDate}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>{isArabic ? 'طريقة الدفع' : 'Payment Method'} *</label>
          <select
            name="paymentMethod"
            className="form-control"
            value={formData.paymentMethod}
            onChange={handleChange}
            required
          >
            <option value="cash">{isArabic ? 'نقداً' : 'Cash'}</option>
            <option value="bank_transfer">{isArabic ? 'تحويل بنكي' : 'Bank Transfer'}</option>
            <option value="cheque">{isArabic ? 'شيك' : 'Cheque'}</option>
          </select>
        </div>
        <div className="form-group">
          <label>{isArabic ? 'المرجع' : 'Reference'}</label>
          <input
            type="text"
            name="reference"
            className="form-control"
            value={formData.reference}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label>{t.notes}</label>
          <input
            type="text"
            name="notes"
            className="form-control"
            value={formData.notes}
            onChange={handleChange}
          />
        </div>
        <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? t.loading : (isArabic ? 'إضافة دفعة' : 'Add Payment')}
          </button>
        </div>
      </div>
    </form>
  );
};

export default PaymentForm;
