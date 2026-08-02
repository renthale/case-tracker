import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import FinancialEntryForm, { CATEGORIES } from './FinancialEntryForm';
import FinancialStatusBadge from '../../components/FinancialStatusBadge';
import toast from 'react-hot-toast';

const FINANCIAL_ROLES = ['admin', 'partner', 'legal_secretary'];

const TYPE_META = {
  professional_fee: { labelAr: 'أتعاب مهنية', labelEn: 'Professional Fees' },
  case_expense: { labelAr: 'مصروفات القضية', labelEn: 'Case Expenses' },
  session_expense: { labelAr: 'مصروفات الجلسة', labelEn: 'Session Expenses' }
};

const currency = (value) => `${parseFloat(value || 0).toFixed(3)} د.ك`;

const CaseFinancials = ({ caseId, sessions, onChange }) => {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [financials, setFinancials] = useState(null);
  const [entries, setEntries] = useState([]);
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState('professional_fee');
  const [formSession, setFormSession] = useState('');

  const canManage = FINANCIAL_ROLES.includes(user?.role);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryRes, entriesRes] = await Promise.all([
        api.get(`/cases/${caseId}/financials`),
        api.get('/financial-entries', { params: { caseId, limit: 200 } })
      ]);
      setFinancials(summaryRes.data.financials);
      setEntries(entriesRes.data.entries || []);
    } catch (error) {
      toast.error(error.response?.data?.error || (isArabic ? 'خطأ في جلب البيانات المالية' : 'Error loading financial data'));
    } finally {
      setLoading(false);
    }
  }, [caseId, isArabic]);

  useEffect(() => {
    if (canManage) {
      load();
    } else {
      setLoading(false);
    }
  }, [canManage, load]);

  const refresh = () => {
    load();
    if (onChange) onChange();
  };

  const openForm = (type, sessionId = '') => {
    setFormType(type);
    setFormSession(sessionId);
    setShowForm(true);
  };

  if (!canManage) {
    return <div className="card"><p className="no-data">{isArabic ? 'ليس لديك صلاحية للاطلاع على البيانات المالية' : 'You do not have permission to view financial data'}</p></div>;
  }

  if (loading) {
    return <div className="loading">{isArabic ? 'جاري التحميل...' : 'Loading...'}</div>;
  }

  const filteredEntries = filter === 'all' ? entries : entries.filter(e => e.type === filter);

  const summaryCards = financials ? [
    { label: isArabic ? 'الأتعاب المتفق عليها' : 'Agreed Fee', value: currency(financials.agreedFee), className: 'stat-card' },
    { label: isArabic ? 'الأتعاب المهنية' : 'Professional Fees', value: currency(financials.professionalFees), className: 'stat-card' },
    { label: isArabic ? 'مصروفات القضية' : 'Case Expenses', value: currency(financials.caseExpenses), className: 'stat-card' },
    { label: isArabic ? 'مصروفات الجلسة' : 'Session Expenses', value: currency(financials.sessionExpenses), className: 'stat-card' },
    { label: isArabic ? 'إجمالي الفوترة' : 'Total Invoiced', value: currency(financials.totalInvoiced), className: 'stat-card' },
    { label: isArabic ? 'إجمالي المدفوعات' : 'Total Paid', value: currency(financials.totalPaid), className: 'stat-card' },
    { label: isArabic ? 'المستحق' : 'Outstanding', value: currency(financials.outstanding), className: 'stat-card' },
    { label: isArabic ? 'غير المفوتور القابل للفوترة' : 'Unbilled Billable', value: currency(financials.unbilledBillable), className: 'stat-card' },
    { label: isArabic ? 'متأخر' : 'Overdue', value: currency(financials.overdue), className: 'stat-card' }
  ] : [];

  const filters = [
    { key: 'all', label: isArabic ? 'الكل' : 'All' },
    { key: 'professional_fee', label: isArabic ? 'أتعاب مهنية' : 'Professional Fees' },
    { key: 'case_expense', label: isArabic ? 'مصروفات القضية' : 'Case Expenses' },
    { key: 'session_expense', label: isArabic ? 'مصروفات الجلسة' : 'Session Expenses' }
  ];

  const getCategoryLabel = (type, category) => {
    const map = CATEGORIES[type];
    if (!map || !map[category]) return category;
    return isArabic ? map[category][0] : map[category][1];
  };

  return (
    <div className="case-financials">
      <div className="card-header" style={{ marginBottom: '1rem' }}>
        <h3 className="card-title">{isArabic ? 'الملخص المالي' : 'Financial Summary'}</h3>
        <div className="actions">
          <button className="btn btn-primary" onClick={() => openForm('professional_fee')}>{isArabic ? 'أتعاب مهنية' : 'Professional Fee'}</button>
          <button className="btn btn-primary" onClick={() => openForm('case_expense')}>{isArabic ? 'مصروف قضية' : 'Case Expense'}</button>
          <button className="btn btn-primary" onClick={() => openForm('session_expense')}>{isArabic ? 'مصروف جلسة' : 'Session Expense'}</button>
          <Link to={`/dashboard/cases/${caseId}/invoices/new`} className="btn btn-secondary">{isArabic ? 'إنشاء فاتورة' : 'Create Invoice'}</Link>
          <Link to={`/dashboard/cases/${caseId}/payments/new`} className="btn btn-secondary">{isArabic ? 'تسجيل دفعة' : 'Record Payment'}</Link>
        </div>
      </div>

      {financials && (
        <div className="stats-grid">
          {summaryCards.map((card, i) => (
            <div key={i} className="stat-card">
              <div>
                <div className="stat-label" style={{ fontSize: '0.85rem', color: '#718096' }}>{card.label}</div>
                <div className="stat-value" style={{ fontSize: '1.3rem', fontWeight: 600 }}>{card.value}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="filter-tabs" style={{ marginBottom: '1rem' }}>
        {filters.map(f => (
          <button key={f.key} className={`filter-tab ${filter === f.key ? 'active' : ''}`} onClick={() => setFilter(f.key)}>{f.label}</button>
        ))}
      </div>

      {filteredEntries.length > 0 ? (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>{isArabic ? 'النوع' : 'Type'}</th>
                <th>{isArabic ? 'الفئة' : 'Category'}</th>
                <th>{isArabic ? 'الوصف' : 'Description'}</th>
                <th>{isArabic ? 'المبلغ' : 'Amount'}</th>
                <th>{isArabic ? 'التاريخ' : 'Date'}</th>
                <th>{isArabic ? 'قابل للفوترة' : 'Billable'}</th>
                <th>{isArabic ? 'حالة الفوترة' : 'Billing Status'}</th>
                <th>{isArabic ? 'الجلسة' : 'Session'}</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map(entry => (
                <tr key={entry.id}>
                  <td>{TYPE_META[entry.type] ? (isArabic ? TYPE_META[entry.type].labelAr : TYPE_META[entry.type].labelEn) : entry.type}</td>
                  <td>{getCategoryLabel(entry.type, entry.category)}</td>
                  <td>{entry.description || '-'}</td>
                  <td>{currency(entry.amount)}</td>
                  <td>{entry.entryDate ? new Date(entry.entryDate).toLocaleDateString() : '-'}</td>
                  <td>{entry.billable ? (isArabic ? 'نعم' : 'Yes') : (isArabic ? 'لا' : 'No')}</td>
                  <td><FinancialStatusBadge status={entry.billingStatus} /></td>
                  <td>{entry.session ? `${entry.session.sessionNumber || entry.session.hearingNumber} - ${new Date(entry.session.date).toLocaleDateString()}` : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card"><p className="no-data">{isArabic ? 'لا توجد بيانات مالية' : 'No financial data'}</p></div>
      )}

      {showForm && (
        <FinancialEntryForm
          caseId={caseId}
          sessions={sessions}
          initialType={formType}
          initialSessionId={formSession}
          onClose={() => setShowForm(false)}
          onSaved={refresh}
        />
      )}
    </div>
  );
};

export default CaseFinancials;
