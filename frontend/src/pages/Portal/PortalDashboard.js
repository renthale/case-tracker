import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FiBriefcase, FiActivity, FiCalendar, FiDollarSign, FiAlertCircle,
  FiFileText, FiChevronLeft, FiChevronRight
} from 'react-icons/fi';
import { usePortal } from './ClientPortal';
import api from '../../services/portalApi';
import { Kpi, Badge, PortalError } from './PortalUI';
import { formatDate, formatCurrency, translateStatus, isUpcomingSession } from './portalUtils';

const PortalDashboard = () => {
  const { t, language, client } = usePortal();
  const [cases, setCases] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [casesRes, invoicesRes, sessionsRes] = await Promise.all([
        api.get('/portal/cases'),
        api.get('/portal/invoices'),
        api.get('/portal/sessions')
      ]);
      setCases(casesRes.data.cases || []);
      setInvoices(invoicesRes.data.invoices || []);
      setSessions(sessionsRes.data.sessions || []);
    } catch {
      setError(t.errorLoading);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const Chevron = language === 'ar' ? FiChevronLeft : FiChevronRight;

  if (loading) {
    return (
      <div className="portal-loading">
        <div className="portal-spinner" aria-hidden="true" />
        <p>{t.loading}</p>
      </div>
    );
  }

  if (error) {
    return <PortalError message={error} onRetry={fetchData} />;
  }

  const activeCases = cases.filter((c) => c.status === 'active');
  const upcomingSessions = sessions.filter((s) => isUpcomingSession(s));
  const totalPaid = invoices.reduce((sum, inv) => sum + parseFloat(inv.paidAmount || 0), 0);
  const totalPending = invoices.reduce(
    (sum, inv) => sum + (parseFloat(inv.totalAmount || 0) - parseFloat(inv.paidAmount || 0)),
    0
  );

  return (
    <div className="portal-dashboard">
      <div className="portal-page-heading">
        <h2>{language === 'ar' ? `${t.welcome}، ${client?.name}` : `${t.welcome}, ${client?.name}`}</h2>
      </div>

      <div className="portal-kpi-grid">
        <Kpi icon={<FiBriefcase />} value={cases.length} label={t.totalCases} color="#2b6cb0" iconBg="#ebf4ff" />
        <Kpi icon={<FiActivity />} value={activeCases.length} label={t.activeCases} color="#276749" iconBg="#f0fff4" />
        <Kpi icon={<FiCalendar />} value={upcomingSessions.length} label={t.upcomingHearings} color="#b7791f" iconBg="#fffff0" />
        <Kpi icon={<FiDollarSign />} value={`${formatCurrency(totalPaid)} ${t.currency}`} label={t.totalPaid} color="#276749" iconBg="#f0fff4" />
        <Kpi icon={<FiAlertCircle />} value={`${formatCurrency(totalPending)} ${t.currency}`} label={t.pendingBalance} color="#c53030" iconBg="#fff5f5" />
      </div>

      <div className="portal-grid">
        <div className="portal-card">
          <div className="portal-card-header">
            <h3><FiFileText /> {t.recentCases}</h3>
            <Link to="/portal/cases" className="portal-view-all">
              {t.viewAll} <Chevron />
            </Link>
          </div>
          {cases.length === 0 ? (
            <div className="portal-no-data">{t.noCases}</div>
          ) : (
            <div className="portal-list">
              {cases.slice(0, 5).map((c) => (
                <Link key={c.id} to={`/portal/cases/${c.id}`} className="portal-item">
                  <div className="portal-item-main">
                    <span className="portal-item-title">{c.caseNumber || c.title}</span>
                    <span className="portal-item-sub">{c.title}</span>
                  </div>
                  <div className="portal-item-side">
                    <Badge value={c.status} label={translateStatus(t, c.status)} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="portal-card">
          <div className="portal-card-header">
            <h3><FiDollarSign /> {t.recentInvoices}</h3>
            <Link to="/portal/invoices" className="portal-view-all">
              {t.viewAll} <Chevron />
            </Link>
          </div>
          {invoices.length === 0 ? (
            <div className="portal-no-data">{t.noInvoices}</div>
          ) : (
            <div className="portal-list">
              {invoices.slice(0, 5).map((inv) => (
                <div key={inv.id} className="portal-item">
                  <div className="portal-item-main">
                    <span className="portal-item-title">{inv.invoiceNumber}</span>
                    <span className="portal-item-sub">{formatDate(inv.createdAt || inv.issuedDate, language)}</span>
                  </div>
                  <div className="portal-item-side">
                    <span className="portal-item-amount">{formatCurrency(inv.totalAmount)} {t.currency}</span>
                    <Badge value={inv.status} label={translateStatus(t, inv.status)} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="portal-card">
        <div className="portal-card-header">
          <h3><FiCalendar /> {t.upcomingSessions}</h3>
          <Link to="/portal/sessions" className="portal-view-all">
            {t.viewAll} <Chevron />
          </Link>
        </div>
        {upcomingSessions.length === 0 ? (
          <div className="portal-no-data">{t.noSessions}</div>
        ) : (
          <div className="portal-list">
            {upcomingSessions.slice(0, 5).map((s) => (
              <Link key={s.id} to={`/portal/cases/${s.caseId}`} className="portal-item">
                <div className="portal-item-main">
                  <span className="portal-item-title">{s.Case?.caseNumber || `#${s.sessionNumber}`}</span>
                  <span className="portal-item-sub">{s.Case?.title}</span>
                </div>
                <div className="portal-item-side">
                  <span className="portal-item-amount">{formatDate(s.date, language)}</span>
                  <Badge value={s.status} label={translateStatus(t, s.status)} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PortalDashboard;
