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
  const { t } = useLanguage();
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
      toast.error('خطأ في جلب المستند');
      navigate('/documents');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setStatusLoading(true);
    try {
      await api.patch(`/documents/${id}/status`, { status: newStatus });
      toast.success('تم تغيير الحالة بنجاح');
      setDocument({ ...document, status: newStatus });
    } catch (error) {
      toast.error(error.response?.data?.error || 'خطأ في تغيير الحالة');
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
      draft: { next: 'under_review', label: t.sendForReview || 'إرسال للمراجعة', icon: <FiClock /> },
      under_review: { next: 'approved', label: t.approve || 'اعتماد', icon: <FiCheckCircle /> },
      approved: { next: 'archived', label: t.archive || 'أرشفة', icon: <FiArchive /> }
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
    return <div className="no-data">المستند غير موجود</div>;
  }

  return (
    <div className="document-details">
      <div className="card-header">
        <h2 className="card-title">{document.title}</h2>
        <div className="actions">
          {getStatusActions()}
          <Link to={`/documents/${id}/edit`} className="btn btn-primary">
            <FiEdit /> {t.edit || 'تعديل'}
          </Link>
          <button className="btn btn-secondary" onClick={handlePrint}>
            <FiPrinter /> {t.print || 'طباعة'}
          </button>
          <Link to="/documents" className="btn btn-secondary">
            <FiArrowRight /> {t.backToDocuments || 'العودة لقائمة المستندات'}
          </Link>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3 className="card-title">{t.documentInfo || 'بيانات المستند'}</h3>
          <div className="details-grid">
            <div className="detail-item">
              <label>{t.title || 'العنوان'}</label>
              <span>{document.title}</span>
            </div>
            <div className="detail-item">
              <label>{t.type || 'النوع'}</label>
              <span>{t[document.type] || document.type}</span>
            </div>
            <div className="detail-item">
              <label>{t.status || 'الحالة'}</label>
              {getStatusBadge(document.status)}
            </div>
            <div className="detail-item">
              <label>{t.author || 'الكاتب'}</label>
              <span>{document.uploader?.fullName || '-'}</span>
            </div>
            <div className="detail-item">
              <label>{t.createdAt || 'تاريخ الإنشاء'}</label>
              <span>
                {document.createdAt
                  ? format(new Date(document.createdAt), 'dd/MM/yyyy HH:mm', { locale: ar })
                  : '-'
                }
              </span>
            </div>
            <div className="detail-item">
              <label>{t.updatedAt || 'آخر تحديث'}</label>
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
          <h3 className="card-title">{t.caseInfo || 'القضية المرتبطة'}</h3>
          {document.case ? (
            <div className="details-grid">
              <div className="detail-item">
                <label>{t.caseNumber}</label>
                <span><Link to={`/cases/${document.case.id}`}>{document.case.caseNumber}</Link></span>
              </div>
              <div className="detail-item">
                <label>{t.caseTitle || 'عنوان القضية'}</label>
                <span><Link to={`/cases/${document.case.id}`}>{document.case.title}</Link></span>
              </div>
            </div>
          ) : (
            <p className="no-data">لا ت قضية مرتبطة</p>
          )}
        </div>
      </div>

      {document.content && (
        <div className="card">
          <h3 className="card-title">{t.content || 'المحتوى'}</h3>
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
