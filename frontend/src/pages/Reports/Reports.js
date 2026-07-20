import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';
import { FiDownload, FiCalendar } from 'react-icons/fi';
import { format, subMonths } from 'date-fns';
import { ar } from 'date-fns/locale';
import toast from 'react-hot-toast';

const Reports = () => {
  const { t } = useLanguage();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: format(subMonths(new Date(), 1), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/cases/stats');
      setStats(response.data);
    } catch (error) {
      toast.error(t.errorFetchingStats);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    toast.success(t.reportExported);
  };

  if (loading) {
    return <div className="loading">{t.loading}</div>;
  }

  return (
    <div className="reports-page">
      <div className="card-header">
        <h2 className="card-title">
          <FiCalendar /> {t.reports}
        </h2>
        <button className="btn btn-primary" onClick={exportReport}>
          <FiDownload /> {t.exportReport}
        </button>
      </div>

      <div className="date-filter">
        <div className="form-group">
          <label>{t.startDate}</label>
          <input
            type="date"
            className="form-control"
            value={dateRange.startDate}
            onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>{t.endDate}</label>
          <input
            type="date"
            className="form-control"
            value={dateRange.endDate}
            onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
          />
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">
            <span>📊</span>
          </div>
          <div className="stat-info">
            <h3>{stats?.stats?.total || 0}</h3>
            <p>{t.totalCases}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon green">
            <span>✅</span>
          </div>
          <div className="stat-info">
            <h3>{stats?.stats?.active || 0}</h3>
            <p>{t.activeCases}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon yellow">
            <span>⏸️</span>
          </div>
          <div className="stat-info">
            <h3>{stats?.stats?.pending || 0}</h3>
            <p>{t.pending}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon red">
            <span>🔒</span>
          </div>
          <div className="stat-info">
            <h3>{stats?.stats?.closed || 0}</h3>
            <p>{t.closedCases}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3 className="card-title">{t.casesByType}</h3>
          {stats?.casesByType?.length > 0 ? (
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
          ) : (
            <p className="no-data">{t.noData}</p>
          )}
        </div>

        <div className="card">
          <h3 className="card-title">{t.casesByPriority}</h3>
          {stats?.casesByPriority?.length > 0 ? (
            <div className="chart-bars">
              {stats.casesByPriority.map((item, index) => (
                <div key={index} className="chart-bar-item">
                  <span className="bar-label">{t[item.priority]}</span>
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
          ) : (
            <p className="no-data">{t.noData}</p>
          )}
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">{t.casesByStatus}</h3>
        <div className="stats-grid">
          <div className="status-stat">
            <span className="badge badge-active">{t.active}</span>
            <span className="status-count">{stats?.stats?.active || 0}</span>
          </div>
          <div className="status-stat">
            <span className="badge badge-pending">{t.pending}</span>
            <span className="status-count">{stats?.stats?.pending || 0}</span>
          </div>
          <div className="status-stat">
            <span className="badge badge-closed">{t.closed}</span>
            <span className="status-count">{stats?.stats?.closed || 0}</span>
          </div>
          <div className="status-stat">
            <span className="badge badge-won">{t.won}</span>
            <span className="status-count">{stats?.stats?.won || 0}</span>
          </div>
          <div className="status-stat">
            <span className="badge badge-lost">{t.lost}</span>
            <span className="status-count">{stats?.stats?.lost || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
