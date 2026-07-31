import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FiEye, FiCalendar } from 'react-icons/fi';
import { usePortal } from './ClientPortal';
import api from '../../services/portalApi';
import { useViewport } from '../../hooks/useViewport';
import { Badge, PortalError, PortalPageHeading, PortalEmpty } from './PortalUI';
import { formatDate, translateStatus, translateType } from './portalUtils';

const PortalCases = () => {
  const { t, language } = usePortal();
  const { isMobile, isTablet } = useViewport();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCases = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/portal/cases');
      setCases(res.data.cases || []);
    } catch {
      setError(t.errorLoading);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

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
        <PortalPageHeading title={t.myCases} />
        <PortalError message={error} onRetry={fetchCases} />
      </>
    );
  }

  const cardView = isMobile || isTablet;

  return (
    <div className="portal-cases">
      <PortalPageHeading title={t.myCases} />

      {cases.length === 0 ? (
        <div className="portal-card">
          <PortalEmpty message={t.noCases} />
        </div>
      ) : cardView ? (
        <div className="portal-cases-grid">
          {cases.map((c) => (
            <Link key={c.id} to={`/portal/cases/${c.id}`} className="portal-case-card">
              <div className="portal-case-header">
                <span className="portal-case-number">{c.caseNumber || '-'}</span>
                <Badge value={c.status} label={translateStatus(t, c.status)} />
              </div>
              <h3>{c.title}</h3>
              <div className="portal-case-details">
                <div><strong>{t.caseType}:</strong> {translateType(t, c.type)}</div>
                <div><strong>{t.casePriority}:</strong> {translateStatus(t, c.priority)}</div>
                <div><strong>{t.court}:</strong> {c.court || '-'}</div>
                <div><strong>{t.filingDate}:</strong> {formatDate(c.filingDate, language) || '-'}</div>
                {c.nextHearingDate && (
                  <div className="portal-next-hearing">
                    <FiCalendar /> {t.nextHearing}: {formatDate(c.nextHearingDate, language)}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="portal-table-wrap">
          <table className="portal-table">
            <thead>
              <tr>
                <th>{t.caseNumber}</th>
                <th>{t.caseTitle}</th>
                <th>{t.caseType}</th>
                <th>{t.caseStatus}</th>
                <th>{t.casePriority}</th>
                <th>{t.court}</th>
                <th>{t.nextHearing}</th>
                <th>{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((c) => (
                <tr key={c.id}>
                  <td data-label={t.caseNumber}>{c.caseNumber || '-'}</td>
                  <td data-label={t.caseTitle}>{c.title}</td>
                  <td data-label={t.caseType}>{translateType(t, c.type)}</td>
                  <td data-label={t.caseStatus}>
                    <Badge value={c.status} label={translateStatus(t, c.status)} />
                  </td>
                  <td data-label={t.casePriority}>
                    <Badge value={c.priority} label={translateStatus(t, c.priority)} />
                  </td>
                  <td data-label={t.court}>{c.court || '-'}</td>
                  <td data-label={t.nextHearing}>
                    {c.nextHearingDate ? formatDate(c.nextHearingDate, language) : '-'}
                  </td>
                  <td data-label={t.actions}>
                    <div className="portal-table-actions">
                      <Link to={`/portal/cases/${c.id}`} className="btn btn-secondary btn-sm" title={t.viewDetails}>
                        <FiEye />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PortalCases;
