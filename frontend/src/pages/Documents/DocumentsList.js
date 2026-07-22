import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';
import { FiPlus, FiSearch, FiEye, FiEdit, FiTrash2 } from 'react-icons/fi';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import toast from 'react-hot-toast';

const DocumentsList = () => {
  const { t, language } = useLanguage();
  const isArabic = language === 'ar';
  const [searchParams, setSearchParams] = useSearchParams();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    type: searchParams.get('type') || '',
    status: searchParams.get('status') || '',
    caseId: searchParams.get('caseId') || ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0
  });

  useEffect(() => {
    fetchDocuments();
  }, [filters, pagination.page]);

  const fetchDocuments = async () => {
    try {
      const params = {
        ...filters,
        page: pagination.page,
        limit: 10
      };

      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key];
      });

      const response = await api.get('/documents', { params });
      setDocuments(response.data.documents);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error(isArabic ? 'خطأ في جلب المستندات' : 'Error loading documents');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const newFilters = { ...filters, [e.target.name]: e.target.value };
    setFilters(newFilters);
    setPagination({ ...pagination, page: 1 });

    const params = {};
    if (newFilters.type) params.type = newFilters.type;
    if (newFilters.status) params.status = newFilters.status;
    if (newFilters.caseId) params.caseId = newFilters.caseId;
    setSearchParams(params);
  };

  const handleDelete = async (id) => {
    if (window.confirm(isArabic ? 'هل أنت متأكد من حذف هذا المستند؟' : 'Are you sure you want to delete this document?')) {
      try {
        await api.delete(`/documents/${id}`);
        toast.success(isArabic ? 'تم حذف المستند بنجاح' : 'Document deleted successfully');
        fetchDocuments();
      } catch (error) {
        toast.error(isArabic ? 'خطأ في حذف المستند' : 'Error deleting document');
      }
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

  if (loading) {
    return <div className="loading">{t.loading}</div>;
  }

  return (
    <div className="documents-list">
      <div className="card-header">
        <h2 className="card-title">{t.allDocuments} ({pagination.total})</h2>
        <Link to="/documents/new" className="btn btn-primary">
          <FiPlus /> {t.addDocument}
        </Link>
      </div>

      <div className="search-filter">
        <div className="search-input" style={{ position: 'relative' }}>
          <input
            type="text"
            name="search"
            className="form-control"
            placeholder={t.search + '...'}
            value={filters.search}
            onChange={handleFilterChange}
            style={{ paddingRight: '2.5rem' }}
          />
          <FiSearch style={{ position: 'absolute', right: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
        </div>

        <select
          name="type"
          className="form-control"
          value={filters.type}
          onChange={handleFilterChange}
        >
          <option value="">{t.allTypes}</option>
          <option value="memo">{t.memo}</option>
          <option value="contract">{t.contract}</option>
          <option value="petition">{t.petition}</option>
          <option value="judgment">{t.judgment}</option>
          <option value="evidence">{t.evidence}</option>
          <option value="correspondence">{t.correspondence}</option>
          <option value="other">{t.other}</option>
        </select>

        <select
          name="status"
          className="form-control"
          value={filters.status}
          onChange={handleFilterChange}
        >
          <option value="">{t.allStatuses}</option>
          <option value="draft">{t.draft}</option>
          <option value="under_review">{t.under_review}</option>
          <option value="approved">{t.approved}</option>
          <option value="archived">{t.archived}</option>
        </select>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>{t.title}</th>
              <th>{t.documentType}</th>
              <th>{t.caseTitle}</th>
              <th>{t.status}</th>
              <th>{t.author}</th>
              <th>{t.createdAt}</th>
              <th>{t.actions}</th>
            </tr>
          </thead>
          <tbody>
            {documents.length > 0 ? (
              documents.map((doc) => (
                <tr key={doc.id}>
                  <td><Link to={`/documents/${doc.id}`}>{doc.title}</Link></td>
                  <td>{t[doc.type] || doc.type}</td>
                  <td>
                    {doc.case ? (
                      <Link to={`/cases/${doc.case.id}`}>{doc.case.title}</Link>
                    ) : '-'}
                  </td>
                  <td>{getStatusBadge(doc.status)}</td>
                  <td>{doc.uploader?.fullName || '-'}</td>
                  <td>
                    {doc.createdAt
                      ? format(new Date(doc.createdAt), 'dd/MM/yyyy', { locale: ar })
                      : '-'
                    }
                  </td>
                  <td>
                    <div className="actions">
                      <Link to={`/documents/${doc.id}`} className="btn btn-secondary" title={t.viewDetails}>
                        <FiEye />
                      </Link>
                      <Link to={`/documents/${doc.id}/edit`} className="btn btn-secondary" title={t.edit}>
                        <FiEdit />
                      </Link>
                      <button
                        className="btn btn-danger"
                        title={t.delete}
                        onClick={() => handleDelete(doc.id)}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="no-data">{t.noData}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pagination.pages > 1 && (
        <div className="pagination">
          <button
            className="btn btn-secondary"
            disabled={pagination.page === 1}
            onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
          >
            {t.previous}
          </button>
          <span>{t.page} {pagination.page} {t.of} {pagination.pages}</span>
          <button
            className="btn btn-secondary"
            disabled={pagination.page === pagination.pages}
            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
          >
            {t.next}
          </button>
        </div>
      )}
    </div>
  );
};

export default DocumentsList;
