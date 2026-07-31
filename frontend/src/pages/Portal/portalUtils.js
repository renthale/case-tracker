import { format, isBefore, isSameDay, isAfter, differenceInCalendarDays } from 'date-fns';
import { ar } from 'date-fns/locale';

export const formatDate = (value, language = 'ar') => {
  if (!value) return null;
  let d;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    d = new Date(`${value}T00:00:00`);
  } else {
    d = new Date(value);
  }
  if (Number.isNaN(d.getTime())) return null;
  try {
    if (language === 'ar') {
      return format(d, 'dd/MM/yyyy', { locale: ar });
    }
    return format(d, 'MMM d, yyyy');
  } catch {
    return null;
  }
};

export const formatDateTime = (value, language = 'ar') => {
  const date = formatDate(value, language);
  if (!date) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return `${date} ${time}`;
};

export const formatCurrency = (value) => {
  const num = parseFloat(value || 0);
  return `${num.toFixed(3)}`;
};

export const initials = (name = '') => {
  if (!name) return '?';
  const parts = String(name).trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return '?';
  return parts[0].charAt(0) + (parts[1] ? parts[1].charAt(0) : '');
};

export const isUpcomingSession = (session, now = new Date()) => {
  const d = new Date(session.date);
  if (Number.isNaN(d.getTime())) return false;
  return isAfter(d, now) || isSameDay(d, now);
};

export const isPreviousSession = (session, now = new Date()) => {
  const d = new Date(session.date);
  if (Number.isNaN(d.getTime())) return false;
  return isBefore(d, now);
};

export const daysUntil = (dateStr) => {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return differenceInCalendarDays(d, new Date());
};

const STATUS_MAP = {
  active: 'statusActive',
  pending: 'statusPending',
  closed: 'closed',
  won: 'statusWon',
  lost: 'statusLost',
  settled: 'statusSettled',
  appeal: 'statusAppeal',
  retrial: 'statusRetrial',
  dismissed: 'statusDismissed',
  scheduled: 'statusScheduled',
  completed: 'statusCompleted',
  postponed: 'statusPostponed',
  cancelled: 'statusCancelled',
  paid: 'statusPaid',
  overdue: 'statusOverdue',
  draft: 'statusDraft',
  under_review: 'statusUnderReview',
  approved: 'statusApproved',
  archived: 'statusArchived',
  low: 'priorityLow',
  medium: 'priorityMedium',
  high: 'priorityHigh',
  urgent: 'priorityUrgent'
};

const TYPE_MAP = {
  civil: 'typeCivil',
  criminal: 'typeCriminal',
  commercial: 'typeCommercial',
  administrative: 'typeAdministrative',
  family: 'typeFamily',
  labor: 'typeLabor',
  sharia: 'typeSharia',
  traffic: 'typeTraffic',
  other: 'typeOther',
  consultation: 'typeConsultation',
  case_fees: 'typeCaseFees',
  court_fees: 'typeCourtFees',
  document_fees: 'typeDocumentFees',
  contract: 'typeContract',
  petition: 'typePetition',
  judgment: 'typeJudgment',
  evidence: 'typeEvidence',
  correspondence: 'typeCorrespondence',
  memo: 'typeMemo'
};

const METHOD_MAP = {
  cash: 'methodCash',
  bank_transfer: 'methodBankTransfer',
  check: 'methodCheck',
  credit_card: 'methodCreditCard',
  other: 'typeOther'
};

const lookup = (t, map, value) => {
  const key = map[value];
  if (key && t[key]) return t[key];
  if (!value) return '-';
  return String(value).replace(/_/g, ' ');
};

export const translateStatus = (t, value) => lookup(t, STATUS_MAP, value);
export const translateType = (t, value) => lookup(t, TYPE_MAP, value);
export const translateMethod = (t, value) => lookup(t, METHOD_MAP, value);

export const invoiceBalance = (inv) =>
  (parseFloat(inv.totalAmount || 0) - parseFloat(inv.paidAmount || 0));
