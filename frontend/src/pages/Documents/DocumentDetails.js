import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';
import { FiEdit, FiArrowRight, FiPrinter, FiClock, FiCheckCircle, FiArchive } from 'react-icons/fi';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import toast from 'react-hot-toast';

const DocumentDetails = () => {
  const { id } = useParams();
  const { t, language } = useLanguage();
  const isArabic = language === 'ar';
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);

  useEffect(() => {
    fetchDocumentDetails();
  }, [id]);

  const fetchDocumentDetails = async () => {
    try {
      const response = await api.get(`/documents/${id}`);
      setDocument(response.data.document);
    } catch (error) {
      toast.error(isArabic ? 'خطأ في جلب المستند' : 'Error loading document');
      navigate('/documents');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setStatusLoading(true);
    try {
      await api.patch(`/documents/${id}/status`, { status: newStatus });
      toast.success(isArabic ? 'تم تغيير الحالة بنجاح' : 'Status changed successfully');
      setDocument({ ...document, status: newStatus });
    } catch (error) {
      toast.error(error.response?.data?.error || (isArabic ? 'خطأ في تغيير الحالة' : 'Error changing status'));
    } finally {
      setStatusLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      draft: 'badge-pending',
      under_review: 'badge-active',
      approved: 'badge-won',
      archived: 'badge-closed'
    };
    return <span className={`badge ${statusClasses[status] || ''}`}>{t[status] || status}</span>;
  };

  const getStatusActions = () => {
    const statusFlow = {
      draft: { next: 'under_review', label: t.sendForReview, icon: <FiClock /> },
      under_review: { next: 'approved', label: t.approve, icon: <FiCheckCircle /> },
      approved: { next: 'archived', label: t.archive, icon: <FiArchive /> }
    };

    const action = statusFlow[document.status];
    if (!action) return null;

    return (
      <button
        className="btn btn-primary"
        onClick={() => handleStatusChange(action.next)}
        disabled={statusLoading}
      >
        {action.icon} {action.label}
      </button>
    );
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="loading">{t.loading}</div>;
  }

  if (!document) {
    return <div className="no-data">{isArabic ? 'المستند غير موجود' : 'Document not found'}</div>;
  }

  return (
    <div className="document-details">
      <div className="card-header">
        <h2 className="card-title">{document.title}</h2>
        <div className="actions">
          {getStatusActions()}
          <Link to={`/documents/${id}/edit`} className="btn btn-primary">
            <FiEdit /> {t.edit}
          </Link>
          <button className="btn btn-secondary" onClick={handlePrint}>
            <FiPrinter /> {t.print}
          </button>
          <Link to="/documents" className="btn btn-secondary">
            <FiArrowRight /> {t.backToDocuments}
          </Link>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3 className="card-title">{t.documentInfo}</h3>
          <div className="details-grid">
            <div className="detail-item">
              <label>{t.title}</label>
              <span>{document.title}</span>
            </div>
            <div className="detail-item">
              <label>{t.documentType}</label>
              <span>{t[document.type] || document.type}</span>
            </div>
            <div className="detail-item">
              <label>{t.status}</label>
              {getStatusBadge(document.status)}
            </div>
            <div className="detail-item">
              <label>{t.author}</label>
              <span>{document.uploader?.fullName || '-'}</span>
            </div>
            <div className="detail-item">
              <label>{t.createdAt}</label>
              <span>
                {document.createdAt
                  ? format(new Date(document.createdAt), 'dd/MM/yyyy HH:mm', { locale: ar })
                  : '-'
                }
              </span>
            </div>
            <div className="detail-item">
              <label>{t.updatedAt}</label>
              <span>
                {document.updatedAt
                  ? format(new Date(document.updatedAt), 'dd/MM/yyyy HH:mm', { locale: ar })
                  : '-'
                }
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">{t.caseInfo}</h3>
          {document.case ? (
            <div className="details-grid">
              <div className="detail-item">
                <label>{t.caseNumber}</label>
                <span><Link to={`/cases/${document.case.id}`}>{document.case.caseNumber}</Link></span>
              </div>
              <div className="detail-item">
                <label>{t.caseTitle}</label>
                <span><Link to={`/cases/${document.case.id}`}>{document.case.title}</Link></span>
              </div>
            </div>
          ) : (
            <p className="no-data">{isArabic ? 'لا توجد قضية مرتبطة' : 'No linked case'}</p>
          )}
        </div>
      </div>

      {document.content && (
        <div className="card">
          <h3 className="card-title">{t.content}</h3>
          <div className="document-content" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8', padding: '1rem', background: '#f9f9f9', borderRadius: '8px' }}>
            {document.content}
          </div>
        </div>
      )}

      {document.notes && (
        <div className="card">
          <h3 className="card-title">{t.notes}</h3>
          <p>{document.notes}</p>
        </div>
      )}
    </div>
  );
};

export default DocumentDetails;
