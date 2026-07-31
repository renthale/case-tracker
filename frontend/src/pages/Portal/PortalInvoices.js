import React, { useState, useEffect, useCallback } from 'react';
import { FiCheckCircle, FiAlertCircle, FiFileText } from 'react-icons/fi';
import { usePortal } from './ClientPortal';
import api from '../../services/portalApi';
import { useViewport } from '../../hooks/useViewport';
import { Kpi, Badge, PortalError, PortalPageHeading, PortalEmpty } from './PortalUI';
import { formatDate, formatCurrency, translateStatus, invoiceBalance } from './portalUtils';

const PortalInvoices = () => {
  const { t, language } = usePortal();
  const { isMobile, isTablet } = useViewport();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/portal/invoices');
      setInvoices(res.data.invoices || []);
    } catch {
      setError(t.errorLoading);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

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
        <PortalPageHeading title={t.invoices} />
        <PortalError message={error} onRetry={fetchInvoices} />
      </>
    );
  }

  const totalAmount = invoices.reduce((sum, inv) => sum + parseFloat(inv.totalAmount || 0), 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + parseFloat(inv.paidAmount || 0), 0);
  const totalPending = totalAmount - totalPaid;
  const cardView = isMobile || isTablet;

  return (
    <div className="portal-invoices">
      <PortalPageHeading title={t.invoices} />

      <div className="portal-kpi-grid">
        <Kpi icon={<FiFileText />} value={invoices.length} label={t.totalInvoices} color="#2b6cb0" iconBg="#ebf4ff" />
        <Kpi icon={<FiCheckCircle />} value={`${formatCurrency(totalPaid)} ${t.currency}`} label={t.totalPaid} color="#276749" iconBg="#f0fff4" />
        <Kpi icon={<FiAlertCircle />} value={`${formatCurrency(totalPending)} ${t.currency}`} label={t.pendingBalance} color="#c53030" iconBg="#fff5f5" />
      </div>

      {invoices.length === 0 ? (
        <div className="portal-card">
          <PortalEmpty message={t.noInvoicesLabel} />
        </div>
      ) : cardView ? (
        <div className="portal-list">
          {invoices.map((inv) => (
            <div key={inv.id} className="portal-item">
              <div className="portal-item-main">
                <span className="portal-item-title">{inv.invoiceNumber}</span>
                <span className="portal-item-sub">
                  {t.issuedDate}: {formatDate(inv.issuedDate || inv.createdAt, language)}
                </span>
                <span className="portal-item-sub">
                  {t.dueDate}: {formatDate(inv.dueDate, language) || '-'}
                </span>
                {inv.payments && inv.payments.length > 0 && (
                  <span className="portal-item-sub">
                    {t.payments}: {inv.payments.length}
                  </span>
                )}
              </div>
              <div className="portal-item-side">
                <span className="portal-item-amount">{formatCurrency(inv.totalAmount)} {t.currency}</span>
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
                <th>{t.payments}</th>
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
                  <td data-label={t.payments}>
                    {inv.payments && inv.payments.length > 0
                      ? `${inv.payments.length} · ${formatCurrency(inv.payments.reduce((s, p) => s + parseFloat(p.amount || 0), 0))} ${t.currency}`
                      : '-'}
                  </td>
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
  );
};

export default PortalInvoices;
