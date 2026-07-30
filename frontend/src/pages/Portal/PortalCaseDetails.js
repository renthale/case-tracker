import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/portalApi';

const PortalCaseDetails = () => {
  const { id } = useParams();
  const [isMobile, setIsMobile] = useState(false);
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 768px)');
    setIsMobile(mql.matches);
    const handler = (e) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  useEffect(() => { fetchCase(); }, [id]);

  const fetchCase = async () => {
    try {
      const res = await api.get(`/portal/cases/${id}`);
      setCaseData(res.data.case);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="portal-loading">Loading...</div>;
  if (!caseData) return <div className="portal-no-data">Case not found</div>;

  return (
    <div className="portal-case-details">
      <Link to="/portal/cases" className="portal-back-link">← Back to Cases</Link>

      <div className="portal-case-header">
        <h2>{caseData.title}</h2>
        <span className={`portal-badge portal-badge-${caseData.status}`}>{caseData.status}</span>
      </div>

      <div className="portal-info-grid portal-info-grid-mobile">
        <div className="portal-info-item">
          <label>Case Number</label>
          <span>{caseData.caseNumber}</span>
        </div>
        <div className="portal-info-item">
          <label>Type</label>
          <span>{caseData.type}</span>
        </div>
        <div className="portal-info-item">
          <label>Court</label>
          <span>{caseData.court || 'N/A'}</span>
        </div>
        <div className="portal-info-item">
          <label>Judge</label>
          <span>{caseData.judge || 'N/A'}</span>
        </div>
        <div className="portal-info-item">
          <label>Filing Date</label>
          <span>{caseData.filingDate ? new Date(caseData.filingDate).toLocaleDateString() : 'N/A'}</span>
        </div>
        <div className="portal-info-item">
          <label>Next Hearing</label>
          <span>{caseData.nextHearingDate ? new Date(caseData.nextHearingDate).toLocaleDateString() : 'N/A'}</span>
        </div>
      </div>

      {caseData.sessions && caseData.sessions.length > 0 && (
        <div className="portal-section">
          <h3>Sessions ({caseData.sessions.length})</h3>
          <div className="portal-sessions-list">
            {caseData.sessions.map(s => (
              <div key={s.id} className="portal-session-item">
                <div>
                  <strong>Session #{s.sessionNumber}</strong>
                  <p>{new Date(s.date).toLocaleDateString()} {s.time || ''}</p>
                  <p>{s.location || 'N/A'}</p>
                </div>
                <span className={`portal-badge portal-badge-${s.status}`}>{s.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {caseData.invoices && caseData.invoices.length > 0 && (
        <div className="portal-section">
          <h3>Invoices ({caseData.invoices.length})</h3>
          <div className="portal-invoices-list">
            {caseData.invoices.map(inv => (
              <div key={inv.id} className="portal-invoice-item">
                <div>
                  <strong>{inv.invoiceNumber}</strong>
                  <p>Due: {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div>{parseFloat(inv.totalAmount).toFixed(3)} KWD</div>
                  <div>Paid: {parseFloat(inv.paidAmount).toFixed(3)} KWD</div>
                  <span className={`portal-badge portal-badge-${inv.status}`}>{inv.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PortalCaseDetails;
