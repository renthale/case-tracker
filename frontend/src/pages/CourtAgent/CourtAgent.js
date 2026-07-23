import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiCalendar, FiClock, FiMapPin, FiCheckCircle, FiXCircle, FiFileText, FiPrinter, FiChevronDown, FiChevronUp, FiUpload, FiTrash2 } from 'react-icons/fi';
import { format, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';

const CourtAgent = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const isArabic = language === 'ar';
  const reportRef = useRef();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [updatingId, setUpdatingId] = useState(null);
  const [postponeDate, setPostponeDate] = useState({});
  const [expandedSession, setExpandedSession] = useState(null);
  const [uploadingId, setUploadingId] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [dailyReport, setDailyReport] = useState(null);
  const [outcomeText, setOutcomeText] = useState({});

  useEffect(() => {
    fetchSessions();
    setShowReport(false);
  }, [selectedDate]);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const response = await api.get('/sessions', { params: { page: 1, limit: 200 } });
      const allSessions = response.data.sessions;
      
      // Filter sessions based on current user's courtAgentId
      const filtered = allSessions.filter((session) => {
        // Only show sessions for cases assigned to this court agent
        if (user && session.Case && session.Case.courtAgentId !== user.id) {
          return false;
        }
        const sessionDate = format(new Date(session.date), 'yyyy-MM-dd');
        return sessionDate === selectedDate;
      });
      setSessions(filtered);
    } catch (error) {
      toast.error(isArabic ? 'خطأ في جلب جلسات اليوم' : 'Error loading sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (sessionId, newStatus) => {
    if (newStatus === 'postponed' && !postponeDate[sessionId]) {
      toast.error(isArabic ? 'أدخل تاريخ التأجيل أولاً' : 'Enter postpone date first');
      return;
    }

    setUpdatingId(sessionId);
    try {
      const updateData = { status: newStatus };
      if (newStatus === 'postponed' && postponeDate[sessionId]) {
        updateData.postponedTo = postponeDate[sessionId];
      }
      if (outcomeText[sessionId]) {
        updateData.outcome = outcomeText[sessionId];
      }
      await api.put(`/sessions/${sessionId}`, updateData);
      toast.success(isArabic ? 'تم تحديث حالة الجلسة' : 'Session status updated');
      setSessions(sessions.map(s =>
        s.id === sessionId ? { ...s, ...updateData } : s
      ));
    } catch (error) {
      toast.error(error.response?.data?.error || (isArabic ? 'خطأ في التحديث' : 'Update error'));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleFileUpload = async (sessionId, e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error(isArabic ? 'حجم الملف يتجاوز 5 ميجا' : 'File size exceeds 5MB');
      return;
    }

    setUploadingId(sessionId);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result;
        await api.post(`/sessions/${sessionId}/documents`, {
          name: file.name,
          type: file.type,
          data: base64
        });
        toast.success(isArabic ? 'تم رفع المستند بنجاح' : 'Document uploaded');
        fetchSessions();
        setUploadingId(null);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error(isArabic ? 'خطأ في رفع المستند' : 'Upload error');
      setUploadingId(null);
    }
  };

  const handleDeleteDocument = async (sessionId, docIndex) => {
    const msg = isArabic ? 'هل أنت متأكد من حذف المستند؟' : 'Delete this document?';
    if (!window.confirm(msg)) return;
    try {
      await api.delete(`/sessions/${sessionId}/documents/${docIndex}`);
      toast.success(isArabic ? 'تم حذف المستند' : 'Document deleted');
      fetchSessions();
    } catch (error) {
      toast.error(isArabic ? 'خطأ في الحذف' : 'Delete error');
    }
  };

  const fetchDailyReport = async () => {
    try {
      const response = await api.get('/sessions/daily-report', { params: { date: selectedDate } });
      setDailyReport(response.data);
      setShowReport(true);
    } catch (error) {
      toast.error(isArabic ? 'خطأ في إنشاء التقرير' : 'Error generating report');
    }
  };

  const handlePrintReport = () => {
    const printContent = reportRef.current;
    if (!printContent) return;
    const printWindow = window.open('', '_blank');
    const dir = isArabic ? 'rtl' : 'ltr';
    const textAlign = isArabic ? 'right' : 'left';
    printWindow.document.write(
      '<html><head><title>Daily Report</title><style>' +
      'body{font-family:Arial,sans-serif;direction:' + dir + ';padding:20px;}' +
      'h2{text-align:center;font-size:16px;}' +
      'table{width:100%;border-collapse:collapse;margin-top:15px;}' +
      'th,td{border:1px solid #ddd;padding:8px;text-align:' + textAlign + ';font-size:12px;}' +
      'th{background:#f5f5f5;}' +
      '.summary{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin:20px 0;}' +
      '.summary div{text-align:center;padding:10px;border-radius:6px;}' +
      '.sc{color:green;}.sp{color:orange;}.ss{color:blue;}.sx{color:red;}' +
      '</style></head><body>' + printContent.innerHTML + '</body></html>'
    );
    printWindow.document.close();
    printWindow.print();
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      scheduled: { class: 'badge-active', label: isArabic ? 'مجدولة' : 'Scheduled' },
      completed: { class: 'badge-won', label: isArabic ? 'منجزة' : 'Completed' },
      postponed: { class: 'badge-pending', label: isArabic ? 'مؤجلة' : 'Postponed' },
      cancelled: { class: 'badge-lost', label: isArabic ? 'ملغاة' : 'Cancelled' }
    };
    const config = statusConfig[status] || { class: '', label: status };
    return <span className={'badge ' + config.class}>{config.label}</span>;
  };

  const toggleExpand = (sessionId) => {
    setExpandedSession(expandedSession === sessionId ? null : sessionId);
  };

  if (loading) {
    return <div className="loading">{isArabic ? 'جاري التحميل...' : 'Loading...'}</div>;
  }

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>{isArabic ? 'مندوب المحاكم' : 'Court Agent'}</h1>
          {user && (
            <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
              {isArabic ? 'المندوب:' : 'Agent:'} <strong>{user.fullName}</strong>
            </p>
          )}
        </div>
        <button className="btn btn-secondary" onClick={fetchDailyReport}>
          <FiFileText /> {isArabic ? 'تقرير يومي' : 'Daily Report'}
        </button>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ margin: 0, flex: 1, minWidth: 200 }}>
            <label><FiCalendar /> {isArabic ? 'اختر التاريخ' : 'Select Date'}</label>
            <input type="date" className="form-control" value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)} />
          </div>
          <div style={{ padding: '0.5rem', background: '#f5f5f5', borderRadius: 6, fontSize: '0.9rem' }}>
            {isArabic ? 'إجمالي:' : 'Total:'} <strong>{sessions.length}</strong> {isArabic ? 'جلسة' : 'sessions'}
          </div>
        </div>
      </div>

      {showReport && dailyReport && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 className="card-title">{isArabic ? 'تقرير يومي - مندوب المحاكم' : 'Daily Report - Court Agent'}</h3>
            <div>
              <button className="btn btn-primary btn-sm" onClick={handlePrintReport} style={{ marginRight: '0.5rem' }}>
                <FiPrinter /> {isArabic ? 'طباعة' : 'Print'}
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowReport(false)}>
                <FiXCircle />
              </button>
            </div>
          </div>
          <div ref={reportRef}>
            <h2 style={{ textAlign: 'center', fontSize: 16, marginBottom: '1rem' }}>
              {isArabic ? 'تقرير يومي - مندوب المحاكم' : 'Daily Report - Court Agent'}
              <br />{selectedDate}
            </h2>
            <div className="summary" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem', textAlign: 'center', marginBottom: '1rem' }}>
              <div style={{ padding: '0.75rem', background: '#e3f2fd', borderRadius: 6 }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{dailyReport.summary.total}</div>
                <div style={{ fontSize: '0.8rem', color: '#666' }}>{isArabic ? 'الإجمالي' : 'Total'}</div>
              </div>
              <div style={{ padding: '0.75rem', background: '#e8f5e9', borderRadius: 6 }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'green' }}>{dailyReport.summary.completed}</div>
                <div style={{ fontSize: '0.8rem', color: '#666' }}>{isArabic ? 'منجزة' : 'Completed'}</div>
              </div>
              <div style={{ padding: '0.75rem', background: '#fff3e0', borderRadius: 6 }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'orange' }}>{dailyReport.summary.postponed}</div>
                <div style={{ fontSize: '0.8rem', color: '#666' }}>{isArabic ? 'مؤجلة' : 'Postponed'}</div>
              </div>
              <div style={{ padding: '0.75rem', background: '#e3f2fd', borderRadius: 6 }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'blue' }}>{dailyReport.summary.scheduled}</div>
                <div style={{ fontSize: '0.8rem', color: '#666' }}>{isArabic ? 'مجدولة' : 'Scheduled'}</div>
              </div>
              <div style={{ padding: '0.75rem', background: '#ffebee', borderRadius: 6 }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'red' }}>{dailyReport.summary.cancelled}</div>
                <div style={{ fontSize: '0.8rem', color: '#666' }}>{isArabic ? 'ملغاة' : 'Cancelled'}</div>
              </div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  <th style={{ padding: 8, textAlign: 'right' }}>#</th>
                  <th style={{ padding: 8, textAlign: 'right' }}>{isArabic ? 'القضية' : 'Case'}</th>
                  <th style={{ padding: 8, textAlign: 'right' }}>{isArabic ? 'رقم القضية' : 'Case No.'}</th>
                  <th style={{ padding: 8, textAlign: 'right' }}>{isArabic ? 'الوقت' : 'Time'}</th>
                  <th style={{ padding: 8, textAlign: 'right' }}>{isArabic ? 'الحالة' : 'Status'}</th>
                  <th style={{ padding: 8, textAlign: 'right' }}>{isArabic ? 'النتيجة' : 'Outcome'}</th>
                </tr>
              </thead>
              <tbody>
                {dailyReport.sessions.map((s, i) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: 8 }}>{i + 1}</td>
                    <td style={{ padding: 8 }}>{s.caseTitle}</td>
                    <td style={{ padding: 8 }}>{s.caseNumber}</td>
                    <td style={{ padding: 8 }}>{s.time || '-'}</td>
                    <td style={{ padding: 8 }}>
                      <span className={s.status === 'completed' ? 'sc' : s.status === 'postponed' ? 'sp' : s.status === 'cancelled' ? 'sx' : 'ss'}
                        style={{ fontWeight: 'bold' }}>
                        {s.status === 'completed' ? (isArabic ? 'منجزة' : 'Completed') :
                         s.status === 'postponed' ? (isArabic ? 'مؤجلة' : 'Postponed') :
                         s.status === 'cancelled' ? (isArabic ? 'ملغاة' : 'Cancelled') :
                         (isArabic ? 'مجدولة' : 'Scheduled')}
                      </span>
                    </td>
                    <td style={{ padding: 8 }}>{s.outcome || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card">
        <h3 className="card-title">
          {isArabic ? 'جلسات' : 'Sessions for'} {format(parseISO(selectedDate), 'dd/MM/yyyy', { locale: ar })}
          <span style={{ fontWeight: 'normal', fontSize: '0.9rem', marginRight: '0.5rem' }}>
            ({sessions.length} {isArabic ? 'جلسة' : 'session(s)'})
          </span>
        </h3>

        {sessions.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
            <p>{isArabic ? 'لا توجد جلسات مجدولة لهذا اليوم' : 'No sessions scheduled for this date'}</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
            {sessions.map((session) => (
              <div key={session.id} className="card" style={{ margin: 0, borderLeft: session.status === 'completed' ? '4px solid #4caf50' : session.status === 'postponed' ? '4px solid #ff9800' : session.status === 'cancelled' ? '4px solid #f44336' : '4px solid #2196f3' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <h4 style={{ margin: 0, fontSize: '0.95rem' }}>
                    <Link to={'/cases/' + (session.Case?.id || '')}>
                      {session.Case?.title || (isArabic ? 'قضية غير معروفة' : 'Unknown case')}
                    </Link>
                  </h4>
                  {getStatusBadge(session.status)}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                  <div>
                    <span style={{ color: '#999' }}>{isArabic ? 'رقم القضية' : 'Case No.'}: </span>
                    <span>{session.Case?.caseNumber || '-'}</span>
                  </div>
                  <div>
                    <span style={{ color: '#999' }}>{isArabic ? 'رقم الجلسة' : 'Session'}: </span>
                    <span>{session.sessionNumber}</span>
                  </div>
                  <div>
                    <FiClock /> <span style={{ color: '#999' }}>{isArabic ? 'الوقت' : 'Time'}: </span>
                    <span>{session.time || '-'}</span>
                  </div>
                  <div>
                    <FiMapPin /> <span style={{ color: '#999' }}>{isArabic ? 'الموقع' : 'Location'}: </span>
                    <span>{session.location || '-'}</span>
                  </div>
                  {session.sessionType && (
                    <div>
                      <span style={{ color: '#999' }}>{isArabic ? 'النوع' : 'Type'}: </span>
                      <span>{session.sessionType}</span>
                    </div>
                  )}
                  {session.postponedTo && (
                    <div style={{ color: '#ff9800', fontWeight: 'bold' }}>
                      <FiClock /> {isArabic ? 'تم التأجيل لـ' : 'Postponed to'}: {session.postponedTo}
                    </div>
                  )}
                </div>

                {session.outcome && (
                  <div style={{ marginBottom: '0.75rem', padding: '0.5rem', background: '#f5f5f5', borderRadius: 4, fontSize: '0.85rem' }}>
                    <strong>{isArabic ? 'النتيجة' : 'Outcome'}:</strong> {session.outcome}
                  </div>
                )}

                {session.notes && (
                  <div style={{ marginBottom: '0.75rem', fontSize: '0.85rem', color: '#666' }}>
                    <strong>{isArabic ? 'ملاحظات' : 'Notes'}:</strong> {session.notes}
                  </div>
                )}

                {session.documents && session.documents.length > 0 && (
                  <div style={{ marginBottom: '0.75rem' }}>
                    <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>
                      <FiFileText /> {isArabic ? 'المستندات المرفقة' : 'Attached Documents'} ({session.documents.length})
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                      {session.documents.map((doc, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '2px 8px', background: '#e3f2fd', borderRadius: 4, fontSize: '0.8rem' }}>
                          <a href={doc.data} target="_blank" rel="noreferrer">{doc.name}</a>
                          {session.status === 'scheduled' && (
                            <FiTrash2 style={{ cursor: 'pointer', color: '#f44336', fontSize: 12 }}
                              onClick={() => handleDeleteDocument(session.id, idx)} />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ borderTop: '1px solid #eee', paddingTop: '0.75rem' }}>
                  {session.status === 'scheduled' && (
                    <>
                      <div style={{ marginBottom: '0.5rem' }}>
                        <textarea
                          className="form-control"
                          rows="1"
                          placeholder={isArabic ? 'نتيجة الجلسة (اختياري)' : 'Session outcome (optional)'}
                          value={outcomeText[session.id] || ''}
                          onChange={(e) => setOutcomeText({ ...outcomeText, [session.id]: e.target.value })}
                          style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <button className="btn btn-primary btn-sm"
                          onClick={() => handleStatusUpdate(session.id, 'completed')}
                          disabled={updatingId === session.id}>
                          <FiCheckCircle /> {isArabic ? 'منجزة' : 'Completed'}
                        </button>
                        <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                          <input type="date" className="form-control"
                            value={postponeDate[session.id] || ''}
                            onChange={(e) => setPostponeDate({ ...postponeDate, [session.id]: e.target.value })}
                            style={{ fontSize: '0.8rem', maxWidth: 150, padding: '4px 8px' }} />
                          <button className="btn btn-secondary btn-sm"
                            onClick={() => handleStatusUpdate(session.id, 'postponed')}
                            disabled={updatingId === session.id}>
                            <FiClock /> {isArabic ? 'تأجيل' : 'Postpone'}
                          </button>
                        </div>
                        <button className="btn btn-danger btn-sm"
                          onClick={() => handleStatusUpdate(session.id, 'cancelled')}
                          disabled={updatingId === session.id}>
                          <FiXCircle /> {isArabic ? 'ملغاة' : 'Cancelled'}
                        </button>
                      </div>
                      <div style={{ marginTop: '0.5rem' }}>
                        <label style={{ cursor: 'pointer', fontSize: '0.85rem', color: '#1976d2' }}>
                          <FiUpload /> {uploadingId === session.id ? (isArabic ? 'جاري الرفع...' : 'Uploading...') : (isArabic ? 'رفع مستند' : 'Upload document')}
                          <input type="file" accept="image/*,.pdf" style={{ display: 'none' }}
                            onChange={(e) => handleFileUpload(session.id, e)}
                            disabled={uploadingId === session.id} />
                        </label>
                      </div>
                    </>
                  )}

                  {session.status !== 'scheduled' && (
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <Link to={'/sessions/' + session.id + '/edit'} className="btn btn-secondary btn-sm">
                        {isArabic ? 'تعديل' : 'Edit'}
                      </Link>
                      <button className="btn btn-secondary btn-sm" onClick={() => toggleExpand(session.id)}>
                        {expandedSession === session.id ? <FiChevronUp /> : <FiChevronDown />}
                        {isArabic ? 'مستندات' : 'Docs'}
                      </button>
                      {expandedSession === session.id && (
                        <label style={{ cursor: 'pointer', fontSize: '0.85rem', color: '#1976d2' }}>
                          <FiUpload /> {isArabic ? 'رفع مستند' : 'Upload'}
                          <input type="file" accept="image/*,.pdf" style={{ display: 'none' }}
                            onChange={(e) => handleFileUpload(session.id, e)}
                            disabled={uploadingId === session.id} />
                        </label>
                      )}
                    </div>
                  )}
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
