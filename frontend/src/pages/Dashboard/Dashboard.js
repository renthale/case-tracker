import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';
import { FiFileText, FiCalendar, FiCheckCircle, FiClock } from 'react-icons/fi';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const Dashboard = () => {
  const { t, language } = useLanguage();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/cases/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">{t.loading}</div>;
  }

  return (
    <div className="dashboard">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">
            <FiFileText />
          </div>
          <div className="stat-info">
            <h3>{stats?.stats?.total || 0}</h3>
            <p>{t.totalCases}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon green">
            <FiCheckCircle />
          </div>
          <div className="stat-info">
            <h3>{stats?.stats?.active || 0}</h3>
            <p>{t.activeCasesCount}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon yellow">
            <FiClock />
          </div>
          <div className="stat-info">
            <h3>{stats?.stats?.pending || 0}</h3>
            <p>{t.pending}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon red">
            <FiCalendar />
          </div>
          <div className="stat-info">
            <h3>{stats?.upcomingSessions?.length || 0}</h3>
            <p>{t.upcomingSessions}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">{t.upcomingSessions}</h3>
            <Link to="/sessions" className="btn btn-secondary">{t.viewAll}</Link>
          </div>
          
          {stats?.upcomingSessions?.length > 0 ? (
            <div className="sessions-list">
              {stats.upcomingSessions.map((session) => (
                <div key={session.id} className="session-item">
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
            <Link to="/reports" className="btn btn-secondary">{t.viewAll}</Link>
          </div>
          
          {stats?.casesByType?.length > 0 ? (
            <div className="chart-placeholder">
              <div className="chart-bars">
                {stats.casesByType.map((item, index) => (
                  <div key={index} className="chart-bar-item">
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
    </div>
  );
};

export default Dashboard;
