import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import {
  FiFileText, FiClock, FiAlertTriangle, FiArrowRight,
  FiCalendar, FiDollarSign, FiActivity, FiPercent, FiInbox, FiUser
} from 'react-icons/fi';
import { format } from 'date-fns';
import { ar as arLocale } from 'date-fns/locale';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip
} from 'recharts';

const FINANCIAL_ROLES = ['admin', 'partner', 'legal_secretary'];

const currency = (value) => `${parseFloat(value || 0).toFixed(3)} د.ك`;

const INVOICE_COLORS = {
  paid: '#27ae60',
  overdue: '#eb5757',
  pending: '#f2994a',
  sent: '#2f80ed',
  partially_paid: '#bb6bd9',
  draft: '#9aa5b1',
  cancelled: '#6c757d'
};

const SESSION_COLORS = {
  scheduled: '#2f80ed',
  completed: '#27ae60',
  postponed: '#f2994a',
  cancelled: '#eb5757'
};

const NoData = ({ message }) => (
  <div className="dash-empty" style={{ minHeight: 120 }}>{message}</div>
);

const CaseOverview = ({ caseData, onNavigate }) => {
  const { t, language } = useLanguage();
  const isArabic = language === 'ar';
  const { user } = useAuth();
  const canManage = FINANCIAL_ROLES.includes(user?.role);

  const sessions = caseData.sessions || [];
  const invoices = caseData.invoices || [];
  const entries = caseData.financialEntries || [];
  const documents = caseData.legalDocuments || [];
  const transactions = caseData.transactions || [];
  const notifications = caseData.notifications || [];
  const feeAgreement = caseData.feeAgreement;

  const upcomingSessions = sessions
    .filter(s => s.status === 'scheduled' && new Date(s.date) >= new Date())
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  const nextSession = upcomingSessions[0];

  const sessionCounts = {
    scheduled: sessions.filter(s => s.status === 'scheduled').length,
    completed: sessions.filter(s => s.status === 'completed').length,
    postponed: sessions.filter(s => s.status === 'postponed').length,
    cancelled: sessions.filter(s => s.status === 'cancelled').length
  };

  const activeInvoices = invoices.filter(i => i.status !== 'cancelled');
  const totalInvoiced = activeInvoices.reduce((s, i) => s + parseFloat(i.totalAmount || 0), 0);
  const totalPaid = activeInvoices.reduce((s, i) => s + parseFloat(i.paidAmount || 0), 0);
  const outstanding = totalInvoiced - totalPaid;
  const overdueAmount = invoices.filter(i => i.status === 'overdue').reduce((s, i) => s + parseFloat(i.totalAmount || 0), 0);
  const unbilled = entries.filter(e => e.billable && e.billingStatus === 'unbilled').reduce((s, e) => s + parseFloat(e.amount), 0);
  const professionalFees = entries.filter(e => e.type === 'professional_fee').reduce((s, e) => s + parseFloat(e.amount), 0);
  const agreedFee = parseFloat(feeAgreement?.agreedAmount || 0);

  const invoiceStatusCounts = invoices.reduce((acc, i) => {
    acc[i.status] = (acc[i.status] || 0) + 1;
    return acc;
  }, {});

  const invoiceChartData = ['paid', 'overdue', 'pending', 'sent', 'partially_paid', 'draft', 'cancelled']
    .map((status) => ({
      name: t[status] || status,
      value: invoiceStatusCounts[status] || 0,
      color: INVOICE_COLORS[status]
    }))
    .filter((d) => d.value > 0);

  const sessionChartData = ['scheduled', 'completed', 'postponed', 'cancelled']
    .map((status) => ({
      name: t[status] || status,
      value: sessionCounts[status],
      color: SESSION_COLORS[status]
    }))
    .filter((d) => d.value > 0);

  const nextActions = [];
  if (upcomingSessions.length > 0) {
    nextActions.push({ label: isArabic ? 'الجلسات القادمة تتطلب متابعة' : 'Upcoming sessions need attention', tab: 'sessions', icon: <FiCalendar /> });
  }
  if (canManage && outstanding > 0) {
    nextActions.push({ label: isArabic ? 'هناك رصيد مستحق على الفواتير' : 'Invoices have outstanding balance', tab: 'invoices', icon: <FiDollarSign /> });
  }
  if (canManage && unbilled > 0) {
    nextActions.push({ label: isArabic ? 'بنود قابلة للفوترة لم تفوتر بعد' : 'Billable items not yet invoiced', tab: 'financials', icon: <FiInbox /> });
  }
  if (canManage && overdueAmount > 0) {
    nextActions.push({ label: isArabic ? 'فواتير متأخرة' : 'Overdue invoices', tab: 'invoices', icon: <FiAlertTriangle /> });
  }

  const noDataMessage = t.noDataForCharts || (isArabic ? 'لا توجد بيانات لعرضها' : 'No data available');

  const renderDonut = (data, totalLabel) => {
    const total = data.reduce((s, d) => s + d.value, 0);
    if (data.length === 0) {
      return <NoData message={noDataMessage} />;
    }
    return (
      <div className="dash-donut-wrap">
        <div className="dash-donut">
          <div dir="ltr" style={{ width: '100%', height: 170 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" innerRadius={44} outerRadius={64} paddingAngle={3} stroke="#fff" strokeWidth={2}>
                  {data.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [value, name]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="dash-donut-center">
            <span className="dash-donut-total">{total}</span>
            <span className="dash-donut-caption">{totalLabel}</span>
          </div>
        </div>
        <div className="dash-chart-legend">
          {data.map((entry, i) => (
            <div key={i} className="dash-legend-item">
              <span className="dash-legend-dot" style={{ background: entry.color }} />
              <span className="dash-legend-name">{entry.name}</span>
              <span className="dash-legend-value">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="case-overview">
      {/* Row 1: Status summary */}
      <div className="overview-status-grid">
        <div className="overview-status-card">
          <div className="ov-label">{isArabic ? 'حالة القضية' : 'Case Status'}</div>
          <span className={`overview-badge ${caseData.status || 'pending'}`}>
            {t[caseData.status] || caseData.status || '-'}
          </span>
        </div>
        <div className="overview-status-card">
          <div className="ov-label">{isArabic ? 'الأولوية' : 'Priority'}</div>
          <span className={`priority-badge ${caseData.priority || ''}`}>
            {t[caseData.priority] || caseData.priority || '-'}
          </span>
        </div>
        <div className="overview-status-card">
          <div className="ov-label">{isArabic ? 'الجلسة القادمة' : 'Next Session'}</div>
          <div className="ov-value">
            {nextSession ? (
              <>
                {format(new Date(nextSession.date), 'dd/MM/yyyy', { locale: arLocale })}
                <span style={{ color: '#718096', fontSize: '0.85rem', marginInlineStart: '0.4rem' }}>
                  {nextSession.time || ''}
                </span>
              </>
            ) : (
              '-'
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Key facts */}
      <div className="overview-section" style={{ marginTop: '1rem' }}>
        <div className="overview-section-title">
          <FiUser />
          {isArabic ? 'معلومات القضية' : 'Case Information'}
        </div>
        <div className="overview-meta-grid">
          <div className="overview-meta-item">
            <label>{t.caseNumber}</label>
            <span>{caseData.caseNumber || '-'}</span>
          </div>
          <div className="overview-meta-item">
            <label>{isArabic ? 'نوع القضية' : 'Case Type'}</label>
            <span>{t[caseData.type] || caseData.type || '-'}</span>
          </div>
          <div className="overview-meta-item">
            <label>{t.court}</label>
            <span>{caseData.court || '-'}</span>
          </div>
          <div className="overview-meta-item">
            <label>{t.judge}</label>
            <span>{caseData.judge || '-'}</span>
          </div>
          <div className="overview-meta-item">
            <label>{t.filingDate}</label>
            <span>
              {caseData.filingDate
                ? format(new Date(caseData.filingDate), 'dd/MM/yyyy', { locale: arLocale })
                : '-'}
            </span>
          </div>
          <div className="overview-meta-item">
            <label>{t.clientName}</label>
            <span>{caseData.clientName || '-'}</span>
          </div>
          <div className="overview-meta-item">
            <label>{isArabic ? 'الخصم' : 'Opposing Party'}</label>
            <span>{caseData.opposingParty || '-'}</span>
          </div>
          <div className="overview-meta-item">
            <label>{isArabic ? 'المحامي المسؤول' : 'Assigned Lawyer'}</label>
            <span>{caseData.assignedLawyer?.fullName || '-'}</span>
          </div>
        </div>
      </div>

      {/* Row 3: Sessions summary */}
      <div className="overview-section" style={{ marginTop: '1rem' }}>
        <div className="overview-section-title">
          <FiCalendar />
          {isArabic ? 'ملخص الجلسات' : 'Sessions Summary'}
        </div>
        <div className="overview-status-grid">
          {['scheduled', 'completed', 'postponed', 'cancelled'].map((key) => (
            <div key={key} className="overview-status-card">
              <div className="ov-label">{t[key] || key}</div>
              <div className="ov-value">{sessionCounts[key]}</div>
            </div>
          ))}
          <div className="overview-status-card">
            <div className="ov-label">{isArabic ? 'الإجمالي' : 'Total'}</div>
            <div className="ov-value">{sessions.length}</div>
          </div>
          <div className="overview-status-card">
            <div className="ov-label">{isArabic ? 'المعاملات الحكومية' : 'Gov. Transactions'}</div>
            <div className="ov-value">{transactions.length}</div>
          </div>
        </div>
      </div>

      {/* Row 4: Financial summary */}
      {canManage && (
        <div className="overview-section" style={{ marginTop: '1rem' }}>
          <div className="overview-section-title">
            <FiDollarSign />
            {isArabic ? 'الملخص المالي' : 'Financial Summary'}
          </div>
          <div className="overview-fin-row">
            <div className="overview-fin-card" style={{ '--fin-accent': '#805ad5', '--fin-text': '#805ad5' }}>
              <div className="ov-f-label">{isArabic ? 'الأتعاب المتفق عليها' : 'Agreed Fee'}</div>
              <div className="ov-f-value">{currency(agreedFee)}</div>
              <div className="overview-fin-note">
                {feeAgreement ? (t[feeAgreement.feeArrangement] || feeAgreement.feeArrangement) : (isArabic ? 'لا يوجد اتفاق أتعاب' : 'No fee agreement')}
              </div>
            </div>
            <div className="overview-fin-card" style={{ '--fin-accent': '#2f80ed', '--fin-text': '#2f80ed' }}>
              <div className="ov-f-label">{isArabic ? 'مفوتر' : 'Invoiced'}</div>
              <div className="ov-f-value">{currency(totalInvoiced)}</div>
              <div className="overview-fin-note">{activeInvoices.length} {isArabic ? 'فاتورة' : 'invoices'}</div>
            </div>
            <div className="overview-fin-card" style={{ '--fin-accent': '#27ae60', '--fin-text': '#27ae60' }}>
              <div className="ov-f-label">{isArabic ? 'مدفوع' : 'Paid'}</div>
              <div className="ov-f-value">{currency(totalPaid)}</div>
              <div className="overview-fin-note">{isArabic ? 'إجمالي المدفوعات' : 'Total paid'}</div>
            </div>
            <div className="overview-fin-card" style={{ '--fin-accent': '#eb5757', '--fin-text': '#eb5757' }}>
              <div className="ov-f-label">{isArabic ? 'مستحق' : 'Outstanding'}</div>
              <div className="ov-f-value">{currency(outstanding)}</div>
              <div className="overview-fin-note">{isArabic ? 'إجمالي غير المدفوع' : 'Unpaid total'}</div>
            </div>
          </div>
          <div className="overview-fin-row" style={{ marginTop: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
            <div className="overview-fin-card" style={{ '--fin-accent': '#f2994a', '--fin-text': '#f2994a' }}>
              <div className="ov-f-label">{isArabic ? 'غير مفوتر' : 'Unbilled'}</div>
              <div className="ov-f-value">{currency(unbilled)}</div>
              <div className="overview-fin-note">
                {isArabic ? 'بنود قابلة للفوترة' : 'Billable items'}
              </div>
            </div>
            <div className="overview-fin-card" style={{ '--fin-accent': '#eb5757', '--fin-text': '#eb5757' }}>
              <div className="ov-f-label">{isArabic ? 'متأخر' : 'Overdue'}</div>
              <div className="ov-f-value">{currency(overdueAmount)}</div>
              <div className="overview-fin-note">{isArabic ? 'فواتير متأخرة' : 'Overdue invoices'}</div>
            </div>
            <div className="overview-fin-card" style={{ '--fin-accent': '#2f80ed', '--fin-text': '#2f80ed' }}>
              <div className="ov-f-label">{isArabic ? 'الأتعاب المهنية' : 'Professional Fees'}</div>
              <div className="ov-f-value">{currency(professionalFees)}</div>
              <div className="overview-fin-note">{isArabic ? 'بنود قابلة للفوترة' : 'Billable items'}</div>
            </div>
          </div>
        </div>
      )}

      {/* Row 5: Charts */}
      <div className="overview-section" style={{ marginTop: '1rem' }}>
        <div className="overview-section-title">
          <FiPercent />
          {isArabic ? 'التحليلات' : 'Analytics'}
        </div>
        <div className="overview-charts-grid">
          <div className="overview-chart-box">
            <div className="dash-chart-header">
              <FiFileText className="dash-chart-icon" />
              <h4 className="card-title">{isArabic ? 'الفواتير حسب الحالة' : 'Invoices by Status'}</h4>
            </div>
            {canManage ? renderDonut(invoiceChartData, isArabic ? 'فاتورة' : 'invoices') : (
              <NoData message={isArabic ? 'غير متاح لصلاحياتك' : 'Not available for your role'} />
            )}
          </div>
          <div className="overview-chart-box">
            <div className="dash-chart-header">
              <FiClock className="dash-chart-icon" />
              <h4 className="card-title">{isArabic ? 'الجلسات حسب الحالة' : 'Sessions by Status'}</h4>
            </div>
            {renderDonut(sessionChartData, isArabic ? 'جلسة' : 'sessions')}
          </div>
        </div>
      </div>

      {/* Row 6: Actions + Docs + Activity */}
      <div className="grid grid-2" style={{ marginTop: '1rem' }}>
        <div className="overview-section">
          <div className="overview-section-title">
            <FiAlertTriangle />
            {isArabic ? 'إجراءات مقترحة' : 'Next Actions'}
          </div>
          {nextActions.length > 0 ? (
            <div className="overview-actions-list">
              {nextActions.map((action, i) => (
                <button key={i} className="overview-action" onClick={() => onNavigate(action.tab)}>
                  {action.icon}
                  <span style={{ flex: 1 }}>{action.label}</span>
                  <FiArrowRight style={{ transform: isArabic ? 'rotate(180deg)' : 'none' }} />
                </button>
              ))}
            </div>
          ) : (
            <NoData message={isArabic ? 'لا توجد إجراءات مطلوبة حالياً' : 'No actions required right now'} />
          )}
        </div>

        <div className="overview-section">
          <div className="overview-section-title">
            <FiFileText />
            {isArabic ? 'المستندات' : 'Documents'}
          </div>
          {documents.length > 0 ? (
            <div className="overview-doc-list">
              {documents.slice(0, 5).map((doc) => (
                <div key={doc.id} className="overview-doc-item">
                  <FiFileText />
                  <span className="od-name">{doc.title || doc.type || '-'}</span>
                  {doc.uploadedAt && (
                    <span className="od-date">
                      {format(new Date(doc.uploadedAt), 'dd/MM/yyyy', { locale: arLocale })}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <NoData message={noDataMessage} />
          )}
        </div>
      </div>

      {notifications.length > 0 && (
        <div className="overview-section" style={{ marginTop: '1rem' }}>
          <div className="overview-section-title">
            <FiActivity />
            {isArabic ? 'النشاط الأخير' : 'Recent Activity'}
          </div>
          <div className="overview-activity-list">
            {notifications.slice(0, 6).map((n) => (
              <div key={n.id} className="overview-activity-item">
                <span className="oa-dot" style={{ background: INVOICE_COLORS[n.status] || '#2f80ed' }} />
                <div style={{ flex: 1 }}>
                  <div className="oa-text">{n.title}</div>
                  {n.message && <div style={{ fontSize: '0.78rem', color: '#718096' }}>{n.message}</div>}
                </div>
                <span className="oa-time">
                  {n.createdAt ? format(new Date(n.createdAt), 'dd/MM/yyyy', { locale: arLocale }) : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseOverview;
