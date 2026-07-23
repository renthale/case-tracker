import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';
import { FiPlus, FiSearch, FiEye, FiEdit, FiTrash2 } from 'react-icons/fi';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import toast from 'react-hot-toast';

const ClientsList = () => {
  const { t, language } = useLanguage();
  const isArabic = language === 'ar';
  const [searchParams, setSearchParams] = useSearchParams();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0
  });

  useEffect(() => {
    fetchClients();
  }, [filters, pagination.page]);

  const fetchClients = async () => {
    try {
      const params = {
        search: filters.search,
        page: pagination.page,
        limit: 10
      };

      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key];
      });

      const response = await api.get('/clients', { params });
      setClients(response.data.clients);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error(isArabic ? 'خطأ في جلب العملاء' : 'Error loading clients');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const newFilters = { ...filters, [e.target.name]: e.target.value };
    setFilters(newFilters);
    setPagination({ ...pagination, page: 1 });

    const params = {};
    if (newFilters.search) params.search = newFilters.search;
    setSearchParams(params);
  };

  const handleDelete = async (id) => {
    if (window.confirm(isArabic ? 'هل أنت متأكد من حذف هذا العميل؟' : 'Are you sure you want to delete this client?')) {
      try {
        await api.delete(`/clients/${id}`);
        toast.success(isArabic ? 'تم حذف العميل بنجاح' : 'Client deleted successfully');
        fetchClients();
      } catch (error) {
        toast.error(error.response?.data?.error || (isArabic ? 'خطأ في حذف العميل' : 'Error deleting client'));
      }
    }
  };

  if (loading) {
    return <div className="loading">{t.loading}</div>;
  }

  return (
    <div className="clients-list print-page">
      <div className="card-header no-print">
        <h2 className="card-title">{t.allClients} ({pagination.total})</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={() => window.print()}>
            {isArabic ? 'طباعة' : 'Print'}
          </button>
          <Link to="/clients/new" className="btn btn-primary">
            <FiPlus /> {t.addClient}
          </Link>
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
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>{t.clientName}</th>
              <th>{t.civilId}</th>
              <th>{t.phone}</th>
              <th>{t.email}</th>
              <th>{t.casesCount}</th>
              <th>{t.registrationDate}</th>
              <th className="no-print">{t.actions}</th>
            </tr>
          </thead>
          <tbody>
            {clients.length > 0 ? (
              clients.map((client) => (
                <tr key={client.id}>
                  <td><Link to={`/clients/${client.id}`}>{client.name}</Link></td>
                  <td>{client.civilId || '-'}</td>
                  <td>{client.phone || '-'}</td>
                  <td>{client.email || '-'}</td>
                  <td>{client.casesCount ?? client.cases?.length ?? 0}</td>
                  <td>
                    {client.createdAt
                      ? format(new Date(client.createdAt), 'dd/MM/yyyy', { locale: ar })
                      : '-'
                    }
                  </td>
                  <td>
                    <div className="actions no-print">
                      <Link to={`/clients/${client.id}`} className="btn btn-secondary" title={t.viewDetails}>
                        <FiEye />
                      </Link>
                      <Link to={`/clients/${client.id}/edit`} className="btn btn-secondary" title={t.edit}>
                        <FiEdit />
                      </Link>
                      <button
                        className="btn btn-danger"
                        title={t.delete}
                        onClick={() => handleDelete(client.id)}
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

export default ClientsList;
