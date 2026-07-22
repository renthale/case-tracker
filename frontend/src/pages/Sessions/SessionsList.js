import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';
import { FiPlus, FiEdit, FiCalendar } from 'react-icons/fi';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import toast from 'react-hot-toast';

const SessionsList = () => {
  const { t } = useLanguage();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0
  });

  useEffect(() => {
    fetchSessions();
  }, [filter, pagination.page]);

  const fetchSessions = async () => {
    try {
      const params = {
        page: pagination.page,
        limit: 10
      };
      
      if (filter === 'upcoming') {
        params.upcoming = 'true';
      } else if (filter !== 'all') {
        params.status = filter;
      }

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
    return <span className={`badge ${statusClasses[status]}`}>{t[status]}</span>;
  };

  if (loading) {
    return <div className="loading">{t.loading}</div>;
  }

  return (
    <div className="sessions-list">
      <div className="card-header">
        <h2 className="card-title">{t.sessions}</h2>
        <Link to="/sessions/new" className="btn btn-primary">
          <FiPlus /> {t.addSession}
        </Link>
      </div>

      <div className="filter-tabs">
        <button 
          className={`filter-tab ${filter === 'upcoming' ? 'active' : ''}`}
          onClick={() => setFilter('upcoming')}
        >
          <FiCalendar /> {t.upcomingSessions}
        </button>
        <button 
          className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          {t.allSessions}
        </button>
        <button 
          className={`filter-tab ${filter === 'completed' ? 'active' : ''}`}
          onClick={() => setFilter('completed')}
        >
          {t.completed}
        </button>
        <button 
          className={`filter-tab ${filter === 'postponed' ? 'active' : ''}`}
          onClick={() => setFilter('postponed')}
        >
          {t.postponed}
        </button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>{t.sessionNumber}</th>
              <th>{t.caseTitle}</th>
              <th>{t.sessionDate}</th>
              <th>{t.sessionTime}</th>
              <th>{t.sessionLocation}</th>
              <th>{t.sessionStatus}</th>
              <th>{t.actions}</th>
            </tr>
          </thead>
          <tbody>
            {sessions.length > 0 ? (
              sessions.map((session) => (
                <tr key={session.id}>
                  <td>{session.sessionNumber}</td>
                  <td>
                    <Link to={`/cases/${session.Case?.id}`}>
                      {session.Case?.title}
                    </Link>
                  </td>
                  <td>{format(new Date(session.date), 'dd/MM/yyyy', { locale: ar })}</td>
                  <td>{session.time || '-'}</td>
                  <td>{session.location || '-'}</td>
                  <td>{getStatusBadge(session.status)}</td>
                  <td>
                    <Link to={`/sessions/${session.id}/edit`} className="btn btn-secondary">
                      <FiEdit />
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="no-data">{t.noSessionsFound}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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
