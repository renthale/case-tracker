import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiArrowRight, FiCalendar, FiDollarSign, FiFileText } from 'react-icons/fi';
import { usePortal } from './ClientPortal';
import api from '../../services/portalApi';
import { useViewport } from '../../hooks/useViewport';
import { Badge, PortalError, PortalEmpty } from './PortalUI';
import {
  formatDate, formatCurrency, translateStatus, translateType,
  isUpcomingSession, invoiceBalance
} from './portalUtils';

const PortalCaseDetails = () => {
  const { id } = useParams();
  const { t, language } = usePortal();
  const { isMobile, isTablet } = useViewport();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCase = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/portal/cases/${id}`);
      setCaseData(res.data.case);
    } catch {
      setError(t.errorLoading);
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    fetchCase();
  }, [fetchCase]);

  const BackIcon = language === 'ar' ? FiArrowRight : FiArrowLeft;
  const cardView = isMobile || isTablet;

  if (loading) {
    return (
      <div className="portal-loading">
        <div className="portal-spinner" aria-hidden="true" />
        <p>{t.loading}</p>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div>
        <Link to="/portal/cases" className="portal-back-link">
          <BackIcon /> {t.back}
        </Link>
        {error ? <PortalError message={error} onRetry={fetchCase} /> : <PortalEmpty message={t.notFound} />}
      </div>
    );
  }

  const c = caseData;
  const sessions = c.sessions || [];
  const invoices = c.invoices || [];
  const documents = c.legalDocuments || [];
  const upcoming = sessions.filter((s) => isUpcomingSession(s));
  const previous = sessions.filter((s) => !isUpcomingSession(s));

  return (
    <div className="portal-case-details">
      <Link to="/portal/cases" className="portal-back-link">
        <BackIcon /> {t.back}
      </Link>

      <div className="portal-case-header">
        <h2>{c.title}</h2>
        <Badge value={c.status} label={translateStatus(t, c.status)} />
      </div>

      <div className="portal-info-grid">
        <div className="portal-info-item">
          <label>{t.caseNumber}</label>
          <span>{c.caseNumber || '-'}</span>
        </div>
        <div className="portal-info-item">
          <label>{t.caseType}</label>
          <span>{translateType(t, c.type)}</span>
        </div>
        <div className="portal-info-item">
          <label>{t.casePriority}</label>
          <span>{translateStatus(t, c.priority)}</span>
        </div>
        <div className="portal-info-item">
          <label>{t.court}</label>
          <span>{c.court || '-'}</span>
        </div>
        <div className="portal-info-item">
          <label>{t.judge}</label>
          <span>{c.judge || '-'}</span>
        </div>
        <div className="portal-info-item">
          <label>{t.filingDate}</label>
          <span>{formatDate(c.filingDate, language) || '-'}</span>
        </div>
        <div className="portal-info-item">
          <label>{t.nextHearing}</label>
          <span>{c.nextHearingDate ? formatDate(c.nextHearingDate, language) : '-'}</span>
        </div>
        <div className="portal-info-item">
          <label>{t.opposingParty}</label>
          <span>{c.opposingParty || '-'}</span>
        </div>
        {c.description && (
          <div className="portal-info-item" style={{ gridColumn: '1 / -1' }}>
            <label>{t.description}</label>
            <span>{c.description}</span>
          </div>
        )}
      </div>

      {sessions.length > 0 && (
        <div className="portal-section">
          <div className="portal-section-header">
            <h3><FiCalendar /> {t.sessions}</h3>
          </div>
          {cardView ? (
            <div className="portal-list">
              {[...upcoming, ...previous].map((s) => (
                <div key={s.id} className="portal-item portal-session-item">
                  <div className="portal-item-main">
                    <span className="portal-item-title">{t.sessionNumber} {s.sessionNumber}</span>
                    <span className="portal-item-sub">{s.location || '-'}</span>
                    {s.outcome && <span className="portal-item-sub">{t.outcome}: {s.outcome}</span>}
                  </div>
                  <div className="portal-item-side">
                    <span className="portal-session-date">{formatDate(s.date, language)}</span>
                    <Badge value={s.status} label={translateStatus(t, s.status)} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="portal-table-wrap">
              <table className="portal-table">
                <thead>
                  <tr>
                    <th>{t.sessionNumber}</th>
                    <th>{t.date}</th>
                    <th>{t.time}</th>
                    <th>{t.sessionLocation}</th>
                    <th>{t.status}</th>
                    <th>{t.outcome}</th>
                  </tr>
                </thead>
                <tbody>
                  {[...upcoming, ...previous].map((s) => (
                    <tr key={s.id}>
                      <td data-label={t.sessionNumber}>{s.sessionNumber}</td>
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
          )}
        </div>
      )}

      {invoices.length > 0 && (
        <div className="portal-section">
          <div className="portal-section-header">
            <h3><FiDollarSign /> {t.invoices}</h3>
          </div>
          {cardView ? (
            <div className="portal-list">
              {invoices.map((inv) => (
                <div key={inv.id} className="portal-item">
                  <div className="portal-item-main">
                    <span className="portal-item-title">{inv.invoiceNumber}</span>
                    <span className="portal-item-sub">
                      {t.dueDate}: {formatDate(inv.dueDate, language) || '-'}
                    </span>
                  </div>
                  <div className="portal-item-side">
                    <span className="portal-item-amount">
                      {formatCurrency(inv.totalAmount)} {t.currency}
                    </span>
                    <span className="portal-item-sub">{t.balance}: {formatCurrency(invoiceBalance(inv))} {t.currency}</span>
                    <Badge value={inv.status} label={translateStatus(t, inv.status)} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="portal-table-wrap">
              <table className="portal-table">
                <thead>
                  <tr>
                    <th>{t.invoiceNumber}</th>
                    <th>{t.issuedDate}</th>
                    <th>{t.dueDate}</th>
                    <th>{t.total}</th>
                    <th>{t.paid}</th>
                    <th>{t.balance}</th>
                    <th>{t.status}</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td data-label={t.invoiceNumber}><strong>{inv.invoiceNumber}</strong></td>
                      <td data-label={t.issuedDate}>{formatDate(inv.issuedDate || inv.createdAt, language)}</td>
                      <td data-label={t.dueDate}>{formatDate(inv.dueDate, language) || '-'}</td>
                      <td data-label={t.total}>{formatCurrency(inv.totalAmount)} {t.currency}</td>
                      <td data-label={t.paid}>{formatCurrency(inv.paidAmount)} {t.currency}</td>
                      <td data-label={t.balance}>{formatCurrency(invoiceBalance(inv))} {t.currency}</td>
                      <td data-label={t.status}>
                        <Badge value={inv.status} label={translateStatus(t, inv.status)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {documents.length > 0 && (
        <div className="portal-section">
          <div className="portal-section-header">
            <h3><FiFileText /> {t.documents}</h3>
            <Link to="/portal/documents" className="portal-view-all">{t.viewAll}</Link>
          </div>
          <div className="portal-list">
            {documents.map((doc) => (
              <div key={doc.id} className="portal-item">
                <div className="portal-item-main">
                  <span className="portal-item-title">{doc.title}</span>
                  <span className="portal-item-sub">
                    {translateType(t, doc.type)} · {formatDate(doc.createdAt, language)}
                  </span>
                </div>
                <div className="portal-item-side">
                  <Badge value={doc.status} label={translateStatus(t, doc.status)} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {documents.length === 0 && invoices.length === 0 && sessions.length === 0 && (
        <div className="portal-card">
          <PortalEmpty message={t.noData} />
        </div>
      )}
    </div>
  );
};

export default PortalCaseDetails;
