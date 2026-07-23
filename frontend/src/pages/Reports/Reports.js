import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  FiPrinter, FiBarChart2, FiDollarSign, FiUsers, FiCalendar,
  FiBriefcase, FiFileText, FiFilter, FiMapPin
} from 'react-icons/fi';

const reportTabs = [
  { key: 'overview', icon: FiBarChart2, labelAr: 'نظرة عامة', labelEn: 'Overview' },
  { key: 'cases', icon: FiBriefcase, labelAr: 'القضايا', labelEn: 'Cases' },
  { key: 'sessions', icon: FiCalendar, labelAr: 'الجلسات', labelEn: 'Sessions' },
  { key: 'financial', icon: FiDollarSign, labelAr: 'المالية', labelEn: 'Financial' },
  { key: 'invoices', icon: FiFileText, labelAr: 'الفواتير', labelEn: 'Invoices' },
  { key: 'clients', icon: FiUsers, labelAr: 'العملاء', labelEn: 'Clients' },
  { key: 'courtAgent', icon: FiMapPin, labelAr: 'مندوب المحاكم', labelEn: 'Court Agent' },
];

const Reports = () => {
  const { language, t } = useLanguage();
  const { user } = useAuth();
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
  const lostCases = filteredCases.filter(c => c.status === 'lost').length;
  const totalPaid = filteredInvoices.reduce((s, i) => s + parseFloat(i.paidAmount || 0), 0);
  const totalPending = filteredInvoices.reduce((s, i) => s + (parseFloat(i.totalAmount || 0) - parseFloat(i.paidAmount || 0)), 0);
  const totalRevenue = filteredInvoices.reduce((s, i) => s + parseFloat(i.totalAmount || 0), 0);
  const totalInvoices = filteredInvoices.length;
  const paidInvoices = filteredInvoices.filter(i => i.status === 'paid').length;
  const pendingInvoices = filteredInvoices.filter(i => i.status === 'pending').length;
  const overdueInvoices = filteredInvoices.filter(i => i.status === 'overdue').length;
  const partialInvoices = filteredInvoices.filter(i => i.status === 'partial').length;
  const upcomingSessions = filteredSessions.filter(s => s.status === 'scheduled');
  const completedSessions = filteredSessions.filter(s => s.status === 'completed');
  const postponedSessions = filteredSessions.filter(s => s.status === 'postponed');
  const cancelledSessions = filteredSessions.filter(s => s.status === 'cancelled');
  const activeClients = data.clients.filter(c => c.isActive);

  // Lawyer stats
  const lawyerMap = {};
  filteredCases.forEach(c => {
    const lid = c.assignedLawyerId;
    if (!lid) return;
    if (!lawyerMap[lid]) lawyerMap[lid] = { name: c.assignedLawyer?.fullName || 'رقم ' + lid, cases: 0, sessions: 0, totalFees: 0, paidFees: 0 };
    lawyerMap[lid].cases++;
    lawyerMap[lid].totalFees += parseFloat(c.consultationFees || 0) + parseFloat(c.litigationFees || 0) + parseFloat(c.sessionFees || 0) + parseFloat(c.otherFees || 0);
  });
  filteredSessions.forEach(s => {
    const cid = s.caseId;
    const c = filteredCases.find(c => c.id === cid);
    if (c && c.assignedLawyerId && lawyerMap[c.assignedLawyerId]) {
      lawyerMap[c.assignedLawyerId].sessions++;
    }
  });

  // Invoice by client
  const invoiceByClient = {};
  filteredInvoices.forEach(inv => {
    const key = inv.clientId || 'unknown';
    if (!invoiceByClient[key]) invoiceByClient[key] = { name: inv.clientName || 'غير محدد', total: 0, paid: 0, pending: 0, count: 0 };
    invoiceByClient[key].total += parseFloat(inv.totalAmount || 0);
    invoiceByClient[key].paid += parseFloat(inv.paidAmount || 0);
    invoiceByClient[key].pending += parseFloat(inv.totalAmount || 0) - parseFloat(inv.paidAmount || 0);
    invoiceByClient[key].count++;
  });

  // Invoice by case
  const invoiceByCase = {};
  filteredInvoices.forEach(inv => {
    const key = inv.caseId || 'unknown';
    if (!invoiceByCase[key]) invoiceByCase[key] = { number: inv.caseNumber || '-', title: inv.caseTitle || '-', total: 0, paid: 0, pending: 0, count: 0 };
    invoiceByCase[key].total += parseFloat(inv.totalAmount || 0);
    invoiceByCase[key].paid += parseFloat(inv.paidAmount || 0);
    invoiceByCase[key].pending += parseFloat(inv.totalAmount || 0) - parseFloat(inv.paidAmount || 0);
    invoiceByCase[key].count++;
  });

  const now = new Date();
  const thisWeekSessions = filteredSessions.filter(s => {
    const d = new Date(s.date);
    const diff = (d - now) / (1000 * 60 * 60 * 24);
    return s.status === 'scheduled' && diff >= 0 && diff <= 7;
  });
  const thisMonthSessions = filteredSessions.filter(s => {
    const d = new Date(s.date);
    return s.status === 'scheduled' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const kpi = (val, color) => ({ padding: '1rem 1.25rem', background: color + '12', borderRadius: 10, borderLeft: `4px solid ${color}`, textAlign: 'center' });
  const kpiNum = (color) => ({ fontSize: '1.6rem', fontWeight: 'bold', color, lineHeight: 1.2 });
  const kpiLabel = () => ({ fontSize: '0.82rem', color: '#666', marginTop: 4 });

  const printNow = () => window.print();

  // ──────────────── OVERVIEW ────────────────
  const renderOverview = () => (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={kpi('#3498db')}>
          <div style={kpiNum('#3498db')}>{totalCases}</div>
          <div style={kpiLabel()}>{isArabic ? 'إجمالي القضايا' : 'Total Cases'}</div>
        </div>
        <div style={kpi('#2ecc71')}>
          <div style={kpiNum('#2ecc71')}>{activeCases}</div>
          <div style={kpiLabel()}>{isArabic ? 'قضايا نشطة' : 'Active Cases'}</div>
        </div>
        <div style={kpi('#27ae60')}>
          <div style={kpiNum('#27ae60')}>{wonCases}</div>
          <div style={kpiLabel()}>{isArabic ? 'قضايا مكتسبة' : 'Won'}</div>
        </div>
        <div style={kpi('#e74c3c')}>
          <div style={kpiNum('#e74c3c')}>{lostCases}</div>
          <div style={kpiLabel()}>{isArabic ? 'قضايا مخسرة' : 'Lost'}</div>
        </div>
        <div style={kpi('#9b59b6')}>
          <div style={kpiNum('#9b59b6')}>{data.clients.length}</div>
          <div style={kpiLabel()}>{isArabic ? 'العملاء' : 'Clients'}</div>
        </div>
        <div style={kpi('#f39c12')}>
          <div style={kpiNum('#f39c12')}>{filteredSessions.length}</div>
          <div style={kpiLabel()}>{isArabic ? 'الجلسات' : 'Sessions'}</div>
        </div>
        <div style={kpi('#2ecc71')}>
          <div style={kpiNum('#2ecc71')}>{totalPaid.toFixed(3)}</div>
          <div style={kpiLabel()}>{isArabic ? 'المدفوع (د.ك)' : 'Paid (KWD)'}</div>
        </div>
        <div style={kpi('#e74c3c')}>
          <div style={kpiNum('#e74c3c')}>{totalPending.toFixed(3)}</div>
          <div style={kpiLabel()}>{isArabic ? 'المعلق (د.ك)' : 'Pending (KWD)'}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ margin: 0 }}>
          <h3 className="card-title">{isArabic ? 'القضايا حسب النوع' : 'Cases by Type'}</h3>
          {Object.entries(filteredCases.reduce((acc, c) => { acc[c.type] = (acc[c.type] || 0) + 1; return acc; }, {}))
            .sort((a, b) => b[1] - a[1])
            .map(([type, count]) => (
              <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ minWidth: 90, fontSize: '0.85rem' }}>{type}</span>
                <div style={{ flex: 1, height: 18, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: (count / totalCases * 100) + '%', height: '100%', background: '#3498db', borderRadius: 4 }} />
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{count}</span>
              </div>
            ))}
        </div>

        <div className="card" style={{ margin: 0 }}>
          <h3 className="card-title">{isArabic ? 'الفواتير حسب الحالة' : 'Invoices by Status'}</h3>
          {[
            { label: isArabic ? 'مدفوعة' : 'Paid', count: paidInvoices, color: '#2ecc71' },
            { label: isArabic ? 'جزئية' : 'Partial', count: partialInvoices, color: '#f39c12' },
            { label: isArabic ? 'معلقة' : 'Pending', count: pendingInvoices, color: '#e67e22' },
            { label: isArabic ? 'متأخرة' : 'Overdue', count: overdueInvoices, color: '#e74c3c' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ minWidth: 60, fontSize: '0.85rem' }}>{item.label}</span>
              <div style={{ flex: 1, height: 18, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: (item.count / totalInvoices * 100 || 0) + '%', height: '100%', background: item.color, borderRadius: 4 }} />
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{item.count}</span>
            </div>
          ))}
        </div>

        <div className="card" style={{ margin: 0 }}>
          <h3 className="card-title">{isArabic ? 'ملخص الجلسات' : 'Sessions Summary'}</h3>
          {[
            { label: isArabic ? 'مجدولة' : 'Scheduled', count: upcomingSessions.length, color: '#3498db' },
            { label: isArabic ? 'هذا الأسبوع' : 'This Week', count: thisWeekSessions.length, color: '#e74c3c' },
            { label: isArabic ? 'هذا الشهر' : 'This Month', count: thisMonthSessions.length, color: '#f39c12' },
            { label: isArabic ? 'منجزة' : 'Completed', count: completedSessions.length, color: '#2ecc71' },
            { label: isArabic ? 'مؤجلة' : 'Postponed', count: postponedSessions.length, color: '#e67e22' },
            { label: isArabic ? 'ملغاة' : 'Cancelled', count: cancelledSessions.length, color: '#95a5a6' },
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

  // ──────────────── CASES ────────────────
  const renderCases = () => {
    const typeBreakdown = {};
    filteredCases.forEach(c => {
      if (!typeBreakdown[c.type]) typeBreakdown[c.type] = { count: 0, fees: 0 };
      typeBreakdown[c.type].count++;
      typeBreakdown[c.type].fees += parseFloat(c.consultationFees || 0) + parseFloat(c.litigationFees || 0) + parseFloat(c.sessionFees || 0) + parseFloat(c.otherFees || 0);
    });
    const statusBreakdown = {};
    filteredCases.forEach(c => {
      if (!statusBreakdown[c.status]) statusBreakdown[c.status] = 0;
      statusBreakdown[c.status]++;
    });
    const totalFees = filteredCases.reduce((s, c) => s + parseFloat(c.consultationFees || 0) + parseFloat(c.litigationFees || 0) + parseFloat(c.sessionFees || 0) + parseFloat(c.otherFees || 0), 0);
    const paidFees = filteredCases.filter(c => c.paymentStatus === 'paid').reduce((s, c) => s + parseFloat(c.consultationFees || 0) + parseFloat(c.litigationFees || 0) + parseFloat(c.sessionFees || 0) + parseFloat(c.otherFees || 0), 0);

    return (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={kpi('#3498db')}><div style={kpiNum('#3498db')}>{totalCases}</div><div style={kpiLabel()}>{isArabic ? 'إجمالي' : 'Total'}</div></div>
          <div style={kpi('#2ecc71')}><div style={kpiNum('#2ecc71')}>{activeCases}</div><div style={kpiLabel()}>{isArabic ? 'نشطة' : 'Active'}</div></div>
          <div style={kpi('#27ae60')}><div style={kpiNum('#27ae60')}>{wonCases}</div><div style={kpiLabel()}>{isArabic ? 'مكتسبة' : 'Won'}</div></div>
          <div style={kpi('#e74c3c')}><div style={kpiNum('#e74c3c')}>{lostCases}</div><div style={kpiLabel()}>{isArabic ? 'مخسرة' : 'Lost'}</div></div>
          <div style={kpi('#f39c12')}><div style={kpiNum('#f39c12')}>{totalFees.toFixed(3)}</div><div style={kpiLabel()}>{isArabic ? 'إجمالي الأتعاب (د.ك)' : 'Total Fees (KWD)'}</div></div>
          <div style={kpi('#2ecc71')}><div style={kpiNum('#2ecc71')}>{paidFees.toFixed(3)}</div><div style={kpiLabel()}>{isArabic ? 'محصّل (د.ك)' : 'Collected (KWD)'}</div></div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="card" style={{ margin: 0 }}>
            <h3 className="card-title">{isArabic ? 'حسب النوع' : 'By Type'}</h3>
            {Object.entries(typeBreakdown).sort((a, b) => b[1].count - a[1].count).map(([type, stats]) => (
              <div key={type} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f0f0f0', fontSize: '0.9rem' }}>
                <span>{type}</span>
                <span><strong>{stats.count}</strong> {isArabic ? 'قضية' : 'cases'} — {stats.fees.toFixed(3)} {isArabic ? 'د.ك' : 'KWD'}</span>
              </div>
            ))}
          </div>
          <div className="card" style={{ margin: 0 }}>
            <h3 className="card-title">{isArabic ? 'حسب الحالة' : 'By Status'}</h3>
            {Object.entries(statusBreakdown).sort((a, b) => b[1] - a[1]).map(([status, count]) => (
              <div key={status} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f0f0f0', fontSize: '0.9rem' }}>
                <span>{status}</span>
                <span><strong>{count}</strong> ({(count / totalCases * 100).toFixed(1)}%)</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">{isArabic ? 'جميع القضايا' : 'All Cases'}</h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>{isArabic ? 'رقم القضية' : 'Case No.'}</th>
                  <th>{isArabic ? 'العنوان' : 'Title'}</th>
                  <th>{isArabic ? 'النوع' : 'Type'}</th>
                  <th>{isArabic ? 'الحالة' : 'Status'}</th>
                  <th>{isArabic ? 'الأتعاب' : 'Fees'}</th>
                  <th>{isArabic ? 'المحامي' : 'Lawyer'}</th>
                  <th>{isArabic ? 'الموكل' : 'Client'}</th>
                </tr>
              </thead>
              <tbody>
                {filteredCases.map(c => (
                  <tr key={c.id}>
                    <td>{c.caseNumber}</td>
                    <td>{c.title}</td>
                    <td>{c.type}</td>
                    <td><span className={`badge badge-${c.status === 'won' ? 'won' : c.status === 'lost' ? 'lost' : c.status === 'active' ? 'active' : c.status === 'closed' ? 'closed' : 'pending'}`}>{c.status}</span></td>
                    <td>{(parseFloat(c.consultationFees || 0) + parseFloat(c.litigationFees || 0) + parseFloat(c.sessionFees || 0) + parseFloat(c.otherFees || 0)).toFixed(3)}</td>
                    <td>{c.assignedLawyer?.fullName || '-'}</td>
                    <td>{c.clientName || c.Client?.name || '-'}</td>
                  </tr>
                ))}
                {filteredCases.length === 0 && <tr><td colSpan="7" className="no-data">{isArabic ? 'لا توجد قضايا' : 'No cases'}</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // ──────────────── SESSIONS ────────────────
  const renderSessions = () => (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={kpi('#3498db')}><div style={kpiNum('#3498db')}>{filteredSessions.length}</div><div style={kpiLabel()}>{isArabic ? 'إجمالي' : 'Total'}</div></div>
        <div style={kpi('#2ecc71')}><div style={kpiNum('#2ecc71')}>{upcomingSessions.length}</div><div style={kpiLabel()}>{isArabic ? 'قادمة' : 'Upcoming'}</div></div>
        <div style={kpi('#e74c3c')}><div style={kpiNum('#e74c3c')}>{thisWeekSessions.length}</div><div style={kpiLabel()}>{isArabic ? 'هذا الأسبوع' : 'This Week'}</div></div>
        <div style={kpi('#f39c12')}><div style={kpiNum('#f39c12')}>{thisMonthSessions.length}</div><div style={kpiLabel()}>{isArabic ? 'هذا الشهر' : 'This Month'}</div></div>
        <div style={kpi('#2ecc71')}><div style={kpiNum('#2ecc71')}>{completedSessions.length}</div><div style={kpiLabel()}>{isArabic ? 'منجزة' : 'Completed'}</div></div>
        <div style={kpi('#e67e22')}><div style={kpiNum('#e67e22')}>{postponedSessions.length}</div><div style={kpiLabel()}>{isArabic ? 'مؤجلة' : 'Postponed'}</div></div>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3 className="card-title">{isArabic ? 'الجلسات القادمة' : 'Upcoming Sessions'}</h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>{isArabic ? 'التاريخ' : 'Date'}</th>
                <th>{isArabic ? 'الوقت' : 'Time'}</th>
                <th>{isArabic ? 'رقم القضية' : 'Case No.'}</th>
                <th>{isArabic ? 'القضية' : 'Case'}</th>
                <th>{isArabic ? 'رقم الجلسة' : 'Session #'}</th>
                <th>{isArabic ? 'النوع' : 'Type'}</th>
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
                  <td>{s.sessionType}</td>
                  <td>{s.location || '-'}</td>
                  <td><span className={`badge badge-${s.status === 'scheduled' ? 'active' : s.status === 'completed' ? 'won' : s.status === 'postponed' ? 'pending' : 'lost'}`}>{s.status}</span></td>
                </tr>
              ))}
              {upcomingSessions.length === 0 && <tr><td colSpan="8" className="no-data">{isArabic ? 'لا توجد جلسات قادمة' : 'No upcoming sessions'}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">{isArabic ? 'جميع الجلسات' : 'All Sessions'}</h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>{isArabic ? 'التاريخ' : 'Date'}</th>
                <th>{isArabic ? 'رقم القضية' : 'Case No.'}</th>
                <th>{isArabic ? 'رقم الجلسة' : 'Session #'}</th>
                <th>{isArabic ? 'النوع' : 'Type'}</th>
                <th>{isArabic ? 'الحالة' : 'Status'}</th>
                <th>{isArabic ? 'الملاحظات' : 'Notes'}</th>
              </tr>
            </thead>
            <tbody>
              {filteredSessions.sort((a, b) => new Date(b.date) - new Date(a.date)).map(s => (
                <tr key={s.id}>
                  <td>{new Date(s.date).toLocaleDateString('ar-KW')}</td>
                  <td>{s.Case?.caseNumber || '-'}</td>
                  <td>{s.sessionNumber}</td>
                  <td>{s.sessionType}</td>
                  <td><span className={`badge badge-${s.status === 'scheduled' ? 'active' : s.status === 'completed' ? 'won' : s.status === 'postponed' ? 'pending' : 'lost'}`}>{s.status}</span></td>
                  <td>{s.notes || s.result || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // ──────────────── FINANCIAL ────────────────
  const renderFinancial = () => (
    <div>
      <div className="no-print" style={{ marginBottom: '1rem' }}>
        <button className="btn btn-warning" onClick={handleCheckOverdue} disabled={checkingOverdue}>
          {checkingOverdue ? (isArabic ? 'جاري الفحص...' : 'Checking...') : (isArabic ? 'فحص الفواتير المتأخرة' : 'Check Overdue Invoices')}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={kpi('#2ecc71')}><div style={kpiNum('#2ecc71')}>{totalPaid.toFixed(3)}</div><div style={kpiLabel()}>{isArabic ? 'المدفوع (د.ك)' : 'Paid (KWD)'}</div></div>
        <div style={kpi('#f39c12')}><div style={kpiNum('#f39c12')}>{totalPending.toFixed(3)}</div><div style={kpiLabel()}>{isArabic ? 'المعلق (د.ك)' : 'Pending (KWD)'}</div></div>
        <div style={kpi('#3498db')}><div style={kpiNum('#3498db')}>{totalRevenue.toFixed(3)}</div><div style={kpiLabel()}>{isArabic ? 'الإجمالي (د.ك)' : 'Total (KWD)'}</div></div>
        <div style={kpi('#9b59b6')}><div style={kpiNum('#9b59b6')}>{totalInvoices}</div><div style={kpiLabel()}>{isArabic ? 'عدد الفواتير' : 'Invoices'}</div></div>
        <div style={kpi('#2ecc71')}><div style={kpiNum('#2ecc71')}>{paidInvoices}</div><div style={kpiLabel()}>{isArabic ? 'مدفوعة' : 'Paid'}</div></div>
        <div style={kpi('#e74c3c')}><div style={kpiNum('#e74c3c')}>{overdueInvoices}</div><div style={kpiLabel()}>{isArabic ? 'متأخرة' : 'Overdue'}</div></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {feeReport && feeReport.feesByMonth && (
          <div className="card" style={{ margin: 0 }}>
            <h3 className="card-title">{isArabic ? 'الأتعاب حسب الشهر' : 'Fees by Month'}</h3>
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
              <div className="no-data">{isArabic ? 'لا توجد بيانات' : 'No data'}</div>
            )}
          </div>
        )}

        {feeReport && feeReport.feesByLawyer && (
          <div className="card" style={{ margin: 0 }}>
            <h3 className="card-title">{isArabic ? 'الأتعاب حسب المحامي' : 'Fees by Lawyer'}</h3>
            {feeReport.feesByLawyer.map(lawyer => (
              <div key={lawyer.assignedLawyer?.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f0f0f0', fontSize: '0.9rem' }}>
                <span>{lawyer.assignedLawyer?.fullName || (isArabic ? 'غير محدد' : 'Unassigned')}</span>
                <span style={{ fontWeight: 'bold' }}>
                  {parseFloat(lawyer.grandTotal || 0).toFixed(3)} {isArabic ? 'د.ك' : 'KWD'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // ──────────────── INVOICES ────────────────
  const renderInvoices = () => (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={kpi('#3498db')}><div style={kpiNum('#3498db')}>{totalInvoices}</div><div style={kpiLabel()}>{isArabic ? 'إجمالي الفواتير' : 'Total Invoices'}</div></div>
        <div style={kpi('#2ecc71')}><div style={kpiNum('#2ecc71')}>{paidInvoices}</div><div style={kpiLabel()}>{isArabic ? 'مدفوعة' : 'Paid'}</div></div>
        <div style={kpi('#f39c12')}><div style={kpiNum('#f39c12')}>{partialInvoices}</div><div style={kpiLabel()}>{isArabic ? 'جزئية' : 'Partial'}</div></div>
        <div style={kpi('#e67e22')}><div style={kpiNum('#e67e22')}>{pendingInvoices}</div><div style={kpiLabel()}>{isArabic ? 'معلقة' : 'Pending'}</div></div>
        <div style={kpi('#e74c3c')}><div style={kpiNum('#e74c3c')}>{overdueInvoices}</div><div style={kpiLabel()}>{isArabic ? 'متأخرة' : 'Overdue'}</div></div>
        <div style={kpi('#2ecc71')}><div style={kpiNum('#2ecc71')}>{totalPaid.toFixed(3)}</div><div style={kpiLabel()}>{isArabic ? 'المدفوع (د.ك)' : 'Paid (KWD)'}</div></div>
        <div style={kpi('#e74c3c')}><div style={kpiNum('#e74c3c')}>{totalPending.toFixed(3)}</div><div style={kpiLabel()}>{isArabic ? 'المعلق (د.ك)' : 'Pending (KWD)'}</div></div>
        <div style={kpi('#3498db')}><div style={kpiNum('#3498db')}>{totalRevenue.toFixed(3)}</div><div style={kpiLabel()}>{isArabic ? 'الإجمالي (د.ك)' : 'Revenue (KWD)'}</div></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ margin: 0 }}>
          <h3 className="card-title">{isArabic ? 'الفواتير حسب الموكل' : 'Invoices by Client'}</h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>{isArabic ? 'الموكل' : 'Client'}</th>
                  <th>{isArabic ? 'العدد' : 'Count'}</th>
                  <th>{isArabic ? 'الإجمالي' : 'Total'}</th>
                  <th>{isArabic ? 'المدفوع' : 'Paid'}</th>
                  <th>{isArabic ? 'المعلق' : 'Pending'}</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(invoiceByClient).sort((a, b) => b[1].total - a[1].total).map(([id, stats]) => (
                  <tr key={id}>
                    <td style={{ fontWeight: 600 }}>{stats.name}</td>
                    <td>{stats.count}</td>
                    <td>{stats.total.toFixed(3)} {isArabic ? 'د.ك' : 'KWD'}</td>
                    <td style={{ color: '#2ecc71', fontWeight: 600 }}>{stats.paid.toFixed(3)}</td>
                    <td style={{ color: '#e74c3c', fontWeight: 600 }}>{stats.pending.toFixed(3)}</td>
                  </tr>
                ))}
                {Object.keys(invoiceByClient).length === 0 && <tr><td colSpan="5" className="no-data">{isArabic ? 'لا توجد بيانات' : 'No data'}</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card" style={{ margin: 0 }}>
          <h3 className="card-title">{isArabic ? 'الفواتير حسب القضية' : 'Invoices by Case'}</h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>{isArabic ? 'رقم القضية' : 'Case No.'}</th>
                  <th>{isArabic ? 'العدد' : 'Count'}</th>
                  <th>{isArabic ? 'الإجمالي' : 'Total'}</th>
                  <th>{isArabic ? 'المدفوع' : 'Paid'}</th>
                  <th>{isArabic ? 'المعلق' : 'Pending'}</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(invoiceByCase).sort((a, b) => b[1].total - a[1].total).map(([id, stats]) => (
                  <tr key={id}>
                    <td style={{ fontWeight: 600 }}>{stats.number}</td>
                    <td>{stats.count}</td>
                    <td>{stats.total.toFixed(3)} {isArabic ? 'د.ك' : 'KWD'}</td>
                    <td style={{ color: '#2ecc71', fontWeight: 600 }}>{stats.paid.toFixed(3)}</td>
                    <td style={{ color: '#e74c3c', fontWeight: 600 }}>{stats.pending.toFixed(3)}</td>
                  </tr>
                ))}
                {Object.keys(invoiceByCase).length === 0 && <tr><td colSpan="5" className="no-data">{isArabic ? 'لا توجد بيانات' : 'No data'}</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">{isArabic ? 'جميع الفواتير' : 'All Invoices'}</h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>{isArabic ? 'رقم الفاتورة' : 'Invoice #'}</th>
                <th>{isArabic ? 'رقم القضية' : 'Case No.'}</th>
                <th>{isArabic ? 'الموكل' : 'Client'}</th>
                <th>{isArabic ? 'النوع' : 'Type'}</th>
                <th>{isArabic ? 'المبلغ' : 'Amount'}</th>
                <th>{isArabic ? 'المدفوع' : 'Paid'}</th>
                <th>{isArabic ? 'الحالة' : 'Status'}</th>
                <th>{isArabic ? 'تاريخ الاستحقاق' : 'Due Date'}</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map(inv => (
                <tr key={inv.id}>
                  <td>{inv.invoiceNumber}</td>
                  <td>{inv.caseNumber || '-'}</td>
                  <td>{inv.clientName || '-'}</td>
                  <td>{inv.type}</td>
                  <td>{parseFloat(inv.totalAmount || 0).toFixed(3)} {isArabic ? 'د.ك' : 'KWD'}</td>
                  <td>{parseFloat(inv.paidAmount || 0).toFixed(3)} {isArabic ? 'د.ك' : 'KWD'}</td>
                  <td><span className={`badge badge-${inv.status === 'paid' ? 'won' : inv.status === 'partial' ? 'pending' : inv.status === 'overdue' ? 'lost' : 'active'}`}>{inv.status}</span></td>
                  <td>{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('ar-KW') : '-'}</td>
                </tr>
              ))}
              {filteredInvoices.length === 0 && <tr><td colSpan="8" className="no-data">{isArabic ? 'لا توجد فواتير' : 'No invoices'}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // ──────────────── CLIENTS ────────────────
  const renderClients = () => {
    const clientStats = data.clients.map(c => {
      const clientCases = data.cases.filter(cs => cs.clientId === c.id);
      const clientSessions = data.sessions.filter(s => clientCases.some(cs => cs.id === s.caseId));
      const clientInvoices = data.invoices.filter(inv => clientCases.some(cs => cs.id === inv.caseId));
      const totalPaid = clientInvoices.reduce((s, i) => s + parseFloat(i.paidAmount || 0), 0);
      const totalPending = clientInvoices.reduce((s, i) => s + (parseFloat(i.totalAmount || 0) - parseFloat(i.paidAmount || 0)), 0);
      return { ...c, casesCount: clientCases.length, sessionsCount: clientSessions.length, totalPaid, totalPending };
    }).sort((a, b) => b.casesCount - a.casesCount);

    return (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={kpi('#9b59b6')}><div style={kpiNum('#9b59b6')}>{data.clients.length}</div><div style={kpiLabel()}>{isArabic ? 'إجمالي' : 'Total'}</div></div>
          <div style={kpi('#2ecc71')}><div style={kpiNum('#2ecc71')}>{activeClients.length}</div><div style={kpiLabel()}>{isArabic ? 'نشطين' : 'Active'}</div></div>
          <div style={kpi('#3498db')}><div style={kpiNum('#3498db')}>{clientStats.filter(c => c.casesCount > 0).length}</div><div style={kpiLabel()}>{isArabic ? 'لديهم قضايا' : 'With Cases'}</div></div>
          <div style={kpi('#2ecc71')}><div style={kpiNum('#2ecc71')}>{clientStats.reduce((s, c) => s + c.totalPaid, 0).toFixed(3)}</div><div style={kpiLabel()}>{isArabic ? 'إجمالي المدفوع (د.ك)' : 'Total Paid (KWD)'}</div></div>
        </div>

        <div className="card" style={{ margin: 0 }}>
          <h3 className="card-title">{isArabic ? 'قائمة العملاء' : 'Client List'}</h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>{isArabic ? 'الاسم' : 'Name'}</th>
                  <th>{isArabic ? 'رقم المدني' : 'Civil ID'}</th>
                  <th>{isArabic ? 'الجوال' : 'Phone'}</th>
                  <th>{isArabic ? 'القضايا' : 'Cases'}</th>
                  <th>{isArabic ? 'الجلسات' : 'Sessions'}</th>
                  <th>{isArabic ? 'المدفوع' : 'Paid'}</th>
                  <th>{isArabic ? 'المعلق' : 'Pending'}</th>
                  <th>{isArabic ? 'الحالة' : 'Status'}</th>
                </tr>
              </thead>
              <tbody>
                {clientStats.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td>{c.civilId || '-'}</td>
                    <td>{c.phone || '-'}</td>
                    <td>{c.casesCount}</td>
                    <td>{c.sessionsCount}</td>
                    <td style={{ color: '#2ecc71', fontWeight: 600 }}>{c.totalPaid.toFixed(3)} {isArabic ? 'د.ك' : 'KWD'}</td>
                    <td style={{ color: '#e74c3c', fontWeight: 600 }}>{c.totalPending.toFixed(3)} {isArabic ? 'د.ك' : 'KWD'}</td>
                    <td><span className={`badge badge-${c.isActive ? 'won' : 'closed'}`}>{c.isActive ? (isArabic ? 'نشط' : 'Active') : (isArabic ? 'غير نشط' : 'Inactive')}</span></td>
                  </tr>
                ))}
                {clientStats.length === 0 && <tr><td colSpan="8" className="no-data">{isArabic ? 'لا يوجد عملاء' : 'No clients'}</td></tr>}
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
      case 'cases': return renderCases();
      case 'sessions': return renderSessions();
      case 'financial': return renderFinancial();
      case 'invoices': return renderInvoices();
      case 'clients': return renderClients();
      case 'courtAgent': return renderCourtAgent();
      default: return renderOverview();
    }
  };

  const renderCourtAgent = () => {
    // Get court agent cases (cases where courtAgentId matches current user)
    const agentCases = filteredCases.filter(c => c.courtAgentId === user?.id);
    const agentSessions = filteredSessions.filter(s => s.Case?.courtAgentId === user?.id);
    const upcomingAgentSessions = agentSessions.filter(s => s.status === 'scheduled');
    const completedAgentSessions = agentSessions.filter(s => s.status === 'completed');
    const postponedAgentSessions = agentSessions.filter(s => s.status === 'postponed');

    return (
      <div>
        <div className="card" style={{ marginBottom: '1rem', background: '#f0f7ff', border: '1px solid #bee3f8' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <FiMapPin style={{ fontSize: '1.5rem', color: '#3182ce' }} />
            <div>
              <h3 style={{ margin: 0, color: '#1a365d' }}>{isArabic ? 'تقرير مندوب المحاكم' : 'Court Agent Report'}</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>
                {isArabic ? 'المندوب:' : 'Agent:'} <strong>{user?.fullName || '-'}</strong>
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={kpi('#3498db')}>
            <div style={kpiNum('#3498db')}>{agentCases.length}</div>
            <div style={kpiLabel()}>{isArabic ? 'القضايا المنسوبة' : 'Assigned Cases'}</div>
          </div>
          <div style={kpi('#f39c12')}>
            <div style={kpiNum('#f39c12')}>{agentSessions.length}</div>
            <div style={kpiLabel()}>{isArabic ? 'إجمالي الجلسات' : 'Total Sessions'}</div>
          </div>
          <div style={kpi('#2ecc71')}>
            <div style={kpiNum('#2ecc71')}>{upcomingAgentSessions.length}</div>
            <div style={kpiLabel()}>{isArabic ? 'الجلسات القادمة' : 'Upcoming'}</div>
          </div>
          <div style={kpi('#27ae60')}>
            <div style={kpiNum('#27ae60')}>{completedAgentSessions.length}</div>
            <div style={kpiLabel()}>{isArabic ? 'المنجزة' : 'Completed'}</div>
          </div>
          <div style={kpi('#e67e22')}>
            <div style={kpiNum('#e67e22')}>{postponedAgentSessions.length}</div>
            <div style={kpiLabel()}>{isArabic ? 'المؤجلة' : 'Postponed'}</div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: '1rem' }}>
          <h3 className="card-title">{isArabic ? 'القضايا المنسوبة' : 'Assigned Cases'}</h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>{isArabic ? 'رقم القضية' : 'Case No.'}</th>
                  <th>{isArabic ? 'العنوان' : 'Title'}</th>
                  <th>{isArabic ? 'النوع' : 'Type'}</th>
                  <th>{isArabic ? 'الحالة' : 'Status'}</th>
                  <th>{isArabic ? 'الموكل' : 'Client'}</th>
                  <th>{isArabic ? 'الجلسة القادمة' : 'Next Session'}</th>
                </tr>
              </thead>
              <tbody>
                {agentCases.map(c => (
                  <tr key={c.id}>
                    <td>{c.caseNumber}</td>
                    <td>{c.title}</td>
                    <td>{c.type}</td>
                    <td><span className={`badge badge-${c.status === 'active' ? 'active' : c.status === 'won' ? 'won' : c.status === 'lost' ? 'lost' : 'pending'}`}>{c.status}</span></td>
                    <td>{c.clientName || c.Client?.name || '-'}</td>
                    <td>{c.nextHearingDate ? new Date(c.nextHearingDate).toLocaleDateString('ar-KW') : '-'}</td>
                  </tr>
                ))}
                {agentCases.length === 0 && <tr><td colSpan="6" className="no-data">{isArabic ? 'لا توجد قضايا منسوبة' : 'No assigned cases'}</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">{isArabic ? 'الجلسات القادمة' : 'Upcoming Sessions'}</h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>{isArabic ? 'التاريخ' : 'Date'}</th>
                  <th>{isArabic ? 'الوقت' : 'Time'}</th>
                  <th>{isArabic ? 'رقم القضية' : 'Case No.'}</th>
                  <th>{isArabic ? 'القضية' : 'Case'}</th>
                  <th>{isArabic ? 'رقم الجلسة' : 'Session #'}</th>
                  <th>{isArabic ? 'الموقع' : 'Location'}</th>
                  <th>{isArabic ? 'الحالة' : 'Status'}</th>
                </tr>
              </thead>
              <tbody>
                {upcomingAgentSessions.sort((a, b) => new Date(a.date) - new Date(b.date)).map(s => (
                  <tr key={s.id}>
                    <td>{new Date(s.date).toLocaleDateString('ar-KW')}</td>
                    <td>{s.time || '-'}</td>
                    <td>{s.Case?.caseNumber || '-'}</td>
                    <td>{s.Case?.title || '-'}</td>
                    <td>{s.sessionNumber}</td>
                    <td>{s.location || '-'}</td>
                    <td><span className="badge badge-active">{isArabic ? 'مجدولة' : 'Scheduled'}</span></td>
                  </tr>
                ))}
                {upcomingAgentSessions.length === 0 && <tr><td colSpan="7" className="no-data">{isArabic ? 'لا توجد جلسات قادمة' : 'No upcoming sessions'}</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const reportTitle = {
    overview: isArabic ? 'نظرة عامة' : 'Overview',
    cases: isArabic ? 'تقرير القضايا' : 'Cases Report',
    sessions: isArabic ? 'تقرير الجلسات' : 'Sessions Report',
    financial: isArabic ? 'التقرير المالي' : 'Financial Report',
    invoices: isArabic ? 'تقرير الفواتير' : 'Invoice Report',
    clients: isArabic ? 'تقرير العملاء' : 'Client Report',
    courtAgent: isArabic ? 'تقرير مندوب المحاكم' : 'Court Agent Report',
  };

  return (
    <div className="page-container print-page">
      <div className="print-header" style={{ display: 'none', marginBottom: '1rem', textAlign: 'center', borderBottom: '2px solid #1a365d', paddingBottom: '1rem' }}>
        <h2 style={{ color: '#1a365d', fontSize: '1.4rem', marginBottom: '0.25rem' }}>{isArabic ? 'مكتب المحاماة' : 'Law Office'}</h2>
        <p style={{ color: '#666', fontSize: '0.9rem' }}>{isArabic ? 'تقرير شامل' : 'Comprehensive Report'} — {reportTitle[activeTab]}</p>
        <p style={{ color: '#999', fontSize: '0.8rem' }}>{new Date().toLocaleDateString('ar-KW')} {new Date().toLocaleTimeString('ar-KW')}</p>
      </div>

      <div className="page-header no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1><FiBarChart2 /> {isArabic ? 'التقارير الشاملة' : 'Comprehensive Reports'}</h1>
        <button className="btn btn-secondary" onClick={handlePrint}>
          <FiPrinter /> {isArabic ? 'طباعة التقرير' : 'Print Report'}
        </button>
      </div>

      <div className="no-print">
        <div className="filters-bar" style={{ marginBottom: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <FiFilter style={{ color: '#666' }} />
          <input type="date" value={dateRange.from} onChange={e => setDateRange({ ...dateRange, from: e.target.value })} className="form-control" style={{ maxWidth: 180 }} />
          <span style={{ color: '#666' }}>{isArabic ? 'إلى' : 'to'}</span>
          <input type="date" value={dateRange.to} onChange={e => setDateRange({ ...dateRange, to: e.target.value })} className="form-control" style={{ maxWidth: 180 }} />
          {(dateRange.from || dateRange.to) && (
            <button className="btn btn-secondary btn-sm" onClick={() => setDateRange({ from: '', to: '' })}>
              {isArabic ? 'مسح الفلتر' : 'Clear Filter'}
            </button>
          )}
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

      <div className="print-title" style={{ display: 'none', fontSize: '1.1rem', fontWeight: 'bold', color: '#1a365d', marginBottom: '1rem' }}>
        {reportTitle[activeTab]}
      </div>

      {renderContent()}
    </div>
  );
};

export default Reports;
