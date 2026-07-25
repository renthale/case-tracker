import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/portalApi';

const PortalCases = () => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      const res = await api.get('/portal/cases');
      setCases(res.data.cases || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="portal-loading">Loading...</div>;

  return (
    <div className="portal-cases">
      <h2>My Cases</h2>
      <div className="portal-cases-grid">
        {cases.map(c => (
          <Link key={c.id} to={`/portal/cases/${c.id}`} className="portal-case-card">
            <div className="portal-case-header">
              <span className="portal-case-number">{c.caseNumber}</span>
              <span className={`portal-badge portal-badge-${c.status}`}>{c.status}</span>
            </div>
            <h3>{c.title}</h3>
            <div className="portal-case-details">
              <div><strong>Type:</strong> {c.type}</div>
              <div><strong>Court:</strong> {c.court || 'N/A'}</div>
              <div><strong>Filed:</strong> {c.filingDate ? new Date(c.filingDate).toLocaleDateString() : 'N/A'}</div>
              {c.nextHearingDate && (
                <div className="portal-next-hearing">
                  <strong>Next Hearing:</strong> {new Date(c.nextHearingDate).toLocaleDateString()}
                </div>
              )}
            </div>
          </Link>
        ))}
        {cases.length === 0 && (
          <div className="portal-no-data">No cases found</div>
        )}
      </div>
    </div>
  );
};

export default PortalCases;
