import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FiCalendar, FiClock } from 'react-icons/fi';
import { usePortal } from './ClientPortal';
import api from '../../services/portalApi';
import { useViewport } from '../../hooks/useViewport';
import { Badge, PortalError, PortalPageHeading, PortalEmpty } from './PortalUI';
import { formatDate, translateStatus, isUpcomingSession } from './portalUtils';

const PortalSessions = () => {
  const { t, language } = usePortal();
  const { isMobile, isTablet } = useViewport();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/portal/sessions');
      setSessions(res.data.sessions || []);
    } catch {
      setError(t.errorLoading);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  if (loading) {
    return (
      <div className="portal-loading">
        <div className="portal-spinner" aria-hidden="true" />
        <p>{t.loading}</p>
      </div>
    );
  }

  if (error) {
    return (
      <>
        <PortalPageHeading title={t.sessions} />
        <PortalError message={error} onRetry={fetchSessions} />
      </>
    );
  }

  const upcoming = sessions.filter((s) => isUpcomingSession(s)).sort((a, b) => new Date(a.date) - new Date(b.date));
  const previous = sessions.filter((s) => !isUpcomingSession(s)).sort((a, b) => new Date(b.date) - new Date(a.date));
  const cardView = isMobile || isTablet;

  const renderTable = (list) => (
    <div className="portal-table-wrap">
      <table className="portal-table">
        <thead>
          <tr>
            <th>{t.sessionNumber}</th>
            <th>{t.caseNumber}</th>
            <th>{t.date}</th>
            <th>{t.time}</th>
            <th>{t.sessionLocation}</th>
            <th>{t.status}</th>
            <th>{t.outcome}</th>
          </tr>
        </thead>
        <tbody>
          {list.map((s) => (
            <tr key={s.id}>
              <td data-label={t.sessionNumber}>{s.sessionNumber}</td>
              <td data-label={t.caseNumber}>
                <Link to={`/portal/cases/${s.caseId}`}>{s.Case?.caseNumber || '-'}</Link>
              </td>
              <td data-label={t.date}>{formatDate(s.date, language)}</td>
              <td data-label={t.time}>{s.time || '-'}</td>
              <td data-label={t.sessionLocation}>{s.location || '-'}</td>
              <td data-label={t.status}>
                <Badge value={s.status} label={translateStatus(t, s.status)} />
              </td>
              <td data-label={t.outcome}>{s.outcome || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderCards = (list) => (
    <div className="portal-list">
      {list.map((s) => (
        <Link key={s.id} to={`/portal/cases/${s.caseId}`} className="portal-item portal-session-item">
          <div className="portal-item-main">
            <span className="portal-item-title">{s.Case?.caseNumber || `#${s.sessionNumber}`} · {t.sessionNumber} {s.sessionNumber}</span>
            <span className="portal-item-sub">{s.Case?.title}</span>
            <span className="portal-item-sub">
              {t.sessionLocation}: {s.location || '-'}
            </span>
            {s.outcome && <span className="portal-item-sub">{t.outcome}: {s.outcome}</span>}
          </div>
          <div className="portal-item-side">
            <span className="portal-session-date">{formatDate(s.date, language)}</span>
            {s.time && (
              <span className="portal-item-sub"><FiClock /> {s.time}</span>
            )}
            <Badge value={s.status} label={translateStatus(t, s.status)} />
          </div>
        </Link>
      ))}
    </div>
  );

  const renderList = (list) => (cardView ? renderCards(list) : renderTable(list));

  return (
    <div className="portal-sessions">
      <PortalPageHeading title={t.sessions} />

      <div className="portal-section">
        <div className="portal-section-header">
          <h3><FiCalendar /> {t.upcomingSessions}</h3>
        </div>
        {upcoming.length === 0 ? (
          <div className="portal-card"><PortalEmpty message={t.noSessions} /></div>
        ) : (
          renderList(upcoming)
        )}
      </div>

      <div className="portal-section">
        <div className="portal-section-header">
          <h3>{t.previousSessions}</h3>
        </div>
        {previous.length === 0 ? (
          <div className="portal-card"><PortalEmpty message={t.noSessions} /></div>
        ) : (
          renderList(previous)
        )}
      </div>
    </div>
  );
};

export default PortalSessions;
