import React from 'react';
import { useLanguage } from '../context/LanguageContext';

const STATUS_LABEL_KEYS = {
  draft: 'invoiceStatusDraft',
  sent: 'invoiceStatusSent',
  partially_paid: 'invoiceStatusPartiallyPaid',
  paid: 'invoiceStatusPaid',
  overdue: 'invoiceStatusOverdue',
  cancelled: 'invoiceStatusCancelled'
};

const STATUS_CLASSES = {
  draft: 'badge-closed',
  sent: 'badge-pending',
  partially_paid: 'badge-pending',
  paid: 'badge-active',
  overdue: 'badge-lost',
  cancelled: 'badge-closed',
  unbilled: 'badge-pending',
  invoiced: 'badge-closed',
  active: 'badge-active',
  scheduled: 'badge-active',
  completed: 'badge-active',
  postponed: 'badge-pending',
  pending: 'badge-pending',
  closed: 'badge-closed',
  won: 'badge-active',
  lost: 'badge-lost'
};

const FinancialStatusBadge = ({ status }) => {
  const { t } = useLanguage();
  const labelKey = STATUS_LABEL_KEYS[status];
  const label = labelKey ? (t[labelKey] || status) : (t[status] || status);
  return <span className={`badge ${STATUS_CLASSES[status] || 'badge-closed'}`}>{label}</span>;
};

export default FinancialStatusBadge;
