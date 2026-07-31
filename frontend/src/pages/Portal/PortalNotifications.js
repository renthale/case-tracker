import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FiCalendar, FiBriefcase, FiDollarSign, FiAlertTriangle } from 'react-icons/fi';
import { usePortal } from './ClientPortal';
import api from '../../services/portalApi';
import { PortalError, PortalPageHeading, PortalEmpty } from './PortalUI';
import { formatDate, daysUntil, isUpcomingSession, invoiceBalance } from './portalUtils';

const PortalNotifications = () => {
  const { t, language } = usePortal();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [casesRes, sessionsRes, invoicesRes] = await Promise.all([
        api.get('/portal/cases'),
        api.get('/portal/sessions'),
        api.get('/portal/invoices')
      ]);
      const items = [];

      (sessionsRes.data.sessions || [])
        .filter((s) => isUpcomingSession(s))
        .forEach((s) => {
          const days = daysUntil(s.date);
          if (days !== null && days <= 14) {
            items.push({
              id: `s-${s.id}`,
              type: 'hearing',
              icon: FiCalendar,
              color: '#2b6cb0',
              bg: '#ebf4ff',
              title: t.upcomingHearingNote,
              body: `${s.Case?.caseNumber || ''} · ${formatDate(s.date, language)}`,
              link: `/portal/cases/${s.caseId}`,
              days
            });
          }
        });

      (invoicesRes.data.invoices || []).forEach((inv) => {
        const balance = invoiceBalance(inv);
        if (balance > 0) {
          const days = inv.dueDate ? daysUntil(inv.dueDate) : null;
          const overdue = days !== null && days < 0;
          items.push({
            id: `i-${inv.id}`,
            type: overdue ? 'overdue' : 'invoice',
            icon: overdue ? FiAlertTriangle : FiDollarSign,
            color: overdue ? '#c53030' : '#b7791f',
            bg: overdue ? '#fff5f5' : '#fffff0',
            title: overdue ? t.overdueInvoiceNote : t.invoiceReminder,
            body: `${inv.invoiceNumber} · ${t.pendingBalance}: ${balance.toFixed(3)} ${t.currency}`,
            link: '/portal/invoices',
            days
          });
        }
      });

      (casesRes.data.cases || []).forEach((c) => {
        if (c.createdAt) {
          const createdDays = daysUntil(c.createdAt);
          if (createdDays !== null && createdDays >= -14 && createdDays <= 0) {
            items.push({
              id: `c-${c.id}`,
              type: 'case',
              icon: FiBriefcase,
              color: '#276749',
              bg: '#f0fff4',
              title: t.newCaseNote,
              body: `${c.caseNumber || ''} · ${c.title}`,
              link: `/portal/cases/${c.id}`,
              days: null
            });
          }
        }
      });

      items.sort((a, b) => {
        if (a.days === null && b.days === null) return 0;
        if (a.days === null) return 1;
        if (b.days === null) return -1;
        return a.days - b.days;
      });

      setNotifications(items);
    } catch {
      setError(t.errorLoading);
    } finally {
      setLoading(false);
    }
  }, [t, language]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const meta = (n) => {
    if (n.days === null) return formatDate(new Date(), language);
    if (n.days === 0) return t.today;
    if (n.days < 0) return formatDate(new Date(Date.now() + n.days * 86400000), language);
    return `${t.inDays} ${n.days} ${t.daysLeft}`;
  };

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
        <PortalPageHeading title={t.notifications} />
        <PortalError message={error} onRetry={fetchData} />
      </>
    );
  }

  return (
    <div className="portal-notifications">
      <PortalPageHeading title={t.notificationsTitle} />
      <p style={{ color: '#718096', fontSize: '0.9rem', marginTop: '-0.5rem', marginBottom: '1.25rem' }}>
        {t.notificationsIntro}
      </p>

      {notifications.length === 0 ? (
        <div className="portal-card">
          <PortalEmpty message={t.noNotifications} />
        </div>
      ) : (
        <div className="portal-list">
          {notifications.map((n) => (
            <Link key={n.id} to={n.link} className="portal-notification-item">
              <div
                className="portal-notification-icon"
                style={{ color: n.color, background: n.bg }}
                aria-hidden="true"
              >
                <n.icon />
              </div>
              <div className="portal-notification-body">
                <div className="portal-notification-title">{n.title}</div>
                <div className="portal-notification-meta">{n.body}</div>
              </div>
              <div className="portal-notification-meta" style={{ whiteSpace: 'nowrap' }}>
                {meta(n)}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default PortalNotifications;
