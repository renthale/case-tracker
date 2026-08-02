import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import FinancialStatusBadge from '../../components/FinancialStatusBadge';

const FINANCIAL_ROLES = ['admin', 'partner', 'legal_secretary'];

const currency = (value) => `${parseFloat(value || 0).toFixed(3)} د.ك`;

const CaseOverview = ({ caseData, onNavigate }) => {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const { user } = useAuth();
  const canManage = FINANCIAL_ROLES.includes(user?.role);

  const sessions = caseData.sessions || [];
  const invoices = caseData.invoices || [];
  const entries = caseData.financialEntries || [];
  const documents = caseData.legalDocuments || [];
  const transactions = caseData.transactions || [];
  const notifications = caseData.notifications || [];

  const upcomingSessions = sessions.filter(s => s.status === 'scheduled' && new Date(s.date) >= new Date());
  const completedSessions = sessions.filter(s => s.status === 'completed').length;
  const postponedSessions = sessions.filter(s => s.status === 'postponed').length;

  const activeInvoices = invoices.filter(i => i.status !== 'cancelled');
  const totalInvoiced = activeInvoices.reduce((s, i) => s + parseFloat(i.totalAmount || 0), 0);
  const totalPaid = activeInvoices.reduce((s, i) => s + parseFloat(i.paidAmount || 0), 0);
  const outstanding = totalInvoiced - totalPaid;
  const overdueAmount = invoices.filter(i => i.status === 'overdue').reduce((s, i) => s + parseFloat(i.totalAmount || 0), 0);
  const unbilled = entries.filter(e => e.billable && e.billingStatus === 'unbilled').reduce((s, e) => s + parseFloat(e.amount), 0);
  const professionalFees = entries.filter(e => e.type === 'professional_fee').reduce((s, e) => s + parseFloat(e.amount), 0);
  const caseExpenses = entries.filter(e => e.type === 'case_expense').reduce((s, e) => s + parseFloat(e.amount), 0);
  const sessionExpenses = entries.filter(e => e.type === 'session_expense').reduce((s, e) => s + parseFloat(e.amount), 0);
  const agreedFee = parseFloat(caseData.feeAgreement?.agreedAmount || 0);

  const invoiceStatusCounts = invoices.reduce((acc, i) => {
    acc[i.status] = (acc[i.status] || 0) + 1;
    return acc;
  }, {});

  const kpiCards = [
    {
      title: isArabic ? 'الجلسات' : 'Sessions',
      rows: [
        { label: isArabic ? 'الإجمالي' : 'Total', value: sessions.length },
        { label: isArabic ? 'القادمة' : 'Upcoming', value: upcomingSessions.length },
        { label: isArabic ? 'مكتملة' : 'Completed', value: completedSessions },
        { label: isArabic ? 'مؤجلة' : 'Postponed', value: postponedSessions }
      ],
      action: () => onNavigate('sessions'),
      actionLabel: isArabic ? 'عرض الجلسات' : 'View Sessions'
    },
    ...(canManage ? [
      {
        title: isArabic ? 'المالية' : 'Financials',
        rows: [
          { label: isArabic ? 'الأتعاب المتفق عليها' : 'Agreed Fee', value: currency(agreedFee) },
          { label: isArabic ? 'الأتعاب المهنية' : 'Professional Fees', value: currency(professionalFees) },
          { label: isArabic ? 'مصروفات القضية' : 'Case Expenses', value: currency(caseExpenses) },
          { label: isArabic ? 'مصروفات الجلسة' : 'Session Expenses', value: currency(sessionExpenses) },
          { label: isArabic ? 'مفوتر' : 'Invoiced', value: currency(totalInvoiced) },
          { label: isArabic ? 'مدفوع' : 'Paid', value: currency(totalPaid) },
          { label: isArabic ? 'مستحق' : 'Outstanding', value: currency(outstanding) },
          { label: isArabic ? 'غير مفوتر' : 'Unbilled', value: currency(unbilled) },
          { label: isArabic ? 'متأخر' : 'Overdue', value: currency(overdueAmount) }
        ],
        action: () => onNavigate('financials'),
        actionLabel: isArabic ? 'عرض المالية' : 'View Financials'
      },
      {
        title: isArabic ? 'الفواتير' : 'Invoices',
        rows: [
          { label: isArabic ? 'مسودة' : 'Draft', value: invoiceStatusCounts.draft || 0 },
          { label: isArabic ? 'مرسلة' : 'Sent', value: (invoiceStatusCounts.sent || 0) + (invoiceStatusCounts.partially_paid || 0) },
          { label: isArabic ? 'مدفوعة' : 'Paid', value: invoiceStatusCounts.paid || 0 },
          { label: isArabic ? 'متأخرة' : 'Overdue', value: invoiceStatusCounts.overdue || 0 },
          { label: isArabic ? 'ملغاة' : 'Cancelled', value: invoiceStatusCounts.cancelled || 0 }
        ],
        action: () => onNavigate('invoices'),
        actionLabel: isArabic ? 'عرض الفواتير' : 'View Invoices'
      }
    ] : []),
    {
      title: isArabic ? 'الحالة' : 'Case Status',
      rows: [
        { label: isArabic ? 'رقم القضية' : 'Case Number', value: caseData.caseNumber || '-' },
        { label: isArabic ? 'الحالة' : 'Status', value: isArabic ? (caseData.status || '') : (caseData.status || '') },
        { label: isArabic ? 'الأولوية' : 'Priority', value: caseData.priority || '-' },
        { label: isArabic ? 'المستندات' : 'Documents', value: documents.length },
        { label: isArabic ? 'المعاملات الحكومية' : 'Gov. Transactions', value: transactions.length }
      ],
      action: () => onNavigate('details'),
      actionLabel: isArabic ? 'عرض التفاصيل' : 'View Details'
    }
  ];

  const nextActions = [];
  if (upcomingSessions.length > 0) {
    nextActions.push({ label: isArabic ? 'الجلسات القادمة تتطلب متابعة' : 'Upcoming sessions need attention', tab: 'sessions' });
  }
  if (canManage && outstanding > 0) {
    nextActions.push({ label: isArabic ? 'هناك رصيد مستحق على الفواتير' : 'Invoices have outstanding balance', tab: 'invoices' });
  }
  if (canManage && unbilled > 0) {
    nextActions.push({ label: isArabic ? 'بنود قابلة للفوترة لم تفوتر بعد' : 'Billable items not yet invoiced', tab: 'financials' });
  }
  if (canManage && overdueAmount > 0) {
    nextActions.push({ label: isArabic ? 'فواتير متأخرة' : 'Overdue invoices', tab: 'invoices' });
  }

  return (
    <div className="case-overview">
      <div className="stats-grid">
        {kpiCards.map((card, i) => (
          <div key={i} className="stat-card">
            <div style={{ width: '100%' }}>
              <div className="stat-value" style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>{card.title}</div>
              {card.rows.map((row, j) => (
                <div key={j} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0', fontSize: '0.85rem' }}>
                  <span style={{ color: '#718096' }}>{row.label}</span>
                  <span style={{ fontWeight: 500 }}>{row.value}</span>
                </div>
              ))}
              <button className="btn btn-secondary" style={{ marginTop: '0.6rem', width: '100%' }} onClick={card.action}>{card.actionLabel}</button>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3 className="card-title">{isArabic ? 'إجراءات مقترحة' : 'Next Actions'}</h3>
          {nextActions.length > 0 ? (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {nextActions.map((action, i) => (
                <li key={i} style={{ padding: '0.5rem 0', borderBottom: '1px solid #edf2f7' }}>
                  <button className="btn btn-secondary" onClick={() => onNavigate(action.tab)}>{action.label}</button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-data">{isArabic ? 'لا توجد إجراءات مطلوبة حالياً' : 'No actions required right now'}</p>
          )}
        </div>

        <div className="card">
          <h3 className="card-title">{isArabic ? 'الفواتير حسب الحالة' : 'Invoices by Status'}</h3>
          {canManage && invoices.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {invoices.map(inv => (
                <span key={inv.id}>
                  <FinancialStatusBadge status={inv.status} /> #{inv.invoiceNumber} - {currency(inv.totalAmount)}
                </span>
              ))}
            </div>
          ) : (
            <p className="no-data">{canManage ? (isArabic ? 'لا توجد فواتير' : 'No invoices') : (isArabic ? 'غير متاح لصلاحياتك' : 'Not available for your role')}</p>
          )}
        </div>
      </div>

      {notifications.length > 0 && (
        <div className="card">
          <h3 className="card-title">{isArabic ? 'النشاط الأخير' : 'Recent Activity'}</h3>
          <div className="notifications-list">
            {notifications.map(n => (
              <div key={n.id} className="notification-item">
                <div className="notification-content">
                  <h4>{n.title}</h4>
                  <p>{n.message}</p>
                </div>
                <span className="notification-date">{new Date(n.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseOverview;
