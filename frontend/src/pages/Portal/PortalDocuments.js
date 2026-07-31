import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FiFileText, FiDownload, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { usePortal } from './ClientPortal';
import api from '../../services/portalApi';
import { useViewport } from '../../hooks/useViewport';
import { Badge, PortalError, PortalPageHeading, PortalEmpty } from './PortalUI';
import { formatDate, translateStatus, translateType } from './portalUtils';

const PortalDocuments = () => {
  const { t, language } = usePortal();
  const { isMobile, isTablet } = useViewport();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(null);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/portal/documents');
      setDocuments(res.data.documents || []);
    } catch {
      setError(t.errorLoading);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

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
        <PortalPageHeading title={t.documents} />
        <PortalError message={error} onRetry={fetchDocuments} />
      </>
    );
  }

  const cardView = isMobile || isTablet;
  const toggle = (id) => setExpanded((cur) => (cur === id ? null : id));

  return (
    <div className="portal-documents">
      <PortalPageHeading title={t.availableDocuments} />

      {documents.length === 0 ? (
        <div className="portal-card">
          <PortalEmpty message={t.noDocuments} />
        </div>
      ) : cardView ? (
        <div className="portal-list">
          {documents.map((doc) => (
            <div key={doc.id} className="portal-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.6rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div className="portal-item-main">
                  <span className="portal-item-title">{doc.title}</span>
                  <span className="portal-item-sub">
                    {t.caseNumber}: {doc.case?.caseNumber || '-'} · {translateType(t, doc.type)}
                  </span>
                  <span className="portal-item-sub">{formatDate(doc.createdAt, language)}</span>
                </div>
                <div className="portal-item-side" style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Badge value={doc.status} label={translateStatus(t, doc.status)} />
                  {doc.content && (
                    <button
                      className="portal-icon-btn"
                      style={{ color: '#1a365d', background: '#edf2f7' }}
                      onClick={() => toggle(doc.id)}
                      aria-expanded={expanded === doc.id}
                    >
                      {expanded === doc.id ? <FiChevronUp /> : <FiChevronDown />}
                    </button>
                  )}
                </div>
              </div>
              {doc.content && expanded === doc.id && (
                <div className="portal-doc-content">{doc.content}</div>
              )}
              {doc.fileUrl && (
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="portal-link-btn"
                  style={{ alignSelf: 'flex-start' }}
                >
                  <FiDownload /> {t.download}
                </a>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="portal-table-wrap">
          <table className="portal-table">
            <thead>
              <tr>
                <th>{t.documentTitle}</th>
                <th>{t.caseNumber}</th>
                <th>{t.documentType}</th>
                <th>{t.date}</th>
                <th>{t.documentStatus}</th>
                <th>{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <React.Fragment key={doc.id}>
                  <tr>
                    <td data-label={t.documentTitle}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FiFileText /> {doc.title}
                      </span>
                    </td>
                    <td data-label={t.caseNumber}>
                      <Link to={`/portal/cases/${doc.caseId}`}>{doc.case?.caseNumber || '-'}</Link>
                    </td>
                    <td data-label={t.documentType}>{translateType(t, doc.type)}</td>
                    <td data-label={t.date}>{formatDate(doc.createdAt, language)}</td>
                    <td data-label={t.documentStatus}>
                      <Badge value={doc.status} label={translateStatus(t, doc.status)} />
                    </td>
                    <td data-label={t.actions}>
                      <div className="portal-table-actions">
                        {doc.content && (
                          <button className="btn btn-secondary btn-sm" onClick={() => toggle(doc.id)}>
                            {expanded === doc.id ? <FiChevronUp /> : <FiChevronDown />} {t.viewDocument}
                          </button>
                        )}
                        {doc.fileUrl && (
                          <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                            <FiDownload /> {t.download}
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                  {doc.content && expanded === doc.id && (
                    <tr>
                      <td colSpan="6" style={{ background: '#f7fafc', padding: '1rem' }}>
                        <div className="portal-doc-content">{doc.content}</div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PortalDocuments;
