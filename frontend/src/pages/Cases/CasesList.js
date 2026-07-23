import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { FiPlus, FiSearch, FiEye, FiEdit, FiTrash2, FiCalendar, FiCheckCircle, FiClock, FiXCircle, FiFileText } from 'react-icons/fi';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import toast from 'react-hot-toast';

const CasesList = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const isArabic = language === 'ar';
  const isCourtAgent = user?.role === 'court_agent';
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingCase, setUpdatingCase] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    status: searchParams.get('status') || '',
    type: searchParams.get('type') || '',
    priority: searchParams.get('priority') || ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0
  });

  useEffect(() => {
    fetchCases();
  }, [filters, pagination.page]);

  const fetchCases = async () => {
    try {
      const params = {
        ...filters,
        page: pagination.page,
        limit: 10
      };
      
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key];
      });
      
      const response = await api.get('/cases', { params });
      setCases(response.data.cases);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error(t.errorFetchingCase || 'خطأ في جلب القضايا');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const newFilters = { ...filters, [e.target.name]: e.target.value };
    setFilters(newFilters);
    setPagination({ ...pagination, page: 1 });

    const params = {};
    if (newFilters.status) params.status = newFilters.status;
    if (newFilters.type) params.type = newFilters.type;
    if (newFilters.priority) params.priority = newFilters.priority;
    setSearchParams(params);
  };

  const handleDelete = async (id) => {
    if (window.confirm(isArabic ? 'هل أنت متأكد من حذف هذه القضية؟' : 'Are you sure you want to delete this case?')) {
      try {
        await api.delete(`/cases/${id}`);
        toast.success(isArabic ? 'تم حذف القضية بنجاح' : 'Case deleted successfully');
        fetchCases();
      } catch (error) {
        toast.error(isArabic ? 'خطأ في حذف القضية' : 'Error deleting case');
      }
    }
  };

  const handleStatusUpdate = async (caseId, newStatus) => {
    setUpdatingCase(caseId);
    try {
      await api.put(`/cases/${caseId}`, { status: newStatus });
      toast.success(isArabic ? 'تم تحديث حالة القضية' : 'Case status updated');
      setCases(cases.map(c => c.id === caseId ? { ...c, status: newStatus } : c));
    } catch (error) {
      toast.error(isArabic ? 'خطأ في التحديث' : 'Update error');
    } finally {
      setUpdatingCase(null);
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      active: 'badge-active',
      pending: 'badge-pending',
      closed: 'badge-closed',
      won: 'badge-won',
      lost: 'badge-lost',
      settled: 'badge-settled',
      appeal: 'badge-appeal'
    };
    return <span className={`badge ${statusClasses[status] || ''}`}>{t[status]}</span>;
  };

  if (loading) {
    return <div className="loading">{t.loading}</div>;
  }

  return (
    <div className="cases-list print-page">
      <div className="card-header no-print">
        <h2 className="card-title">
          {isCourtAgent
            ? (isArabic ? 'قضايا المنتسبة إلي' : 'My Assigned Cases')
            : t.allCases} ({pagination.total})
        </h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={() => window.print()}>
            {isArabic ? 'طباعة' : 'Print'}
          </button>
          {!isCourtAgent && (
            <Link to="/cases/new" className="btn btn-primary">
              <FiPlus /> {t.addCase}
            </Link>
          )}
        </div>
      </div>

      <div className="search-filter no-print">
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
          name="status"
          className="form-control"
          value={filters.status}
          onChange={handleFilterChange}
        >
          <option value="">{t.allStatuses || 'جميع الحالات'}</option>
          <option value="active">{t.active}</option>
          <option value="pending">{t.pending}</option>
          <option value="closed">{t.closed}</option>
          <option value="won">{t.won}</option>
          <option value="lost">{t.lost}</option>
          <option value="settled">{t.settled}</option>
          <option value="appeal">{t.appeal}</option>
        </select>
        
        <select
          name="type"
          className="form-control"
          value={filters.type}
          onChange={handleFilterChange}
        >
          <option value="">{t.allTypes || 'جميع الأنواع'}</option>
          <option value="civil">{t.civil}</option>
          <option value="criminal">{t.criminal}</option>
          <option value="commercial">{t.commercial}</option>
          <option value="administrative">{t.administrative}</option>
          <option value="family">{t.family}</option>
          <option value="labor">{t.labor}</option>
          <option value="sharia">{t.sharia}</option>
          <option value="traffic">{t.traffic}</option>
          <option value="other">{t.other}</option>
        </select>
        
        <select
          name="priority"
          className="form-control"
          value={filters.priority}
          onChange={handleFilterChange}
        >
          <option value="">{t.allPriorities || 'جميع الأولويات'}</option>
          <option value="low">{t.low}</option>
          <option value="medium">{t.medium}</option>
          <option value="high">{t.high}</option>
          <option value="urgent">{t.urgent}</option>
        </select>
      </div>

      {isCourtAgent ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem' }}>
          {cases.length > 0 ? cases.map((caseItem) => (
            <div
              key={caseItem.id}
              className="card"
              style={{ margin: 0, borderLeft: '4px solid #1976d2' }}
            >
              <div
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/cases/${caseItem.id}`)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#1a365d' }}>{caseItem.caseNumber}</div>
                    <div style={{ fontSize: '0.95rem', marginTop: '0.25rem' }}>{caseItem.title}</div>
                  </div>
                  {getStatusBadge(caseItem.status)}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.85rem', color: '#666', marginBottom: '0.75rem' }}>
                  <div><span style={{ color: '#999' }}>{t.caseType}:</span> {t[caseItem.type]}</div>
                  <div><span style={{ color: '#999' }}>{t.clientName}:</span> {caseItem.clientName || '-'}</div>
                  <div>
                    <FiCalendar /> <span style={{ color: '#999' }}>{t.nextHearing}:</span>{' '}
                    {caseItem.nextHearingDate
                      ? format(new Date(caseItem.nextHearingDate), 'dd/MM/yyyy', { locale: ar })
                      : (isArabic ? 'غير محدد' : 'Not set')}
                  </div>
                  <div><span style={{ color: '#999' }}>{t.casePriority}:</span> {t[caseItem.priority]}</div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #eee', paddingTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => navigate(`/cases/${caseItem.id}`)}
                  title={t.viewDetails}
                >
                  <FiEye /> {isArabic ? 'عرض' : 'View'}
                </button>

                {caseItem.status !== 'closed' && caseItem.status !== 'won' && caseItem.status !== 'lost' && (
                  <>
                    <button
                      className="btn btn-primary btn-sm"
                      disabled={updatingCase === caseItem.id}
                      onClick={() => handleStatusUpdate(caseItem.id, 'closed')}
                    >
                      <FiCheckCircle /> {isArabic ? 'إغلاق' : 'Close'}
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      disabled={updatingCase === caseItem.id}
                      onClick={() => handleStatusUpdate(caseItem.id, 'pending')}
                    >
                      <FiClock /> {isArabic ? 'تأجيل' : 'Postpone'}
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      disabled={updatingCase === caseItem.id}
                      onClick={() => handleStatusUpdate(caseItem.id, 'won')}
                    >
                      <FiCheckCircle /> {isArabic ? 'فوز' : 'Won'}
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      disabled={updatingCase === caseItem.id}
                      onClick={() => handleStatusUpdate(caseItem.id, 'lost')}
                    >
                      <FiXCircle /> {isArabic ? 'خسارة' : 'Lost'}
                    </button>
                  </>
                )}
              </div>
            </div>
          )) : (
            <div className="no-data" style={{ gridColumn: '1 / -1' }}>{t.noData}</div>
          )}
        </div>
      ) : (
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>{t.caseNumber}</th>
              <th>{t.caseTitle}</th>
              <th>{t.caseType}</th>
              <th>{t.caseStatus}</th>
              <th>{t.casePriority}</th>
              <th>{t.clientName}</th>
              <th>{t.nextHearing}</th>
              <th className="no-print">{t.actions}</th>
            </tr>
          </thead>
          <tbody>
            {cases.length > 0 ? (
              cases.map((caseItem) => (
                <tr key={caseItem.id}>
                  <td><Link to={`/cases/${caseItem.id}`}>{caseItem.caseNumber || '-'}</Link></td>
                  <td><Link to={`/cases/${caseItem.id}`}>{caseItem.title}</Link></td>
                  <td>{t[caseItem.type]}</td>
                  <td>{getStatusBadge(caseItem.status)}</td>
                  <td>{t[caseItem.priority]}</td>
                  <td>{caseItem.clientName || '-'}</td>
                  <td>
                    {caseItem.nextHearingDate 
                      ? format(new Date(caseItem.nextHearingDate), 'dd/MM/yyyy', { locale: ar })
                      : '-'
                    }
                  </td>
                  <td>
                    <div className="actions no-print">
                      <Link to={`/cases/${caseItem.id}`} className="btn btn-secondary" title={t.viewDetails}>
                        <FiEye />
                      </Link>
                      <Link to={`/cases/${caseItem.id}/edit`} className="btn btn-secondary" title={t.edit}>
                        <FiEdit />
                      </Link>
                      <button 
                        className="btn btn-danger" 
                        title={t.delete}
                        onClick={() => handleDelete(caseItem.id)}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="no-data">{t.noData}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      )}

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

export default CasesList;
