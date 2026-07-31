import React from 'react';
import { usePortal } from './ClientPortal';

export const PortalPageHeading = ({ title, actions }) => (
  <div className="portal-page-heading">
    <h2>{title}</h2>
    {actions && <div>{actions}</div>}
  </div>
);

export const PortalError = ({ message, onRetry }) => {
  const { t } = usePortal();
  return (
    <div className="portal-error" role="alert">
      <p>{message}</p>
      {onRetry && (
        <button className="btn btn-primary" onClick={onRetry}>
          {t.retry}
        </button>
      )}
    </div>
  );
};

export const PortalEmpty = ({ message }) => (
  <div className="portal-no-data">{message}</div>
);

export const Kpi = ({ icon, value, label, color, iconBg }) => (
  <div className="portal-kpi">
    {icon && (
      <div
        className="portal-kpi-icon"
        style={{ background: iconBg || '#ebf4ff', color: color || '#2b6cb0' }}
        aria-hidden="true"
      >
        {icon}
      </div>
    )}
    <div className="portal-kpi-num">{value}</div>
    <div className="portal-kpi-label">{label}</div>
  </div>
);

export const Badge = ({ value, label }) => (
  <span className={`portal-badge portal-badge-${value || ''}`}>{label || value}</span>
);
