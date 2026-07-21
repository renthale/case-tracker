import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiPrinter, FiBarChart2, FiDollarSign, FiUsers, FiCalendar, FiBriefcase } from 'react-icons/fi';

const reportTabs = [
  { key: 'overview', icon: FiBarChart2, labelAr: 'نظرة عامة', labelEn: 'Overview' },
  { key: 'lawyer', icon: FiBriefcase, labelAr: 'المحامي', labelEn: 'Lawyer' },
  { key: 'financial', icon: FiDollarSign, labelAr: 'الأتعاب الشهرية', labelEn: 'Monthly Fees' },
  { key: 'sessions', icon: FiCalendar, labelAr: 'الجلسات القادمة', labelEn: 'Upcoming Sessions' },
  { key: 'clients', icon: FiUsers, labelAr: 'العملاء النشطين', labelEn: 'Active Clients' },
];

const Reports = () => {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [loading, setLoading] = useState(true);
  const [checkingOverdue, setCheckingOverdue] = useState(false);
  const [feeReport, setFeeReport] = useState(null);
  const [data, setData] = useState({
    cases: [], sessions: [], invoices: [], clients: []
  });

  useEffect(() => { fetchAllData(); }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [casesRes, sessionsRes, invoicesRes, clientsRes] = await Promise.all([
        api.get('/cases?limit=500'),
        api.get('/sessions?limit=500'),
        api.get('/invoices?limit=500'),
        api.get('/clients?limit=500'),
      ]);
      setData({
        cases: casesRes.data.cases || [],
        sessions: sessionsRes.data.sessions || [],
        invoices: invoicesRes.data.invoices || [],
        clients: clientsRes.data.clients || [],
      });
      try {
        const feeRes = await api.get('/invoices/fees-report');
        setFeeReport(feeRes.data);
      } catch (e) {
        console.error('Fee report error:', e);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => { window.print(); };

  const handleCheckOverdue = async () => {
    setCheckingOverdue(true);
    try {
      const { data } = await api.get('/invoices/overdue');
      toast.success(isArabic ?
        'تم فحص ' + data.overdue + ' فاتورة متأخرة و' + data.upcoming + ' فاتورة تستحق قريباً' :
        'Checked ' + data.overdue + ' overdue and ' + data.upcoming + ' upcoming invoices'
      );
    } catch (error) {
      toast.error(isArabic ? 'خطأ في الفحص' : 'Check error');
    } finally {
      setCheckingOverdue(false);
    }
  };

  // Filtering
  const filteredCases = data.cases.filter(c => {
    if (dateRange.from && c.createdAt < dateRange.from) return false;
    if (dateRange.to && c.createdAt > dateRange.to + 'T23:59:59') return false;
    return true;
  });

  const filteredInvoices = data.invoices.filter(inv => {
    if (dateRange.from && inv.createdAt < dateRange.from) return false;
    if (dateRange.to && inv.createdAt > dateRange.to + 'T23:59:59') return false;
    return true;
  });

  const filteredSessions = data.sessions.filter(s => {
    const sDate = new Date(s.date);
    if (dateRange.from && sDate < new Date(dateRange.from)) return false;
    if (dateRange.to && sDate > new Date(dateRange.to + 'T23:59:59')) return false;
    return true;
  });

  // Stats
  const totalCases = filteredCases.length;
  const activeCases = filteredCases.filter(c => c.status === 'active').length;
  const closedCases = filteredCases.filter(c => c.status === 'closed').length;
  const wonCases = filteredCases.filter(c => c.status === 'won').length;
  const totalPaid = filteredInvoices.reduce((s, i) => s + parseFloat(i.paidAmount || 0), 0);
  const totalPending = filteredInvoices.reduce((s, i) => s + (parseFloat(i.totalAmount || 0) - parseFloat(i.paidAmount || 0)), 0);
  const totalInvoices = filteredInvoices.length;
  const paidInvoices = filteredInvoices.filter(i => i.status === 'paid').length;
  const pendingInvoices = filteredInvoices.filter(i => i.status === 'pending').length;
  const overdueInvoices = filteredInvoices.filter(i => i.status === 'overdue').length;
  const upcomingSessions = filteredSessions.filter(s => s.status === 'scheduled');
  const completedSessions = filteredSessions.filter(s => s.status === 'completed');
  const activeClients = data.clients.filter(c => c.isActive);
  const clientsWithCases = data.clients.filter(c => c.Cases && c.Cases.length > 0);

  // Lawyer stats
  const lawyerMap = {};
  filteredCases.forEach(c => {
    const lid = c.assignedLawyerId;
    if (!lid) return;
    if (!lawyerMap[lid]) lawyerMap[lid] = { name: c.assignedLawyer?.fullName || 'رقم ' + lid, cases: 0, sessions: 0, totalFees: 0, paidFees: 0 };
    lawyerMap[lid].cases++;
    lawyerMap[lid].totalFees += parseFloat(c.consultationFees || 0) + parseFloat(c.litigationFees || 0) + parseFloat(c.sessionFees || 0) + parseFloat(c.otherFees || 0);
    lawyerMap[lid].paidFees += c.paymentStatus === 'paid' ? lawyerMap[lid].totalFees : 0;
  });
  filteredSessions.forEach(s => {
    const cid = s.caseId;
    const c = filteredCases.find(c => c.id === cid);
    if (c && c.assignedLawyerId && lawyerMap[c.assignedLawyerId]) {
      lawyerMap[c.assignedLawyerId].sessions++;
    }
  });

  const statCardStyle = (color) => ({ padding: '1rem', background: color + '15', borderRadius: 8, borderLeft: '4px solid ' + color, textAlign: 'center' });
  const statNumStyle = (color) => ({ fontSize: '1.5rem', fontWeight: 'bold', color });
  const statLabelStyle = () => ({ fontSize: '0.85rem', color: '#666', marginTop: 4 });

  // ---- TABS ----

  const renderOverview = () => (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={statCardStyle('#3498db')}>
          <div style={statNumStyle('#3498db')}>{totalCases}</div>
          <div style={statLabelStyle()}>{isArabic ? 'إجمالي القضايا' : 'Total Cases'}</div>
        </div>
        <div style={statCardStyle('#2ecc71')}>
          <div style={statNumStyle('#2ecc71')}>{activeCases}</div>
          <div style={statLabelStyle()}>{isArabic ? 'قضايا نشطة' : 'Active Cases'}</div>
        </div>
        <div style={statCardStyle('#e74c3c')}>
          <div style={statNumStyle('#e74c3c')}>{wonCases}</div>
          <div style={statLabelStyle()}>{isArabic ? 'قضايا مكتسبة' : 'Won Cases'}</div>
        </div>
        <div style={statCardStyle('#f39c12')}>
          <div style={statNumStyle('#f39c12')}>{closedCases}</div>
          <div style={statLabelStyle()}>{isArabic ? 'قضايا مغلقة' : 'Closed Cases'}</div>
        </div>
        <div style={statCardStyle('#2ecc71')}>
          <div style={statNumStyle('#2ecc71')}>{totalPaid.toFixed(3)} {isArabic ? 'د.ك' : 'KWD'}</div>
          <div style={statLabelStyle()}>{isArabic ? 'المبلغ المدفوع' : 'Paid Amount'}</div>
        </div>
        <div style={statCardStyle('#e74c3c')}>
          <div style={statNumStyle('#e74c3c')}>{totalPending.toFixed(3)} {isArabic ? 'د.ك' : 'KWD'}</div>
          <div style={statLabelStyle()}>{isArabic ? 'المبلغ المعلق' : 'Pending Amount'}</div>
        </div>
        <div style={statCardStyle('#9b59b6')}>
          <div style={statNumStyle('#9b59b6')}>{data.clients.length}</div>
          <div style={statLabelStyle()}>{isArabic ? 'إجمالي العملاء' : 'Total Clients'}</div>
        </div>
        <div style={statCardStyle('#3498db')}>
          <div style={statNumStyle('#3498db')}>{filteredSessions.length}</div>
          <div style={statLabelStyle()}>{isArabic ? 'إجمالي الجلسات' : 'Total Sessions'}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ margin: 0 }}>
          <h3 style={{ fontSize: '0.95rem', marginBottom: '0.75rem' }}>{isArabic ? 'القضايا حسب النوع' : 'Cases by Type'}</h3>
          {Object.entries(filteredCases.reduce((acc, c) => { acc[c.type] = (acc[c.type] || 0) + 1; return acc; }, {}))
            .sort((a, b) => b[1] - a[1])
            .map(([type, count]) => (
              <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ minWidth: 80, fontSize: '0.85rem' }}>{type}</span>
                <div style={{ flex: 1, height: 20, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: (count / totalCases * 100) + '%', height: '100%', background: '#3498db', borderRadius: 4 }} />
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{count}</span>
              </div>
            ))}
        </div>

        <div className="card" style={{ margin: 0 }}>
          <h3 style={{ fontSize: '0.95rem', marginBottom: '0.75rem' }}>{isArabic ? 'الفواتير حسب الحالة' : 'Invoices by Status'}</h3>
          {[
            { label: isArabic ? 'مدفوعة' : 'Paid', count: paidInvoices, color: '#2ecc71' },
            { label: isArabic ? 'معلقة' : 'Pending', count: pendingInvoices, color: '#f39c12' },
            { label: isArabic ? 'متأخرة' : 'Overdue', count: overdueInvoices, color: '#e74c3c' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ minWidth: 60, fontSize: '0.85rem' }}>{item.label}</span>
              <div style={{ flex: 1, height: 20, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: (item.count / totalInvoices * 100 || 0) + '%', height: '100%', background: item.color, borderRadius: 4 }} />
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{item.count}</span>
            </div>
          ))}
        </div>

        <div className="card" style={{ margin: 0 }}>
          <h3 style={{ fontSize: '0.95rem', marginBottom: '0.75rem' }}>{isArabic ? 'ملخص الجلسات' : 'Sessions Summary'}</h3>
          {[
            { label: isArabic ? 'مجدولة' : 'Scheduled', count: upcomingSessions.length, color: '#3498db' },
            { label: isArabic ? 'منجزة' : 'Completed', count: completedSessions.length, color: '#2ecc71' },
            { label: isArabic ? 'مؤجلة' : 'Postponed', count: filteredSessions.filter(s => s.status === 'postponed').length, color: '#f39c12' },
            { label: isArabic ? 'ملغاة' : 'Cancelled', count: filteredSessions.filter(s => s.status === 'cancelled').length, color: '#e74c3c' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f0f0f0' }}>
              <span style={{ fontSize: '0.85rem' }}>{item.label}</span>
              <span style={{ fontSize: '0.95rem', fontWeight: 'bold', color: item.color }}>{item.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderLawyer = () => (
    <div>
      <div className="card" style={{ margin: 0 }}>
        <h3 style={{ fontSize: '0.95rem', marginBottom: '1rem' }}>{isArabic ? 'تقرير المحامي — القضايا، الجلسات، الأتعاب' : 'Lawyer Report — Cases, Sessions, Fees'}</h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>{isArabic ? 'المحامي' : 'Lawyer'}</th>
                <th>{isArabic ? 'القضايا' : 'Cases'}</th>
                <th>{isArabic ? 'الجلسات' : 'Sessions'}</th>
                <th>{isArabic ? 'إجمالي الأتعاب' : 'Total Fees'}</th>
                <th>{isArabic ? 'النسبة' : 'Share'}</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(lawyerMap)
                .sort((a, b) => b[1].totalFees - a[1].totalFees)
                .map(([id, stats]) => {
                  const grandTotal = Object.values(lawyerMap).reduce((s, l) => s + l.totalFees, 0);
                  const pct = grandTotal > 0 ? (stats.totalFees / grandTotal * 100).toFixed(1) : 0;
                  return (
                    <tr key={id}>
                      <td style={{ fontWeight: 'bold' }}>{stats.name}</td>
                      <td>{stats.cases}</td>
                      <td>{stats.sessions}</td>
                      <td>{stats.totalFees.toFixed(3)} {isArabic ? 'د.ك' : 'KWD'}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 60, height: 8, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{ width: pct + '%', height: '100%', background: '#3498db', borderRadius: 4 }} />
                          </div>
                          <span style={{ fontSize: '0.8rem' }}>{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              {Object.keys(lawyerMap).length === 0 && (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: 20, color: '#999' }}>
                  {isArabic ? 'لا توجد بيانات' : 'No data'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {feeReport && feeReport.feesByCase && (
        <div className="card" style={{ marginTop: '1rem' }}>
          <h3 style={{ fontSize: '0.95rem', marginBottom: '1rem' }}>{isArabic ? 'تفاصيل الأتعاب حسب القضية' : 'Fees Breakdown by Case'}</h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>{isArabic ? 'رقم القضية' : 'Case No.'}</th>
                  <th>{isArabic ? 'العنوان' : 'Title'}</th>
                  <th>{isArabic ? 'المحامي' : 'Lawyer'}</th>
                  <th>{isArabic ? 'استشارة' : 'Consultation'}</th>
                  <th>{isArabic ? 'ترافع' : 'Litigation'}</th>
                  <th>{isArabic ? 'جلسات' : 'Sessions'}</th>
                  <th>{isArabic ? 'أخرى' : 'Other'}</th>
                  <th>{isArabic ? 'الحالة' : 'Status'}</th>
                </tr>
              </thead>
              <tbody>
                {feeReport.feesByCase.map(c => (
                  <tr key={c.id}>
                    <td>{c.caseNumber}</td>
                    <td>{c.title}</td>
                    <td>{c.assignedLawyer?.fullName || '-'}</td>
                    <td>{parseFloat(c.consultationFees || 0).toFixed(3)}</td>
                    <td>{parseFloat(c.litigationFees || 0).toFixed(3)}</td>
                    <td>{parseFloat(c.sessionFees || 0).toFixed(3)}</td>
                    <td>{parseFloat(c.otherFees || 0).toFixed(3)}</td>
                    <td>
                      <span className={'badge badge-' + (c.paymentStatus === 'paid' ? 'won' : c.paymentStatus === 'partial' ? 'pending' : 'lost')}>
                        {c.paymentStatus === 'paid' ? (isArabic ? 'مدفوع' : 'Paid') : c.paymentStatus === 'partial' ? (isArabic ? 'جزئي' : 'Partial') : (isArabic ? 'غير مدفوع' : 'Unpaid')}
                      </span>
                    </td>
                  </tr>
                ))}
                {feeReport.feesByCase.length === 0 && (
                  <tr><td colSpan="8" style={{ textAlign: 'center', padding: 20, color: '#999' }}>
                    {isArabic ? 'لا توجد بيانات أتعاب' : 'No fee data'}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  const renderFinancial = () => (
    <div>
      <div className="no-print" style={{ marginBottom: '1rem' }}>
        <button className="btn btn-warning" onClick={handleCheckOverdue} disabled={checkingOverdue}>
          {checkingOverdue ? (isArabic ? 'جاري الفحص...' : 'Checking...') : (isArabic ? 'فحص الفواتير المتأخرة' : 'Check Overdue Invoices')}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={statCardStyle('#2ecc71')}>
          <div style={statNumStyle('#2ecc71')}>{totalPaid.toFixed(3)} {isArabic ? 'د.ك' : 'KWD'}</div>
          <div style={statLabelStyle()}>{isArabic ? 'المبلغ المدفوع' : 'Paid Amount'}</div>
        </div>
        <div style={statCardStyle('#f39c12')}>
          <div style={statNumStyle('#f39c12')}>{totalPending.toFixed(3)} {isArabic ? 'د.ك' : 'KWD'}</div>
          <div style={statLabelStyle()}>{isArabic ? 'المبلغ المعلق' : 'Pending Amount'}</div>
        </div>
        <div style={statCardStyle('#3498db')}>
          <div style={statNumStyle('#3498db')}>{(totalPaid + totalPending).toFixed(3)} {isArabic ? 'د.ك' : 'KWD'}</div>
          <div style={statLabelStyle()}>{isArabic ? 'الإجمالي' : 'Total'}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1rem' }}>
        {feeReport && feeReport.feesByMonth && (
          <div className="card" style={{ margin: 0 }}>
            <h3 style={{ fontSize: '0.95rem', marginBottom: '0.75rem' }}>{isArabic ? 'الأتعاب حسب الشهر' : 'Fees by Month'}</h3>
            {feeReport.feesByMonth.map(month => {
              const total = parseFloat(month.consultationTotal || 0) + parseFloat(month.litigationTotal || 0) +
                parseFloat(month.sessionTotal || 0) + parseFloat(month.otherTotal || 0);
              return (
                <div key={month.month} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f0f0f0', fontSize: '0.9rem' }}>
                  <span>{month.month} <small style={{ color: '#999' }}>({month.caseCount} {isArabic ? 'قضية' : 'cases'})</small></span>
                  <span style={{ fontWeight: 'bold' }}>{total.toFixed(3)} {isArabic ? 'د.ك' : 'KWD'}</span>
                </div>
              );
            })}
            {feeReport.feesByMonth.length === 0 && (
              <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>{isArabic ? 'لا توجد بيانات' : 'No data'}</div>
            )}
          </div>
        )}

        {feeReport && feeReport.feesByLawyer && (
          <div className="card" style={{ margin: 0 }}>
            <h3 style={{ fontSize: '0.95rem', marginBottom: '0.75rem' }}>{isArabic ? 'الأتعاب حسب المحامي' : 'Fees by Lawyer'}</h3>
            {feeReport.feesByLawyer.map(lawyer => (
              <div key={lawyer.assignedLawyer?.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f0f0f0', fontSize: '0.9rem' }}>
                <span>{lawyer.assignedLawyer?.fullName || (isArabic ? 'غير محدد' : 'Unassigned')}</span>
                <span style={{ fontWeight: 'bold' }}>
                  {parseFloat(lawyer.grandTotal || 0).toFixed(3)} {isArabic ? 'د.ك' : 'KWD'}
                  <small style={{ color: '#999', marginRight: 8 }}>
                    (استشارة: {parseFloat(lawyer.consultationTotal || 0)} | ترافع: {parseFloat(lawyer.litigationTotal || 0)} | جلسات: {parseFloat(lawyer.sessionTotal || 0)})
                  </small>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderSessions = () => {
    const now = new Date();
    const thisWeek = filteredSessions.filter(s => {
      const d = new Date(s.date);
      const diff = (d - now) / (1000 * 60 * 60 * 24);
      return s.status === 'scheduled' && diff >= 0 && diff <= 7;
    });
    const thisMonth = filteredSessions.filter(s => {
      const d = new Date(s.date);
      return s.status === 'scheduled' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    return (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={statCardStyle('#3498db')}>
            <div style={statNumStyle('#3498db')}>{upcomingSessions.length}</div>
            <div style={statLabelStyle()}>{isArabic ? 'الجلسات القادمة' : 'Upcoming'}</div>
          </div>
          <div style={statCardStyle('#e74c3c')}>
            <div style={statNumStyle('#e74c3c')}>{thisWeek.length}</div>
            <div style={statLabelStyle()}>{isArabic ? 'هذا الأسبوع' : 'This Week'}</div>
          </div>
          <div style={statCardStyle('#f39c12')}>
            <div style={statNumStyle('#f39c12')}>{thisMonth.length}</div>
            <div style={statLabelStyle()}>{isArabic ? 'هذا الشهر' : 'This Month'}</div>
          </div>
          <div style={statCardStyle('#2ecc71')}>
            <div style={statNumStyle('#2ecc71')}>{completedSessions.length}</div>
            <div style={statLabelStyle()}>{isArabic ? 'منجزة' : 'Completed'}</div>
          </div>
        </div>

        <div className="card" style={{ margin: 0 }}>
          <h3 style={{ fontSize: '0.95rem', marginBottom: '1rem' }}>{isArabic ? 'الجلسات القادمة — التفاصيل' : 'Upcoming Sessions — Details'}</h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>{isArabic ? 'التاريخ' : 'Date'}</th>
                  <th>{isArabic ? 'الوقت' : 'Time'}</th>
                  <th>{isArabic ? 'رقم القضية' : 'Case No.'}</th>
                  <th>{isArabic ? 'القضية' : 'Case'}</th>
                  <th>{isArabic ? 'الرقم' : 'Session #'}</th>
                  <th>{isArabic ? 'الموقع' : 'Location'}</th>
                  <th>{isArabic ? 'الحالة' : 'Status'}</th>
                </tr>
              </thead>
              <tbody>
                {upcomingSessions.sort((a, b) => new Date(a.date) - new Date(b.date)).map(s => (
                  <tr key={s.id}>
                    <td>{new Date(s.date).toLocaleDateString('ar-KW')}</td>
                    <td>{s.time || '-'}</td>
                    <td>{s.Case?.caseNumber || '-'}</td>
                    <td>{s.Case?.title || '-'}</td>
                    <td>{s.sessionNumber}</td>
                    <td>{s.location || '-'}</td>
                    <td>
                      <span className={'badge badge-' + (s.status === 'scheduled' ? 'active' : s.status === 'completed' ? 'won' : s.status === 'postponed' ? 'pending' : 'lost')}>
                        {s.status === 'scheduled' ? (isArabic ? 'مجدولة' : 'Scheduled') : s.status === 'completed' ? (isArabic ? 'منجزة' : 'Completed') : s.status === 'postponed' ? (isArabic ? 'مؤجلة' : 'Postponed') : (isArabic ? 'ملغاة' : 'Cancelled')}
                      </span>
                    </td>
                  </tr>
                ))}
                {upcomingSessions.length === 0 && (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: 20, color: '#999' }}>
                    {isArabic ? 'لا توجد جلسات قادمة' : 'No upcoming sessions'}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderClients = () => {
    const clientStats = data.clients.map(c => {
      const clientCases = data.cases.filter(cs => cs.clientId === c.id);
      const clientSessions = data.sessions.filter(s => clientCases.some(cs => cs.id === s.caseId));
      const clientInvoices = data.invoices.filter(inv => clientCases.some(cs => cs.id === inv.caseId));
      const totalPaid = clientInvoices.reduce((s, i) => s + parseFloat(i.paidAmount || 0), 0);
      return {
        ...c,
        casesCount: clientCases.length,
        sessionsCount: clientSessions.length,
        totalPaid
      };
    }).sort((a, b) => b.casesCount - a.casesCount);

    return (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={statCardStyle('#9b59b6')}>
            <div style={statNumStyle('#9b59b6')}>{data.clients.length}</div>
            <div style={statLabelStyle()}>{isArabic ? 'إجمالي العملاء' : 'Total Clients'}</div>
          </div>
          <div style={statCardStyle('#2ecc71')}>
            <div style={statNumStyle('#2ecc71')}>{activeClients.length}</div>
            <div style={statLabelStyle()}>{isArabic ? 'العملاء النشطين' : 'Active Clients'}</div>
          </div>
          <div style={statCardStyle('#3498db')}>
            <div style={statNumStyle('#3498db')}>{clientsWithCases.length}</div>
            <div style={statLabelStyle()}>{isArabic ? 'عملاء لهم قضايا' : 'Clients with Cases'}</div>
          </div>
        </div>

        <div className="card" style={{ margin: 0 }}>
          <h3 style={{ fontSize: '0.95rem', marginBottom: '1rem' }}>{isArabic ? 'قائمة العملاء النشطين' : 'Active Clients List'}</h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>{isArabic ? 'الاسم' : 'Name'}</th>
                  <th>{isArabic ? 'رقم المدني' : 'Civil ID'}</th>
                  <th>{isArabic ? 'الجوال' : 'Phone'}</th>
                  <th>{isArabic ? 'القضايا' : 'Cases'}</th>
                  <th>{isArabic ? 'الجلسات' : 'Sessions'}</th>
                  <th>{isArabic ? 'المبلغ المدفوع' : 'Paid Amount'}</th>
                  <th>{isArabic ? 'الحالة' : 'Status'}</th>
                </tr>
              </thead>
              <tbody>
                {clientStats.filter(c => c.isActive).map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 'bold' }}>{c.name}</td>
                    <td>{c.civilId || '-'}</td>
                    <td>{c.phone || '-'}</td>
                    <td>{c.casesCount}</td>
                    <td>{c.sessionsCount}</td>
                    <td>{c.totalPaid.toFixed(3)} {isArabic ? 'د.ك' : 'KWD'}</td>
                    <td>
                      <span className="badge badge-won">{isArabic ? 'نشط' : 'Active'}</span>
                    </td>
                  </tr>
                ))}
                {clientStats.filter(c => c.isActive).length === 0 && (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: 20, color: '#999' }}>
                    {isArabic ? 'لا يوجد عملاء نشطين' : 'No active clients'}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (loading) return <div className="loading">{isArabic ? 'جاري التحميل...' : 'Loading...'}</div>;
    switch (activeTab) {
      case 'lawyer': return renderLawyer();
      case 'financial': return renderFinancial();
      case 'sessions': return renderSessions();
      case 'clients': return renderClients();
      default: return renderOverview();
    }
  };

  return (
    <div className="page-container print-page">
      <div className="page-header no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1><FiBarChart2 /> {isArabic ? 'التقارير الشاملة' : 'Comprehensive Reports'}</h1>
        <button className="btn btn-secondary" onClick={handlePrint}>
          <FiPrinter /> {isArabic ? 'طباعة التقرير' : 'Print Report'}
        </button>
      </div>

      <div className="no-print">
        <div className="filters-bar" style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input type="date" value={dateRange.from} onChange={e => setDateRange({ ...dateRange, from: e.target.value })} className="form-control" style={{ maxWidth: 180 }} />
            <span style={{ color: '#666' }}>{isArabic ? 'إلى' : 'to'}</span>
            <input type="date" value={dateRange.to} onChange={e => setDateRange({ ...dateRange, to: e.target.value })} className="form-control" style={{ maxWidth: 180 }} />
          </div>
        </div>

        <div className="report-tabs" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          {reportTabs.map(tab => (
            <button key={tab.key}
              className={'btn ' + (activeTab === tab.key ? 'btn-primary' : 'btn-secondary')}
              onClick={() => setActiveTab(tab.key)} style={{ fontSize: '0.9rem' }}>
              <tab.icon /> {isArabic ? tab.labelAr : tab.labelEn}
            </button>
          ))}
        </div>
      </div>

      {renderContent()}
    </div>
  );
};

export default Reports;
