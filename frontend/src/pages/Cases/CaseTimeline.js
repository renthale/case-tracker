import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { FiBriefcase, FiEdit, FiCalendar, FiFileText, FiActivity, FiDollarSign, FiCheckCircle } from 'react-icons/fi';
import { format } from 'date-fns';
import { ar as arLocale } from 'date-fns/locale';

const FINANCIAL_ROLES = ['admin', 'partner', 'legal_secretary'];

const typeIcon = {
  case_created: FiBriefcase,
  case_updated: FiEdit,
  session: FiCalendar,
  document: FiFileText,
  notification: FiActivity,
  financial: FiDollarSign,
  payment: FiCheckCircle
};

const CaseTimeline = ({ caseId }) => {
  const { t, language } = useLanguage();
  const isArabic = language === 'ar';
  const { user } = useAuth();
  const canManageFinancials = FINANCIAL_ROLES.includes(user?.role);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchTimeline = async () => {
      setLoading(true);
      setFetchError(false);
      try {
        const response = await api.get(`/cases/${caseId}/timeline`);
        if (mounted) {
          const visible = (response.data.events || []).filter(e => canManageFinancials || !['financial', 'payment'].includes(e.type));
          setEvents(visible);
        }
      } catch (error) {
        console.error('Error fetching timeline:', error);
        if (mounted) setFetchError(true);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchTimeline();
    return () => { mounted = false; };
  }, [caseId, canManageFinancials]);

  if (loading) {
    return <div className="loading" style={{ height: 'auto', padding: '2rem' }}>{t.loading}</div>;
  }

  if (fetchError) {
    return (
      <div className="error-state">
        <p>{isArabic ? 'خطأ في جلب الجدول الزمني' : 'Error loading timeline'}</p>
      </div>
    );
  }

  if (events.length === 0) {
    return <div className="card"><p className="no-data">{t.timelineNoEvents}</p></div>;
  }

  const sessionLabel = (status) => {
    switch (status) {
      case 'scheduled': return t.sessionScheduled;
      case 'completed': return t.sessionCompleted;
      case 'postponed': return t.sessionPostponed;
      case 'cancelled': return t.sessionCancelled;
      default: return status;
    }
  };

  const renderDetail = (event) => {
    const data = event.data || {};
    switch (event.type) {
      case 'session':
        return (
          <div className="timeline-detail">
            <span className="timeline-badge">{sessionLabel(data.status)}</span>
            {data.outcome && <p>{data.outcome}</p>}
            {data.postponedTo && <p>{isArabic ? 'أجلت إلى' : 'Postponed to'}: {format(new Date(data.postponedTo), 'dd/MM/yyyy')}</p>}
            {data.nextSessionDate && <p>{isArabic ? 'الجلسة القادمة' : 'Next session'}: {format(new Date(data.nextSessionDate), 'dd/MM/yyyy')}</p>}
          </div>
        );
      case 'financial':
        return (
          <div className="timeline-detail">
            <span className="timeline-badge">{t[data.category] || data.category}</span>
            <p>
              {data.type === 'professional_fee' ? t.professionalFeeLabel
                : data.type === 'case_expense' ? t.caseExpenseLabel
                : t.sessionExpenseLabel}: {parseFloat(data.amount || 0).toFixed(3)} د.ك
            </p>
            {data.billingStatus && <span className="timeline-badge">{data.billingStatus}</span>}
          </div>
        );
      case 'payment':
        return (
          <div className="timeline-detail">
            <p>{parseFloat(data.amount || 0).toFixed(3)} د.ك {data.method ? `(${data.method})` : ''}</p>
            {data.referenceNumber && <p>{isArabic ? 'المرجع' : 'Reference'}: {data.referenceNumber}</p>}
          </div>
        );
      case 'case_updated':
        return (
          <div className="timeline-detail">
            {data.oldStatus && data.newStatus && data.oldStatus !== data.newStatus && (
              <p>
                <span className="timeline-badge">{data.oldStatus}</span>
                <span className="timeline-arrow">{isArabic ? '←' : '→'}</span>
                <span className="timeline-badge">{data.newStatus}</span>
              </p>
            )}
          </div>
        );
      case 'notification':
        return data.message ? <div className="timeline-detail"><p>{data.message}</p></div> : null;
      default:
        return null;
    }
  };

  const eventLabel = (event) => {
    switch (event.type) {
      case 'case_created': return t.caseCreatedEvent;
      case 'case_updated': return t.caseUpdatedEvent;
      case 'session': return `${t.sessionEvent}${event.title ? ` #${event.title}` : ''}`;
      case 'document': return `${t.documentEvent}: ${event.title || ''}`;
      case 'notification': return event.title || t.notificationEvent;
      case 'financial': return t.financialEvent;
      case 'payment': return t.paymentEvent;
      default: return event.type;
    }
  };

  return (
    <div className="card">
      <h3 className="card-title">{t.timeline}</h3>
      <div className="case-timeline">
        {events.map((event, index) => {
          const Icon = typeIcon[event.type] || FiActivity;
          const date = new Date(event.date);
          const showGroup = index === 0
            || format(new Date(events[index - 1].date), 'yyyy-MM-dd') !== format(date, 'yyyy-MM-dd');
          return (
            <div key={index} className="timeline-entry">
              {showGroup && (
                <div className="timeline-date-group">
                  {format(date, isArabic ? 'd MMMM yyyy' : 'MMM d, yyyy', { locale: arLocale })}
                </div>
              )}
              <div className="timeline-row">
                <div className={`timeline-marker timeline-marker-${event.type}`}><Icon /></div>
                <div className="timeline-content">
                  <div className="timeline-head">
                    <strong>{eventLabel(event)}</strong>
                    <span className="timeline-time">{format(date, 'HH:mm')}</span>
                  </div>
                  {renderDetail(event)}
                  {event.user && <p className="timeline-by">{t.timelineBy}: {event.user}</p>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CaseTimeline;
