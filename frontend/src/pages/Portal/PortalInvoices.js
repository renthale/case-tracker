import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const PortalInvoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const res = await api.get('/portal/invoices');
      setInvoices(res.data.invoices || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="portal-loading">Loading...</div>;

  const totalAmount = invoices.reduce((sum, inv) => sum + parseFloat(inv.totalAmount || 0), 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + parseFloat(inv.paidAmount || 0), 0);
  const totalPending = totalAmount - totalPaid;

  return (
    <div className="portal-invoices">
      <h2>My Invoices</h2>

      <div className="portal-kpi-grid">
        <div className="portal-kpi" style={{ borderLeft: '4px solid #3498db' }}>
          <div className="portal-kpi-num">{invoices.length}</div>
          <div className="portal-kpi-label">Total Invoices</div>
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

      <div className="portal-card">
        <table className="portal-table">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Date</th>
              <th>Total</th>
              <th>Paid</th>
              <th>Balance</th>
              <th>Status</th>
              <th>Due Date</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map(inv => (
              <tr key={inv.id}>
                <td><strong>{inv.invoiceNumber}</strong></td>
                <td>{new Date(inv.createdAt).toLocaleDateString()}</td>
                <td>{parseFloat(inv.totalAmount).toFixed(3)} KWD</td>
                <td>{parseFloat(inv.paidAmount).toFixed(3)} KWD</td>
                <td>{(parseFloat(inv.totalAmount) - parseFloat(inv.paidAmount)).toFixed(3)} KWD</td>
                <td><span className={`portal-badge portal-badge-${inv.status}`}>{inv.status}</span></td>
                <td>{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'N/A'}</td>
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr><td colSpan="7" className="portal-no-data">No invoices found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PortalInvoices;
