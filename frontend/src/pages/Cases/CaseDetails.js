import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';
import { FiEdit, FiCalendar, FiArrowRight, FiPlus } from 'react-icons/fi';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import toast from 'react-hot-toast';

const CaseDetails = () => {
  const { id } = useParams();
  const { t, language } = useLanguage();
  const isArabic = language === 'ar';
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCaseDetails();
  }, [id]);

  const fetchCaseDetails = async () => {
    try {
      const response = await api.get(`/cases/${id}`);
      setCaseData(response.data.case);
    } catch (error) {
      toast.error(t.errorFetchingCase);
      navigate('/cases');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      active: 'badge-active',
      pending: 'badge-pending',
      closed: 'badge-closed',
      won: 'badge-won',
      lost: 'badge-lost'
    };
    return <span className={`badge ${statusClasses[status]}`}>{t[status]}</span>;
  };

  if (loading) {
    return <div className="loading">{t.loading}</div>;
  }

  if (!caseData) {
    return <div className="no-data">{t.caseNotFound}</div>;
  }

  return (
    <div className="case-details">
      <div className="card-header">
        <h2 className="card-title">{caseData.title}</h2>
        <div className="actions">
          <Link to={`/cases/${id}/edit`} className="btn btn-primary">
            <FiEdit /> {t.editCase}
          </Link>
          <Link to="/cases" className="btn btn-secondary">
            <FiArrowRight /> {t.backToCases}
          </Link>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3 className="card-title">{t.caseDetails}</h3>
          <div className="details-grid">
            <div className="detail-item">
              <label>{t.caseNumber}</label>
              <span>{caseData.caseNumber}</span>
            </div>
            <div className="detail-item">
              <label>{t.caseType}</label>
              <span>{t[caseData.type]}</span>
            </div>
            <div className="detail-item">
              <label>{t.caseStatus}</label>
              {getStatusBadge(caseData.status)}
            </div>
            <div className="detail-item">
              <label>{t.casePriority}</label>
              <span>{t[caseData.priority]}</span>
            </div>
            <div className="detail-item">
              <label>{t.court}</label>
              <span>{caseData.court || '-'}</span>
            </div>
            <div className="detail-item">
              <label>{t.judge}</label>
              <span>{caseData.judge || '-'}</span>
            </div>
            <div className="detail-item">
              <label>{t.filingDate}</label>
              <span>
                {caseData.filingDate 
                  ? format(new Date(caseData.filingDate), 'dd/MM/yyyy', { locale: ar })
                  : '-'
                }
              </span>
            </div>
            <div className="detail-item">
              <label>{t.nextHearing}</label>
              <span>
                {caseData.nextHearingDate 
                  ? format(new Date(caseData.nextHearingDate), 'dd/MM/yyyy', { locale: ar })
                  : '-'
                }
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">{t.parties}</h3>
          <div className="details-grid">
            <div className="detail-item">
              <label>{t.clientName}</label>
              <span>{caseData.clientName || '-'}</span>
            </div>
            <div className="detail-item">
              <label>{t.clientPhone}</label>
              <span>{caseData.clientPhone || '-'}</span>
            </div>
            <div className="detail-item">
              <label>{t.clientEmail}</label>
              <span>{caseData.clientEmail || '-'}</span>
            </div>
            <div className="detail-item">
              <label>{t.opposingParty}</label>
              <span>{caseData.opposingParty || '-'}</span>
            </div>
            <div className="detail-item">
              <label>{t.opposingLawyer}</label>
              <span>{caseData.opposingLawyer || '-'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3 className="card-title">{isArabic ? 'الفريق' : 'Team'}</h3>
        <div className="details-grid">
          <div className="detail-item">
            <label>{isArabic ? 'المحامي المسؤول' : 'Assigned Lawyer'}</label>
            <span>{caseData.assignedLawyer?.fullName || '-'}</span>
          </div>
          <div className="detail-item">
            <label>{isArabic ? 'مندوب المحاكم' : 'Court Agent'}</label>
            <span>{caseData.courtAgent?.fullName || '-'}</span>
          </div>
        </div>
      </div>

      {caseData.description && (
        <div className="card">
          <h3 className="card-title">{t.description}</h3>
          <p>{caseData.description}</p>
        </div>
      )}

      {caseData.notes && (
        <div className="card">
          <h3 className="card-title">{t.notes}</h3>
          <p>{caseData.notes}</p>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">{t.sessions}</h3>
          <Link to={`/sessions/new?caseId=${id}`} className="btn btn-primary">
            <FiPlus /> {t.addSession}
          </Link>
        </div>
        
        {caseData.sessions?.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>{t.sessionNumber}</th>
                  <th>{t.sessionDate}</th>
                  <th>{t.sessionTime}</th>
                  <th>{t.sessionLocation}</th>
                  <th>{t.sessionStatus}</th>
                  <th>{t.actions}</th>
                </tr>
              </thead>
              <tbody>
                {caseData.sessions.map((session) => (
                  <tr key={session.id}>
                    <td>{session.sessionNumber}</td>
                    <td>{format(new Date(session.date), 'dd/MM/yyyy', { locale: ar })}</td>
                    <td>{session.time || '-'}</td>
                    <td>{session.location || '-'}</td>
                    <td>{t[session.status]}</td>
                    <td>
                      <Link to={`/sessions/${session.id}/edit`} className="btn btn-secondary">
                        <FiEdit />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="no-data">{t.noSessions}</p>
        )}
      </div>

      {caseData.notifications?.length > 0 && (
        <div className="card">
          <h3 className="card-title">{t.recentNotifications}</h3>
          <div className="notifications-list">
            {caseData.notifications.map((notification) => (
              <div key={notification.id} className="notification-item">
                <div className="notification-content">
                  <h4>{notification.title}</h4>
                  <p>{notification.message}</p>
                </div>
                <span className="notification-date">
                  {format(new Date(notification.createdAt), 'dd/MM/yyyy HH:mm', { locale: ar })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseDetails;
