import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';
import { FiFileText, FiCalendar, FiCheckCircle, FiClock, FiAlertTriangle, FiXCircle } from 'react-icons/fi';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const Dashboard = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setFetchError(false);
    setLoading(true);
    try {
      const response = await api.get('/cases/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">{t.loading}</div>;
  }

  if (fetchError) {
    return (
      <div className="error-state">
        <p>{t.errorFetchingData || (language === 'ar' ? 'خطأ في جلب البيانات' : 'Error fetching data')}</p>
        <button className="btn btn-primary" onClick={fetchStats}>{t.retry || (language === 'ar' ? 'إعادة المحاولة' : 'Retry')}</button>
      </div>
    );
  }

  const statCards = [
    {
      icon: <FiFileText />,
      value: stats?.stats?.total || 0,
      label: t.totalCases,
      color: 'blue',
      onClick: () => navigate('/dashboard/cases')
    },
    {
      icon: <FiCheckCircle />,
      value: stats?.stats?.active || 0,
      label: t.activeCasesCount,
      color: 'green',
      onClick: () => navigate('/dashboard/cases?status=active')
    },
    {
      icon: <FiClock />,
      value: stats?.stats?.pending || 0,
      label: t.pendingCasesCount,
      color: 'yellow',
      onClick: () => navigate('/dashboard/cases?status=pending')
    },
    {
      icon: <FiAlertTriangle />,
      value: stats?.stats?.appeal || 0,
      label: t.appealCasesCount,
      color: 'orange',
      onClick: () => navigate('/dashboard/cases?status=appeal')
    },
    {
      icon: <FiCalendar />,
      value: stats?.upcomingSessions?.length || 0,
      label: t.upcomingSessions,
      color: 'purple',
      onClick: () => navigate('/dashboard/sessions')
    },
    {
      icon: <FiXCircle />,
      value: stats?.stats?.closed || 0,
      label: t.closedCasesCount,
      color: 'red',
      onClick: () => navigate('/dashboard/cases?status=closed')
    }
  ];

  return (
    <div className="dashboard">
      <div className="stats-grid">
        {statCards.map((card, index) => (
          <div 
            key={index} 
            className="stat-card clickable" 
            onClick={card.onClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && card.onClick()}
          >
            <div className={`stat-icon ${card.color}`}>
              {card.icon}
            </div>
            <div className="stat-info">
              <h3>{card.value}</h3>
              <p>{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">{t.upcomingSessions}</h3>
            <button 
              className="btn btn-secondary btn-sm" 
              onClick={() => navigate('/dashboard/sessions')}
            >
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
                    <span>{format(new Date(session.date), 'dd/MM/yyyy', { locale: ar })}</span>
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
          <div className="card-header">
            <h3 className="card-title">{t.casesByType}</h3>
            <button 
              className="btn btn-secondary btn-sm" 
              onClick={() => navigate('/dashboard/reports')}
            >
              {t.viewAll}
            </button>
          </div>
          
          {stats?.casesByType?.length > 0 ? (
            <div className="chart-placeholder">
              <div className="chart-bars">
                {stats.casesByType.map((item, index) => (
                  <div 
                    key={index} 
                    className="chart-bar-item clickable"
                    onClick={() => navigate(`/dashboard/cases?type=${item.type}`)}
                    role="button"
                    tabIndex={0}
                  >
                    <span className="bar-label">{t[item.type]}</span>
                    <div className="bar-container">
                      <div 
                        className="bar-fill" 
                        style={{ width: `${(item.count / stats.stats.total) * 100}%` }}
                      />
                    </div>
                    <span className="bar-value">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="no-data">{t.noData}</p>
          )}
        </div>
      </div>

      {stats?.casesByPriority?.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">{t.casesByPriority}</h3>
          </div>
          <div className="priority-bars">
            {stats.casesByPriority.map((item, index) => (
              <div 
                key={index} 
                className="priority-bar-item clickable"
                onClick={() => navigate(`/dashboard/cases?priority=${item.priority}`)}
                role="button"
                tabIndex={0}
              >
                <span className={`priority-badge ${item.priority}`}>{t[item.priority]}</span>
                <div className="bar-container">
                  <div 
                    className={`bar-fill priority-${item.priority}`}
                    style={{ width: `${(item.count / stats.stats.total) * 100}%` }}
                  />
                </div>
                <span className="bar-value">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
