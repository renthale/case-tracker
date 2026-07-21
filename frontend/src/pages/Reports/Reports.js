import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';
import { FiPrinter, FiBarChart2, FiDollarSign, FiUsers, FiCalendar, FiBriefcase } from 'react-icons/fi';

const reportTabs = [
  { key: 'overview', icon: FiBarChart2, labelAr: 'نظرة عامة', labelEn: 'Overview' },
  { key: 'financial', icon: FiDollarSign, labelAr: 'المالي', labelEn: 'Financial' },
  { key: 'lawyer', icon: FiBriefcase, labelAr: 'المحامي', labelEn: 'Lawyer' },
  { key: 'sessions', icon: FiCalendar, labelAr: 'الجلسات', labelEn: 'Sessions' },
  { key: 'clients', icon: FiUsers, labelAr: 'العملاء', labelEn: 'Clients' },
];

const Reports = () => {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    cases: [], sessions: [], invoices: [], clients: [], users: []
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
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => { window.print(); };

  // Filter by date
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
    if (dateRange.from && s.sessionDate < dateRange.from) return false;
    if (dateRange.to && s.sessionDate > dateRange.to) return false;
    return true;
  });

  // Stats calculations
  const totalCases = filteredCases.length;
  const activeCases = filteredCases.filter(c => c.status === 'active').length;
  const closedCases = filteredCases.filter(c => c.status === 'closed').length;
  const totalInvoices = filteredInvoices.length;
  const totalInvoiceAmount = filteredInvoices.reduce((sum, inv) => sum + parseFloat(inv.totalAmount || 0), 0);
  const totalPaidAmount = filteredInvoices.reduce((sum, inv) => sum + parseFloat(inv.paidAmount || 0), 0);
  const pendingAmount = totalInvoiceAmount - totalPaidAmount;
  const paidInvoices = filteredInvoices.filter(i => i.status === 'paid').length;
  const pendingInvoices = filteredInvoices.filter(i => i.status === 'pending').length;
  const overdueInvoices = filteredInvoices.filter(i => i.status === 'overdue').length;

  const casesByType = {};
  filteredCases.forEach(c => { casesByType[c.type] = (casesByType[c.type] || 0) + 1; });

  const casesByStatus = {};
  filteredCases.forEach(c => { casesByStatus[c.status] = (casesByStatus[c.status] || 0) + 1; });

  // Lawyer stats
  const lawyerStats = {};
  filteredCases.forEach(c => {
    const lawyerId = c.assignedLawyerId;
    if (lawyerId) {
      if (!lawyerStats[lawyerId]) lawyerStats[lawyerId] = { cases: 0, sessions: 0 };
      lawyerStats[lawyerId].cases++;
    }
  });

  // Session stats
  const sessionsByStatus = {};
  filteredSessions.forEach(s => { sessionsByStatus[s.status] = (sessionsByStatus[s.status] || 0) + 1; });

  const upcomingSessions = filteredSessions.filter(s => s.status === 'scheduled' && s.sessionDate >= new Date().toISOString().split('T')[0]);

  const renderOverview = () => (
    <div className="report-section">
      <div className="stats-grid">
        <div className="stat-card clickable" style={{ '--card-color': '#3498db' }}>
          <div className="stat-number">{totalCases}</div>
          <div className="stat-label">{isArabic ? 'إجمالي القضايا' : 'Total Cases'}</div>
        </div>
        <div className="stat-card clickable" style={{ '--card-color': '#2ecc71' }}>
          <div className="stat-number">{activeCases}</div>
          <div className="stat-label">{isArabic ? 'قضايا نشطة' : 'Active Cases'}</div>
        </div>
        <div className="stat-card clickable" style={{ '--card-color': '#e74c3c' }}>
          <div className="stat-number">{pendingAmount.toFixed(3)} {isArabic ? 'د.ك' : 'KWD'}</div>
          <div className="stat-label">{isArabic ? 'مبالغ معلقة' : 'Pending Amount'}</div>
        </div>
        <div className="stat-card clickable" style={{ '--card-color': '#f39c12' }}>
          <div className="stat-number">{data.clients.length}</div>
          <div className="stat-label">{isArabic ? 'الموكلين' : 'Clients'}</div>
        </div>
      </div>

      <div className="report-grid">
        <div className="report-card">
          <h3>{isArabic ? 'القضايا حسب النوع' : 'Cases by Type'}</h3>
          {Object.entries(casesByType).map(([type, count]) => (
            <div key={type} className="report-bar">
              <span className="bar-label">{type}</span>
              <div className="bar-container">
                <div className="bar-fill" style={{ width: `${(count / totalCases) * 100}%` }}></div>
              </div>
              <span className="bar-value">{count}</span>
            </div>
          ))}
        </div>

        <div className="report-card">
          <h3>{isArabic ? 'القضايا حسب الحالة' : 'Cases by Status'}</h3>
          {Object.entries(casesByStatus).map(([status, count]) => (
            <div key={status} className="report-bar">
              <span className="bar-label">{status}</span>
              <div className="bar-container">
                <div className="bar-fill" style={{ width: `${(count / totalCases) * 100}%`, backgroundColor: status === 'active' ? '#2ecc71' : status === 'closed' ? '#e74c3c' : '#f39c12' }}></div>
              </div>
              <span className="bar-value">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderFinancial = () => (
    <div className="report-section">
      <div className="stats-grid">
        <div className="stat-card" style={{ '--card-color': '#2ecc71' }}>
          <div className="stat-number">{totalPaidAmount.toFixed(3)} {isArabic ? 'د.ك' : 'KWD'}</div>
          <div className="stat-label">{isArabic ? 'المبلغ المدفوع' : 'Paid Amount'}</div>
        </div>
        <div className="stat-card" style={{ '--card-color': '#f39c12' }}>
          <div className="stat-number">{pendingAmount.toFixed(3)} {isArabic ? 'د.ك' : 'KWD'}</div>
          <div className="stat-label">{isArabic ? 'المبلغ المعلق' : 'Pending Amount'}</div>
        </div>
        <div className="stat-card" style={{ '--card-color': '#3498db' }}>
          <div className="stat-number">{totalInvoiceAmount.toFixed(3)} {isArabic ? 'د.ك' : 'KWD'}</div>
          <div className="stat-label">{isArabic ? 'الإجمالي' : 'Total'}</div>
        </div>
      </div>

      <div className="report-grid">
        <div className="report-card">
          <h3>{isArabic ? 'حالة الفواتير' : 'Invoice Status'}</h3>
          <div className="report-list">
            <div className="report-item"><span>{isArabic ? 'مدفوعة' : 'Paid'}</span><span className="success">{paidInvoices}</span></div>
            <div className="report-item"><span>{isArabic ? 'معلقة' : 'Pending'}</span><span className="warning">{pendingInvoices}</span></div>
            <div className="report-item"><span>{isArabic ? 'متأخرة' : 'Overdue'}</span><span className="danger">{overdueInvoices}</span></div>
            <div className="report-item"><span>{isArabic ? 'إجمالي الفواتير' : 'Total Invoices'}</span><span className="info">{totalInvoices}</span></div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLawyer = () => (
    <div className="report-section">
      <div className="report-card">
        <h3>{isArabic ? 'إحصائيات المحامين' : 'Lawyer Statistics'}</h3>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>{isArabic ? 'رقم المحامي' : 'Lawyer ID'}</th>
                <th>{isArabic ? 'عدد القضايا' : 'Cases Count'}</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(lawyerStats).map(([id, stats]) => (
                <tr key={id}>
                  <td>{id}</td>
                  <td>{stats.cases}</td>
                </tr>
              ))}
              {Object.keys(lawyerStats).length === 0 && (
                <tr><td colSpan="2" className="empty-cell">{isArabic ? 'لا توجد بيانات' : 'No data'}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderSessions = () => (
    <div className="report-section">
      <div className="stats-grid">
        <div className="stat-card" style={{ '--card-color': '#3498db' }}>
          <div className="stat-number">{filteredSessions.length}</div>
          <div className="stat-label">{isArabic ? 'إجمالي الجلسات' : 'Total Sessions'}</div>
        </div>
        <div className="stat-card" style={{ '--card-color': '#2ecc71' }}>
          <div className="stat-number">{upcomingSessions.length}</div>
          <div className="stat-label">{isArabic ? 'الجلسات القادمة' : 'Upcoming Sessions'}</div>
        </div>
      </div>

      <div className="report-grid">
        <div className="report-card">
          <h3>{isArabic ? 'حالة الجلسات' : 'Session Status'}</h3>
          <div className="report-list">
            {Object.entries(sessionsByStatus).map(([status, count]) => (
              <div key={status} className="report-item">
                <span>{status}</span>
                <span className="info">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="report-card">
          <h3>{isArabic ? 'الجلسات القادمة' : 'Upcoming Sessions'}</h3>
          <div className="report-list">
            {upcomingSessions.slice(0, 10).map(session => (
              <div key={session.id} className="report-item">
                <span>{session.Case?.caseNumber || ''} - {session.Case?.title || ''}</span>
                <span className="info">{session.sessionDate} {session.sessionTime}</span>
              </div>
            ))}
            {upcomingSessions.length === 0 && (
              <div className="report-item"><span>{isArabic ? 'لا توجد جلسات قادمة' : 'No upcoming sessions'}</span></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderClients = () => (
    <div className="report-section">
      <div className="stats-grid">
        <div className="stat-card" style={{ '--card-color': '#9b59b6' }}>
          <div className="stat-number">{data.clients.length}</div>
          <div className="stat-label">{isArabic ? 'إجمالي العملاء' : 'Total Clients'}</div>
        </div>
        <div className="stat-card" style={{ '--card-color': '#2ecc71' }}>
          <div className="stat-number">{data.clients.filter(c => c.isActive).length}</div>
          <div className="stat-label">{isArabic ? 'العملاء النشطين' : 'Active Clients'}</div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    if (loading) return <div className="loading">{isArabic ? 'جاري التحميل...' : 'Loading...'}</div>;
    switch (activeTab) {
      case 'financial': return renderFinancial();
      case 'lawyer': return renderLawyer();
      case 'sessions': return renderSessions();
      case 'clients': return renderClients();
      default: return renderOverview();
    }
  };

  return (
    <div className="page-container print-page">
      <div className="page-header no-print">
        <h1><FiBarChart2 /> {isArabic ? 'التقارير' : 'Reports'}</h1>
        <button className="btn btn-secondary" onClick={handlePrint}>
          <FiPrinter /> {isArabic ? 'طباعة' : 'Print'}
        </button>
      </div>

      <div className="no-print">
        <div className="filters-bar">
          <div className="date-range">
            <input type="date" value={dateRange.from} onChange={e => setDateRange({ ...dateRange, from: e.target.value })} />
            <span>{isArabic ? 'إلى' : 'to'}</span>
            <input type="date" value={dateRange.to} onChange={e => setDateRange({ ...dateRange, to: e.target.value })} />
          </div>
        </div>

        <div className="report-tabs">
          {reportTabs.map(tab => (
            <button key={tab.key} className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}>
              <tab.icon />
              {isArabic ? tab.labelAr : tab.labelEn}
            </button>
          ))}
        </div>
      </div>

      {renderContent()}
    </div>
  );
};

export default Reports;
