import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  FiFileText, FiCheckCircle, FiClock, FiCalendar,
  FiXCircle, FiAlertTriangle, FiRefreshCw, FiFolder,
  FiLayers, FiBarChart2, FiPieChart
} from 'react-icons/fi';
import { format } from 'date-fns';
import { ar as arLocale } from 'date-fns/locale';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList
} from 'recharts';

const COLORS = {
  navy: '#2f54a0',
  green: '#2e9e5b',
  amber: '#e8a23d',
  red: '#e05252',
  purple: '#805ad5',
  teal: '#12a5a5',
  slate: '#64748b',
  blue: '#2f80ed'
};

const STATUS_COLORS = {
  active: '#2f80ed',
  pending: '#f2994a',
  closed: '#9aa5b1',
  won: '#27ae60',
  lost: '#eb5757',
  settled: '#805ad5',
  appeal: '#bb6bd9',
  retrial: '#56ccf2',
  dismissed: '#6c757d'
};

const SESSION_COLORS = {
  scheduled: '#2f80ed',
  completed: '#27ae60',
  postponed: '#f2994a',
  cancelled: '#eb5757'
};

const INVOICE_COLORS = {
  paid: '#27ae60',
  overdue: '#eb5757',
  pending: '#f2994a',
  sent: '#2f80ed',
  partially_paid: '#bb6bd9',
  draft: '#9aa5b1',
  cancelled: '#6c757d'
};

const TYPE_COLORS = ['#2f80ed', '#805ad5', '#12a5a5', '#f2994a', '#27ae60', '#eb5757', '#bb6bd9', '#56ccf2', '#6c757d'];

const EmptyState = ({ message }) => (
  <div className="dash-empty">{message}</div>
);

const DonutChart = ({ data, total, totalLabel, emptyMessage }) => {
  if (!data || data.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }
  return (
    <div className="dash-donut-wrap">
      <div dir="ltr" className="dash-donut">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={58}
              outerRadius={82}
              paddingAngle={3}
              stroke="#fff"
              strokeWidth={2}
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value, name) => [value, name]} />
          </PieChart>
        </ResponsiveContainer>
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

const Dashboard = () => {
  const { t, language } = useLanguage();
  const isArabic = language === 'ar';
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const canFinancial = ['admin', 'partner', 'legal_secretary'].includes(user?.role);

  useEffect(() => {
    fetchStats();
  }, []);

  const log = (...args) => {
    if (process.env.NODE_ENV === 'development') {
      console.info('[Dashboard]', ...args);
    }
  };

  const fetchStats = async (silent = false) => {
    if (!silent) setFetchError(false);
    if (!silent) setLoading(true);
    try {
      log('GET /cases/stats ->', api.defaults.baseURL + '/cases/stats');
      const response = await api.get('/cases/stats');
      log('OK, payload keys:', Object.keys(response.data || {}));
      setStats(response.data);
      setLastUpdated(new Date());
    } catch (error) {
      const status = error?.response?.status;
      const data = error?.response?.data;
      console.error('[Dashboard] GET /cases/stats failed', {
        status,
        body: data,
        message: error.message
      });
      setFetchError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRetry = async () => {
    setRefreshing(true);
    await fetchStats(true);
  };

  const L = (key, fallbackAr, fallbackEn) => t[key] || (isArabic ? fallbackAr : fallbackEn);

  const kpiCards = [
    {
      icon: <FiFolder />,
      value: stats?.stats?.total || 0,
      label: L('totalCases', 'إجمالي القضايا', 'Total Cases'),
      color: COLORS.navy,
      onClick: () => navigate('/dashboard/cases')
    },
    {
      icon: <FiCheckCircle />,
      value: stats?.stats?.active || 0,
      label: L('activeCasesCount', 'القضايا الجارية', 'Active Cases'),
      color: COLORS.green,
      onClick: () => navigate('/dashboard/cases?status=active')
    },
    {
      icon: <FiClock />,
      value: stats?.stats?.pending || 0,
      label: L('pendingCasesCount', 'القضايا المعلقة', 'Pending Cases'),
      color: COLORS.amber,
      onClick: () => navigate('/dashboard/cases?status=pending')
    },
    {
      icon: <FiCalendar />,
      value: stats?.upcomingSessions?.length || 0,
      label: L('upcomingSessions', 'الجلسات القادمة', 'Upcoming Sessions'),
      color: COLORS.teal,
      onClick: () => navigate('/dashboard/sessions')
    },
    {
      icon: <FiLayers />,
      value: stats?.stats?.appeal || 0,
      label: L('appealCasesCount', 'قضايا الاستئناف', 'Appeal Cases'),
      color: COLORS.purple,
      onClick: () => navigate('/dashboard/cases?status=appeal')
    },
    {
      icon: <FiXCircle />,
      value: stats?.stats?.closed || 0,
      label: L('closedCasesCount', 'القضايا المغلقة', 'Closed Cases'),
      color: COLORS.slate,
      onClick: () => navigate('/dashboard/cases?status=closed')
    }
  ];

  const statusData = (stats?.casesByStatus || [])
    .map((item) => ({
      name: L(item.status, item.status, item.status) || item.status,
      value: parseInt(item.count, 10) || 0,
      color: STATUS_COLORS[item.status] || COLORS.slate
    }))
    .filter((d) => d.value > 0);

  const typeData = (stats?.casesByType || [])
    .map((item, i) => ({
      name: L(item.type, item.type, item.type),
      value: parseInt(item.count, 10) || 0,
      color: TYPE_COLORS[i % TYPE_COLORS.length]
    }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);

  const sessionData = (() => {
    const s = stats?.sessionsSummary || {};
    return ['scheduled', 'completed', 'postponed', 'cancelled']
      .map((key) => ({
        name: L(key, key, key),
        value: parseInt(s[key], 10) || 0,
        color: SESSION_COLORS[key] || COLORS.slate
      }))
      .filter((d) => d.value > 0);
  })();

  const invoiceData = (stats?.invoiceStats?.counts || [])
    .map((item) => ({
      name: L(item.status, item.status, item.status),
      value: parseInt(item.count, 10) || 0,
      color: INVOICE_COLORS[item.status] || COLORS.slate
    }))
    .filter((d) => d.value > 0);

  const monthlyData = (stats?.monthlyStats || []).map((m) => ({
    month: m.month,
    invoiced: m.invoiced,
    paid: m.paid
  }));

  const noDataMessage = L('noDataForCharts', 'لا توجد بيانات لعرضها', 'No data available');

  if (loading) {
    return <div className="loading">{t.loading}</div>;
  }

  if (fetchError) {
    return (
      <div className="error-state">
        <p>{t.errorFetchingData || (isArabic ? 'خطأ في جلب البيانات' : 'Error fetching data')}</p>
        <button className="btn btn-primary" onClick={handleRetry}>
          <FiRefreshCw /> {t.retry || (isArabic ? 'إعادة المحاولة' : 'Retry')}
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dash-header">
        <div>
          <h2 className="dash-title">{t.dashboard}</h2>
          {lastUpdated && (
            <span className="dash-updated">
              {isArabic ? 'آخر تحديث:' : 'Last updated:'}{' '}
              {format(lastUpdated, 'HH:mm:ss')}
            </span>
          )}
        </div>
        <button className="btn btn-secondary btn-sm" onClick={handleRetry} disabled={refreshing}>
          <FiRefreshCw className={refreshing ? 'spin' : ''} /> {isArabic ? 'تحديث' : 'Refresh'}
        </button>
      </div>

      <div className="dash-kpi-grid">
        {kpiCards.map((card, index) => (
          <div
            key={index}
            className="dash-kpi"
            role="button"
            tabIndex={0}
            onClick={card.onClick}
            onKeyDown={(e) => e.key === 'Enter' && card.onClick()}
            style={{ '--accent': card.color }}
          >
            <div className="dash-kpi-accent" style={{ background: card.color }} />
            <div className="dash-kpi-body">
              <div className="dash-kpi-icon" style={{ color: card.color, background: `${card.color}1a` }}>
                {card.icon}
              </div>
              <div className="dash-kpi-text">
                <div className="dash-kpi-value">{card.value}</div>
                <div className="dash-kpi-label">{card.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="dash-charts-grid">
        <div className="card dash-chart-card">
          <div className="dash-chart-header">
            <FiPieChart className="dash-chart-icon" />
            <h3 className="card-title">{isArabic ? 'القضايا حسب الحالة' : 'Cases by Status'}</h3>
          </div>
          <DonutChart
            data={statusData}
            total={stats?.stats?.total || 0}
            totalLabel={isArabic ? 'قضية' : 'cases'}
            emptyMessage={noDataMessage}
          />
        </div>

        <div className="card dash-chart-card">
          <div className="dash-chart-header">
            <FiBarChart2 className="dash-chart-icon" />
            <h3 className="card-title">{isArabic ? 'القضايا حسب النوع' : 'Cases by Type'}</h3>
          </div>
          {typeData.length > 0 ? (
            <div dir="ltr" style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeData} layout="vertical" margin={{ top: 0, right: 28, bottom: 0, left: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={isArabic ? 118 : 92}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip formatter={(value, name) => [value, isArabic ? 'قضية' : 'cases']} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={16}>
                    {typeData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                    <LabelList dataKey="value" position="right" style={{ fontSize: 11, fill: '#4a5568' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState message={noDataMessage} />
          )}
        </div>

        <div className="card dash-chart-card">
          <div className="dash-chart-header">
            <FiCalendar className="dash-chart-icon" />
            <h3 className="card-title">{isArabic ? 'ملخص الجلسات' : 'Sessions Summary'}</h3>
          </div>
          <DonutChart
            data={sessionData}
            total={stats?.sessionsSummary?.total || 0}
            totalLabel={isArabic ? 'جلسة' : 'sessions'}
            emptyMessage={noDataMessage}
          />
        </div>

        {canFinancial && (
          <div className="card dash-chart-card">
            <div className="dash-chart-header">
              <FiFileText className="dash-chart-icon" />
              <h3 className="card-title">{isArabic ? 'حالة الفواتير' : 'Invoice Status'}</h3>
            </div>
            {invoiceData.length > 0 ? (
              <div dir="ltr" style={{ width: '100%', height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={invoiceData} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
                    <Tooltip formatter={(value, name) => [value, isArabic ? 'فاتورة' : 'invoices']} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={30}>
                      {invoiceData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                      <LabelList dataKey="value" position="top" style={{ fontSize: 11, fill: '#4a5568' }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState message={noDataMessage} />
            )}
          </div>
        )}
      </div>

      {canFinancial && monthlyData.length > 0 && (
        <div className="card dash-chart-card">
          <div className="dash-chart-header">
            <FiBarChart2 className="dash-chart-icon" />
            <h3 className="card-title">{isArabic ? 'الفوترة الشهرية مقابل المدفوع' : 'Monthly Invoiced vs Paid'}</h3>
          </div>
          <div dir="ltr" style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} tickFormatter={(m) => m.slice(5)} />
                <YAxis tick={{ fontSize: 10 }} width={44} />
                <Tooltip
                  labelFormatter={(m) => m}
                  formatter={(value, name) => [`${value} د.ك`, isArabic ? (name === 'invoiced' ? 'مفوتر' : 'مدفوع') : (name === 'invoiced' ? 'Invoiced' : 'Paid')]}
                />
                <Legend formatter={(value) => (value === 'invoiced' ? (isArabic ? 'مفوتر' : 'Invoiced') : (isArabic ? 'مدفوع' : 'Paid'))} />
                <Bar dataKey="invoiced" fill={COLORS.navy} radius={[4, 4, 0, 0]} />
                <Bar dataKey="paid" fill={COLORS.green} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="grid grid-2">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">{t.upcomingSessions}</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/dashboard/sessions')}>
              {t.viewAll}
            </button>
          </div>
          {stats?.upcomingSessions?.length > 0 ? (
            <div className="sessions-list">
              {stats.upcomingSessions.map((session) => (
                <div
                  key={session.id}
                  className="session-item clickable"
                  onClick={() => navigate(`/dashboard/cases/${session.Case?.id}`)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="session-info">
                    <h4>{session.Case?.title}</h4>
                    <p>{session.Case?.caseNumber}</p>
                  </div>
                  <div className="session-date">
                    <span>{format(new Date(session.date), 'dd/MM/yyyy', { locale: arLocale })}</span>
                    <span>{session.time}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data">{t.noUpcomingSessions}</p>
          )}
        </div>

        <div className="card">
          <h3 className="card-title">{isArabic ? 'القضايا حسب الأولوية' : 'Cases by Priority'}</h3>
          {stats?.casesByPriority?.length > 0 ? (
            <div className="dash-priority-list">
              {stats.casesByPriority.map((item, index) => {
                const count = parseInt(item.count, 10) || 0;
                const max = Math.max(...(stats.casesByPriority || []).map((p) => parseInt(p.count, 10) || 0), 1);
                const pColor = item.priority === 'urgent' ? COLORS.red : item.priority === 'high' ? COLORS.amber : item.priority === 'low' ? COLORS.slate : COLORS.navy;
                return (
                  <div
                    key={index}
                    className="priority-bar-item clickable"
                    onClick={() => navigate(`/dashboard/cases?priority=${item.priority}`)}
                    role="button"
                    tabIndex={0}
                  >
                    <span className={`priority-badge ${item.priority}`}>{L(item.priority, item.priority, item.priority)}</span>
                    <div className="bar-container">
                      <div
                        className="bar-fill"
                        style={{ width: `${(count / max) * 100}%`, background: pColor }}
                      />
                    </div>
                    <span className="bar-value">{count}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="no-data">{noDataMessage}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
