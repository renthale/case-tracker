import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FiDollarSign, FiCheckCircle } from 'react-icons/fi';
import { usePortal } from './ClientPortal';
import api from '../../services/portalApi';
import { useViewport } from '../../hooks/useViewport';
import { Kpi, PortalError, PortalPageHeading, PortalEmpty } from './PortalUI';
import { formatDate, formatCurrency, translateMethod } from './portalUtils';

const PortalPayments = () => {
  const { t, language } = usePortal();
  const { isMobile, isTablet } = useViewport();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/portal/payments');
      setPayments(res.data.payments || []);
    } catch {
      setError(t.errorLoading);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

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
        <PortalPageHeading title={t.payments} />
        <PortalError message={error} onRetry={fetchPayments} />
      </>
    );
  }

  const total = payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
  const cardView = isMobile || isTablet;

  return (
    <div className="portal-payments">
      <PortalPageHeading title={t.paymentHistory} />

      <div className="portal-kpi-grid">
        <Kpi icon={<FiDollarSign />} value={payments.length} label={t.totalPayments} color="#2b6cb0" iconBg="#ebf4ff" />
        <Kpi icon={<FiCheckCircle />} value={`${formatCurrency(total)} ${t.currency}`} label={t.totalPaid} color="#276749" iconBg="#f0fff4" />
      </div>

      {payments.length === 0 ? (
        <div className="portal-card">
          <PortalEmpty message={t.noPayments} />
        </div>
      ) : cardView ? (
        <div className="portal-list">
          {payments.map((p) => (
            <div key={p.id} className="portal-item">
              <div className="portal-item-main">
                <span className="portal-item-title">
                  <Link to="/portal/invoices">{p.invoice?.invoiceNumber || '-'}</Link>
                </span>
                <span className="portal-item-sub">{formatDate(p.paymentDate, language)}</span>
                <span className="portal-item-sub">
                  {t.paymentMethod}: {translateMethod(t, p.paymentMethod)}
                </span>
                {p.referenceNumber && (
                  <span className="portal-item-sub">{t.referenceNumber}: {p.referenceNumber}</span>
                )}
              </div>
              <div className="portal-item-side">
                <span className="portal-item-amount">{formatCurrency(p.amount)} {t.currency}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="portal-table-wrap">
          <table className="portal-table">
            <thead>
              <tr>
                <th>{t.relatedInvoice}</th>
                <th>{t.date}</th>
                <th>{t.paymentAmount}</th>
                <th>{t.paymentMethod}</th>
                <th>{t.referenceNumber}</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td data-label={t.relatedInvoice}>
                    <Link to="/portal/invoices">{p.invoice?.invoiceNumber || '-'}</Link>
                  </td>
                  <td data-label={t.date}>{formatDate(p.paymentDate, language)}</td>
                  <td data-label={t.paymentAmount}>
                    <strong>{formatCurrency(p.amount)} {t.currency}</strong>
                  </td>
                  <td data-label={t.paymentMethod}>{translateMethod(t, p.paymentMethod)}</td>
                  <td data-label={t.referenceNumber}>{p.referenceNumber || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PortalPayments;
