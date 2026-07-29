import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';
import { FiPlus, FiSearch, FiEdit, FiCalendar } from 'react-icons/fi';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import toast from 'react-hot-toast';

const SessionsList = () => {
  const { t, language } = useLanguage();
  const isArabic = language === 'ar';
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0
  });

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 768px)');
    setIsMobile(mql.matches);
    const handler = (e) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [statusFilter, typeFilter, pagination.page]);

  const fetchSessions = async () => {
    try {
      const params = {
        page: pagination.page,
        limit: 50
      };
      if (statusFilter) params.status = statusFilter;

      const response = await api.get('/sessions', { params });
      setSessions(response.data.sessions);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error(t.errorFetchingSessions);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      scheduled: 'badge-active',
      completed: 'badge-closed',
      postponed: 'badge-pending',
      cancelled: 'badge-lost'
    };
    return <span className={`badge ${statusClasses[status]}`}>{t[status] || status}</span>;
  };

  const filteredSessions = sessions.filter(session => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      (session.Case?.title || '').toLowerCase().includes(term) ||
      (session.Case?.caseNumber || '').toLowerCase().includes(term) ||
      (session.location || '').toLowerCase().includes(term) ||
      String(session.sessionNumber).includes(term)
    );
  }).filter(session => {
    if (!typeFilter) return true;
    return session.sessionType === typeFilter;
  });

  if (loading) {
    return <div className="loading">{t.loading}</div>;
  }

  return (
    <div className="sessions-list print-page">
      <div className="card-header no-print">
        <h2 className="card-title">{t.sessions} ({pagination.total})</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={() => window.print()}>
            {isArabic ? 'طباعة' : 'Print'}
          </button>
          <Link to="/dashboard/sessions/new" className="btn btn-primary">
            <FiPlus /> {t.addSession}
          </Link>
        </div>
      </div>

      <div className="search-filter no-print">
        <div className="search-input" style={{ position: 'relative' }}>
          <input
            type="text"
            className="form-control"
            placeholder={t.search + '...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingRight: '2.5rem' }}
          />
          <FiSearch style={{ position: 'absolute', right: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
        </div>

        <select
          className="form-control"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPagination({ ...pagination, page: 1 }); }}
        >
          <option value="">{t.allStatuses}</option>
          <option value="scheduled">{t.scheduled}</option>
          <option value="completed">{t.completed}</option>
          <option value="postponed">{t.postponed}</option>
          <option value="cancelled">{t.cancelled}</option>
        </select>

        <select
          className="form-control"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="">{t.allTypes}</option>
          <option value="mainSession">{t.mainSession}</option>
          <option value="subSession">{t.subSession}</option>
          <option value="deliberation">{t.deliberation}</option>
          <option value="verdictSession">{t.verdictSession}</option>
          <option value="evidenceSession">{t.evidenceSession}</option>
        </select>
      </div>

      {isMobile ? (
        <div className="cases-mobile-cards">
          {filteredSessions.length > 0 ? filteredSessions.map((session) => (
            <div key={session.id} className="case-mobile-card" dir={language === 'ar' ? 'rtl' : 'ltr'}>
              <div className="case-card-header">
                <Link to={`/dashboard/sessions/${session.id}/edit`} className="case-card-number">#{session.sessionNumber}</Link>
                {getStatusBadge(session.status)}
              </div>
              <Link to={`/dashboard/cases/${session.Case?.id}`} className="case-card-title">{session.Case?.title || '-'}</Link>
              <div className="case-card-body">
                <div className="case-card-row">
                  <span className="case-card-label">{t.caseNumber}</span>
                  <span className="case-card-value">{session.Case?.caseNumber || '-'}</span>
                </div>
                <div className="case-card-row">
                  <span className="case-card-label">{t.sessionType}</span>
                  <span className="case-card-value">{t[session.sessionType] || session.sessionType}</span>
                </div>
                <div className="case-card-row">
                  <span className="case-card-label">{t.sessionDate}</span>
                  <span className="case-card-value">{format(new Date(session.date), 'dd/MM/yyyy', { locale: ar })}</span>
                </div>
                <div className="case-card-row">
                  <span className="case-card-label">{t.sessionTime}</span>
                  <span className="case-card-value">{session.time || '-'}</span>
                </div>
                <div className="case-card-row">
                  <span className="case-card-label">{t.sessionLocation}</span>
                  <span className="case-card-value">{session.location || '-'}</span>
                </div>
              </div>
              <div className="case-card-actions-row">
                <Link to={`/dashboard/cases/${session.Case?.id}`} className="btn btn-secondary btn-sm"><FiCalendar /> {t.viewDetails}</Link>
                <Link to={`/dashboard/sessions/${session.id}/edit`} className="btn btn-secondary btn-sm"><FiEdit /> {t.edit}</Link>
              </div>
            </div>
          )) : (
            <div className="no-data">{t.noSessionsFound}</div>
          )}
        </div>
      ) : (
      <div className="table-container">
        <table className="no-card">
          <thead>
            <tr>
              <th>{t.sessionNumber}</th>
              <th>{t.caseNumber}</th>
              <th>{t.caseTitle}</th>
              <th>{t.sessionType}</th>
              <th>{t.sessionDate}</th>
              <th>{t.sessionTime}</th>
              <th>{t.sessionLocation}</th>
              <th>{t.sessionStatus}</th>
              <th className="no-print">{t.actions}</th>
            </tr>
          </thead>
          <tbody>
            {filteredSessions.length > 0 ? (
              filteredSessions.map((session) => (
                <tr key={session.id}>
                  <td>{session.sessionNumber}</td>
                  <td>
                    <Link to={`/dashboard/cases/${session.Case?.id}`}>
                      {session.Case?.caseNumber || '-'}
                    </Link>
                  </td>
                  <td>
                    <Link to={`/dashboard/cases/${session.Case?.id}`}>
                      {session.Case?.title || '-'}
                    </Link>
                  </td>
                  <td>{t[session.sessionType] || session.sessionType}</td>
                  <td>{format(new Date(session.date), 'dd/MM/yyyy', { locale: ar })}</td>
                  <td>{session.time || '-'}</td>
                  <td>{session.location || '-'}</td>
                  <td>{getStatusBadge(session.status)}</td>
                  <td>
                    <div className="actions no-print">
                      <Link to={`/dashboard/cases/${session.Case?.id}`} className="btn btn-secondary" title={t.viewDetails}>
                        <FiCalendar />
                      </Link>
                      <Link to={`/dashboard/sessions/${session.id}/edit`} className="btn btn-secondary" title={t.edit}>
                        <FiEdit />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="no-data">{t.noSessionsFound}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      )}

      {pagination.pages > 1 && (
        <div className="pagination">
          <button 
            className="btn btn-secondary"
            disabled={pagination.page === 1}
            onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
          >
            {t.previous}
          </button>
          <span>{t.page} {pagination.page} {t.of} {pagination.pages}</span>
          <button 
            className="btn btn-secondary"
            disabled={pagination.page === pagination.pages}
            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
          >
            {t.next}
          </button>
        </div>
      )}
    </div>
  );
};

export default SessionsList;
