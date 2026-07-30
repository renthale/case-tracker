import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usePortal } from './ClientPortal';
import api from '../../services/portalApi';

const PortalDashboard = () => {
  const { client } = usePortal();
  const [isMobile, setIsMobile] = useState(false);
  const [cases, setCases] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 768px)');
    setIsMobile(mql.matches);
    const handler = (e) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [casesRes, invoicesRes] = await Promise.all([
        api.get('/portal/cases'),
        api.get('/portal/invoices')
      ]);
      setCases(casesRes.data.cases || []);
      setInvoices(invoicesRes.data.invoices || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="portal-loading">Loading...</div>;

  const activeCases = cases.filter(c => c.status === 'active');
  const totalPaid = invoices.reduce((sum, inv) => sum + parseFloat(inv.paidAmount || 0), 0);
  const totalPending = invoices.reduce((sum, inv) => sum + (parseFloat(inv.totalAmount || 0) - parseFloat(inv.paidAmount || 0)), 0);

  return (
    <div className="portal-dashboard">
      <h2>Welcome, {client?.name}</h2>

      <div className="portal-kpi-grid">
        <div className="portal-kpi" style={{ borderLeft: '4px solid #3498db' }}>
          <div className="portal-kpi-num">{cases.length}</div>
          <div className="portal-kpi-label">Total Cases</div>
        </div>
        <div className="portal-kpi" style={{ borderLeft: '4px solid #2ecc71' }}>
          <div className="portal-kpi-num">{activeCases.length}</div>
          <div className="portal-kpi-label">Active Cases</div>
        </div>
        <div className="portal-kpi" style={{ borderLeft: '4px solid #2ecc71' }}>
          <div className="portal-kpi-num">{totalPaid.toFixed(3)} KWD</div>
          <div className="portal-kpi-label">Total Paid</div>
        </div>
        <div className="portal-kpi" style={{ borderLeft: '4px solid #e74c3c' }}>
          <div className="portal-kpi-num">{totalPending.toFixed(3)} KWD</div>
          <div className="portal-kpi-label">Pending Balance</div>
        </div>
      </div>

      <div className="portal-grid portal-grid-mobile">
        <div className="portal-card">
          <h3>Recent Cases</h3>
          {cases.slice(0, 5).map(c => (
            <Link key={c.id} to={`/portal/cases/${c.id}`} className="portal-case-item">
              <div>
                <strong>{c.caseNumber}</strong>
                <p>{c.title}</p>
              </div>
              <span className={`portal-badge portal-badge-${c.status}`}>{c.status}</span>
            </Link>
          ))}
          {cases.length === 0 && <p className="portal-no-data">No cases found</p>}
          {cases.length > 5 && (
            <Link to="/portal/cases" className="portal-view-all">View All Cases →</Link>
          )}
        </div>

        <div className="portal-card">
          <h3>Recent Invoices</h3>
          {invoices.slice(0, 5).map(inv => (
            <div key={inv.id} className="portal-invoice-item">
              <div>
                <strong>{inv.invoiceNumber}</strong>
                <p>{new Date(inv.createdAt).toLocaleDateString()}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div>{parseFloat(inv.totalAmount).toFixed(3)} KWD</div>
                <span className={`portal-badge portal-badge-${inv.status}`}>{inv.status}</span>
              </div>
            </div>
          ))}
          {invoices.length === 0 && <p className="portal-no-data">No invoices found</p>}
          {invoices.length > 5 && (
            <Link to="/portal/invoices" className="portal-view-all">View All Invoices →</Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default PortalDashboard;
