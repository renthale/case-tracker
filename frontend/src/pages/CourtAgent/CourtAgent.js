import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';
import { FiCalendar, FiClock, FiMapPin, FiCheckCircle, FiXCircle, FiArrowRight } from 'react-icons/fi';
import { format, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';
import toast from 'react-hot-toast';

const CourtAgent = () => {
  const { t } = useLanguage();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchSessions();
  }, [selectedDate]);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const response = await api.get('/sessions', {
        params: {
          page: 1,
          limit: 50
        }
      });
      const allSessions = response.data.sessions;
      const filtered = allSessions.filter((session) => {
        const sessionDate = format(new Date(session.date), 'yyyy-MM-dd');
        return sessionDate === selectedDate;
      });
      setSessions(filtered);
    } catch (error) {
      toast.error('خطأ في جلب جلسات اليوم');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (sessionId, newStatus) => {
    setUpdatingId(sessionId);
    try {
      await api.put(`/sessions/${sessionId}`, { status: newStatus });
      toast.success('تم تحديث حالة الجلسة بنجاح');
      setSessions(sessions.map(s =>
        s.id === sessionId ? { ...s, status: newStatus } : s
      ));
    } catch (error) {
      toast.error(error.response?.data?.error || 'خطأ في تحديث الحالة');
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      scheduled: 'badge-active',
      completed: 'badge-won',
      postponed: 'badge-pending',
      cancelled: 'badge-lost'
    };
    return <span className={`badge ${statusClasses[status] || ''}`}>{t[status] || status}</span>;
  };

  const getStatusActions = (session) => {
    if (session.status === 'scheduled') {
      return (
        <div className="session-actions">
          <button
            className="btn btn-primary btn-sm"
            onClick={() => handleStatusUpdate(session.id, 'completed')}
            disabled={updatingId === session.id}
          >
            <FiCheckCircle /> {t.completed || 'مكتملة'}
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => handleStatusUpdate(session.id, 'postponed')}
            disabled={updatingId === session.id}
          >
            <FiClock /> {t.postponed || 'مؤجلة'}
          </button>
          <button
            className="btn btn-danger btn-sm"
            onClick={() => handleStatusUpdate(session.id, 'cancelled')}
            disabled={updatingId === session.id}
          >
            <FiXCircle /> {t.cancelled || 'ملغاة'}
          </button>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return <div className="loading">{t.loading}</div>;
  }

  return (
    <div className="court-agent">
      <div className="card-header">
        <h2 className="card-title">{t.courtAgent || 'مندوب المحكمة'}</h2>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="form-group">
          <label><FiCalendar /> {t.selectDate || 'اختر التاريخ'}</label>
          <input
            type="date"
            className="form-control"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{ maxWidth: '300px' }}
          />
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">
          {t.sessionsForDate || 'جلسات'} {format(parseISO(selectedDate), 'dd/MM/yyyy', { locale: ar })}
          <span style={{ fontWeight: 'normal', fontSize: '0.9rem', marginRight: '0.5rem' }}>
            ({sessions.length} {t.sessions || 'جلسة'})
          </span>
        </h3>

        {sessions.length === 0 ? (
          <div className="no-data" style={{ padding: '2rem', textAlign: 'center' }}>
            <p>{t.noSessionsToday || 'لا توجد جلسات مجدولة لهذا اليوم'}</p>
          </div>
        ) : (
          <div className="sessions-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
            {sessions.map((session) => (
              <div key={session.id} className="session-card card" style={{ margin: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <h4 style={{ margin: 0 }}>
                    <Link to={`/cases/${session.Case?.id}`}>
                      {session.Case?.title || t.unknownCase || 'قضية غير معروفة'}
                    </Link>
                  </h4>
                  {getStatusBadge(session.status)}
                </div>

                <div className="details-grid" style={{ fontSize: '0.9rem' }}>
                  <div className="detail-item">
                    <label>{t.caseNumber}</label>
                    <span>{session.Case?.caseNumber || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <label>{t.sessionNumber || 'رقم الجلسة'}</label>
                    <span>{session.sessionNumber}</span>
                  </div>
                  <div className="detail-item">
                    <label><FiClock /> {t.time || 'الوقت'}</label>
                    <span>{session.time || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <label><FiMapPin /> {t.location || 'الموقع'}</label>
                    <span>{session.location || '-'}</span>
                  </div>
                  {session.sessionType && (
                    <div className="detail-item">
                      <label>{t.sessionType || 'نوع الجلسة'}</label>
                      <span>{t[session.sessionType] || session.sessionType}</span>
                    </div>
                  )}
                </div>

                {session.notes && (
                  <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#666' }}>
                    <strong>{t.notes}:</strong> {session.notes}
                  </div>
                )}

                <div style={{ marginTop: '0.75rem' }}>
                  {getStatusActions(session)}
                </div>

                <div style={{ marginTop: '0.75rem' }}>
                  <Link to={`/sessions/${session.id}/edit`} className="btn btn-secondary btn-sm">
                    <FiArrowRight /> {t.editSession || 'تعديل الجلسة'}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CourtAgent;
