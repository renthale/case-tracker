import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const PaymentForm = ({ invoiceId, onSuccess }) => {
  const { t } = useLanguage();
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
      await api.post('/payments', { invoiceId, ...cleanedData });
      toast.success('تم إضافة الدفعة بنجاح');
      setFormData({
        amount: '',
        paymentDate: format(new Date(), 'yyyy-MM-dd'),
        paymentMethod: 'cash',
        reference: '',
        notes: ''
      });
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.details || error.response?.data?.error || 'خطأ في إضافة الدفعة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-3">
        <div className="form-group">
          <label>المبلغ (د.ك) *</label>
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
          <label>تاريخ الدفع *</label>
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
          <label>طريقة الدفع *</label>
          <select
            name="paymentMethod"
            className="form-control"
            value={formData.paymentMethod}
            onChange={handleChange}
            required
          >
            <option value="cash">نقداً</option>
            <option value="bank_transfer">تحويل بنكي</option>
            <option value="cheque">شيك</option>
          </select>
        </div>
        <div className="form-group">
          <label>المرجع</label>
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
            {loading ? t.loading : 'إضافة دفعة'}
          </button>
        </div>
      </div>
    </form>
  );
};

export default PaymentForm;
