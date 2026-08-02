import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { CATEGORIES } from '../Cases/FinancialEntryForm';

const InvoiceBuilder = () => {
  const { id } = useParams();
  const { t, language } = useLanguage();
  const isArabic = language === 'ar';
  const navigate = useNavigate();
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [caseData, setCaseData] = useState(null);
  const [unbilled, setUnbilled] = useState([]);
  const [selected, setSelected] = useState({});
  const [manualLines, setManualLines] = useState([]);
  const [formData, setFormData] = useState({
    discount: 0,
    taxRate: 0,
    dueDate: '',
    notes: '',
    type: 'case_fees'
  });

  useEffect(() => {
    load();
  }, [id]);

  const load = async () => {
    setFetching(true);
    try {
      const [caseRes, unbilledRes] = await Promise.all([
        api.get(`/cases/${id}`),
        api.get(`/cases/${id}/unbilled-items`)
      ]);
      setCaseData(caseRes.data.case);
      setUnbilled(unbilledRes.data.entries || []);
    } catch (error) {
      toast.error(error.response?.data?.error || (isArabic ? 'خطأ في تحميل البيانات' : 'Error loading data'));
      navigate('/dashboard/cases');
    } finally {
      setFetching(false);
    }
  };

  const getCategoryLabel = (type, category) => {
    const map = CATEGORIES[type];
    if (!map || !map[category]) return category;
    return isArabic ? map[category][0] : map[category][1];
  };

  const toggleItem = (entry) => {
    setSelected(prev => {
      const next = { ...prev };
      if (next[entry.id]) {
        delete next[entry.id];
      } else {
        next[entry.id] = { ...entry };
      }
      return next;
    });
  };

  const addManualLine = () => {
    setManualLines([...manualLines, { id: Date.now(), description: '', amount: '' }]);
  };

  const updateManualLine = (lineId, field, value) => {
    setManualLines(manualLines.map(l => l.id === lineId ? { ...l, [field]: value } : l));
  };

  const removeManualLine = (lineId) => {
    setManualLines(manualLines.filter(l => l.id !== lineId));
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const buildLines = () => {
    const lines = [];
    Object.values(selected).forEach(entry => {
      lines.push({
        description: `${getCategoryLabel(entry.type, entry.category)}${entry.description ? ` - ${entry.description}` : ''}`,
        quantity: 1,
        amount: parseFloat(entry.amount),
        sourceType: entry.type,
        sourceId: entry.id
      });
    });
    manualLines.forEach(l => {
      const amount = parseFloat(l.amount);
      if (l.description && amount > 0) {
        lines.push({ description: l.description, quantity: 1, amount });
      }
    });
    return lines;
  };

  const handleSubmit = async (status) => {
    const lines = buildLines();
    if (lines.length === 0) {
      toast.error(isArabic ? 'أضف بنداً واحداً على الأقل' : 'Add at least one line item');
      return;
    }
    if (!caseData.clientId) {
      toast.error(isArabic ? 'القضية لا تحتوي على موكل مرتبط' : 'Case has no linked client');
      return;
    }

    setSaving(true);
    try {
      const totalAmount = lines.reduce((s, l) => s + l.amount, 0);
      const payload = {
        clientId: caseData.clientId,
        caseId: id,
        type: formData.type,
        lines,
        totalAmount,
        discount: parseFloat(formData.discount) || 0,
        taxRate: parseFloat(formData.taxRate) || 0,
        dueDate: formData.dueDate || null,
        notes: formData.notes || null,
        status
      };
      const response = await api.post('/invoices', payload);
      toast.success(status === 'sent' ? (isArabic ? 'تم إنشاء الفاتورة وإرسالها' : 'Invoice created and sent') : (isArabic ? 'تم حفظ الفاتورة كمسودة' : 'Invoice saved as draft'));
      navigate(`/dashboard/invoices/${response.data.invoice.id}`);
    } catch (error) {
      toast.error(error.response?.data?.details || error.response?.data?.error || (isArabic ? 'خطأ في إنشاء الفاتورة' : 'Error creating invoice'));
    } finally {
      setSaving(false);
    }
  };

  if (fetching) {
    return <div className="loading">{t.loading}</div>;
  }

  const selectedTotal = Object.values(selected).reduce((s, e) => s + parseFloat(e.amount), 0);
  const manualTotal = manualLines.reduce((s, l) => s + (parseFloat(l.amount) || 0), 0);
  const subtotal = selectedTotal + manualTotal;
  const discount = parseFloat(formData.discount) || 0;
  const taxRate = parseFloat(formData.taxRate) || 0;
  const taxAmount = (subtotal - discount) * (taxRate / 100);
  const total = subtotal - discount + taxAmount;

  return (
    <div className="invoice-form">
      <div className="card-header">
        <h2 className="card-title">{isArabic ? 'إنشاء فاتورة' : 'Create Invoice'}</h2>
      </div>

      <form onSubmit={(e) => e.preventDefault()}>
        <div className="grid grid-2">
          <div className="card">
            <h3 className="card-title">{isArabic ? 'البنود غير المفوتورة' : 'Unbilled Billable Items'}</h3>
            <p style={{ fontSize: '0.85rem', color: '#718096' }}>
              {caseData ? `${caseData.caseNumber || ''} - ${caseData.title}` : ''}
            </p>

            {unbilled.length > 0 ? (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th></th>
                      <th>{isArabic ? 'الفئة' : 'Category'}</th>
                      <th>{isArabic ? 'الوصف' : 'Description'}</th>
                      <th>{isArabic ? 'المبلغ' : 'Amount'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unbilled.map(entry => (
                      <tr key={entry.id} style={{ cursor: 'pointer' }} onClick={() => toggleItem(entry)}>
                        <td><input type="checkbox" checked={!!selected[entry.id]} onChange={() => toggleItem(entry)} onClick={(e) => e.stopPropagation()} /></td>
                        <td>{getCategoryLabel(entry.type, entry.category)}</td>
                        <td>{entry.description || '-'}</td>
                        <td>{parseFloat(entry.amount).toFixed(3)} د.ك</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="no-data">{isArabic ? 'لا توجد بنود غير مفوتورة' : 'No unbilled billable items'}</p>
            )}

            <h3 className="card-title" style={{ marginTop: '1rem' }}>{isArabic ? 'بنود يدوية' : 'Manual Lines'}</h3>
            {manualLines.map(line => (
              <div key={line.id} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder={isArabic ? 'الوصف' : 'Description'}
                  value={line.description}
                  onChange={(e) => updateManualLine(line.id, 'description', e.target.value)}
                />
                <input
                  type="number"
                  className="form-control"
                  style={{ width: '120px' }}
                  placeholder={isArabic ? 'المبلغ' : 'Amount'}
                  value={line.amount}
                  step="0.001"
                  onChange={(e) => updateManualLine(line.id, 'amount', e.target.value)}
                />
                <button type="button" className="btn btn-secondary" onClick={() => removeManualLine(line.id)}><FiTrash2 /></button>
              </div>
            ))}
            <button type="button" className="btn btn-secondary" onClick={addManualLine}><FiPlus /> {isArabic ? 'إضافة بند يدوي' : 'Add Manual Line'}</button>
          </div>

          <div className="card">
            <h3 className="card-title">{isArabic ? 'تفاصيل الفاتورة' : 'Invoice Details'}</h3>

            <div className="form-group">
              <label>{isArabic ? 'نوع الفاتورة' : 'Invoice Type'}</label>
              <select name="type" className="form-control" value={formData.type} onChange={handleChange}>
                <option value="case_fees">{isArabic ? 'أتعاب القضية' : 'Case Fees'}</option>
                <option value="consultation">{isArabic ? 'استشارة' : 'Consultation'}</option>
                <option value="court_fees">{isArabic ? 'رسوم المحكمة' : 'Court Fees'}</option>
                <option value="document_fees">{isArabic ? 'رسوم مستندات' : 'Document Fees'}</option>
                <option value="other">{isArabic ? 'أخرى' : 'Other'}</option>
              </select>
            </div>

            <div className="form-group">
              <label>{isArabic ? 'الخصم (د.ك)' : 'Discount (KWD)'}</label>
              <input type="number" name="discount" className="form-control" value={formData.discount} onChange={handleChange} step="0.001" min="0" />
            </div>

            <div className="form-group">
              <label>{isArabic ? 'نسبة الضريبة (٪)' : 'Tax Rate (%)'}</label>
              <input type="number" name="taxRate" className="form-control" value={formData.taxRate} onChange={handleChange} step="0.01" min="0" />
            </div>

            <div className="form-group">
              <label>{isArabic ? 'تاريخ الاستحقاق' : 'Due Date'}</label>
              <input type="date" name="dueDate" className="form-control" value={formData.dueDate} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>{t.notes}</label>
              <textarea name="notes" className="form-control" rows={2} value={formData.notes} onChange={handleChange} />
            </div>

            <div style={{ background: '#f7fafc', padding: '1rem', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0' }}>
                <span>{isArabic ? 'المجموع الفرعي' : 'Subtotal'}</span><span>{subtotal.toFixed(3)} د.ك</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0' }}>
                <span>{isArabic ? 'الخصم' : 'Discount'}</span><span>-{discount.toFixed(3)} د.ك</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0' }}>
                <span>{isArabic ? 'الضريبة' : 'Tax'}</span><span>{taxAmount.toFixed(3)} د.ك</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', fontWeight: 600, borderTop: '1px solid #e2e8f0' }}>
                <span>{isArabic ? 'الإجمالي' : 'Total'}</span><span>{total.toFixed(3)} د.ك</span>
              </div>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving} onClick={() => handleSubmit('draft')}>
            {saving ? t.loading : (isArabic ? 'حفظ كمسودة' : 'Save as Draft')}
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving} onClick={() => handleSubmit('sent')}>
            {saving ? t.loading : (isArabic ? 'إنشاء وإرسال الفاتورة' : 'Create & Send Invoice')}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate(`/dashboard/cases/${id}`)}>{t.cancel}</button>
        </div>
      </form>
    </div>
  );
};

export default InvoiceBuilder;
