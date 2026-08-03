import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { FiPlus, FiSearch, FiEye, FiEdit, FiTrash2 } from 'react-icons/fi';
import './InvoicesList.css';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import toast from 'react-hot-toast';
import FinancialStatusBadge from '../../components/FinancialStatusBadge';

const InvoicesList = () => {
  const { t, language } = useLanguage();
  const isArabic = language === 'ar';
  const { user } = useAuth();
  const canManageFinancials = ['admin', 'partner', 'legal_secretary'].includes(user?.role);
  const [searchParams, setSearchParams] = useSearchParams();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    type: searchParams.get('type') || '',
    clientId: searchParams.get('clientId') || ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0
  });

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 768px)');
    setIsMobile(mql.matches);
    const handler = (e) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [filters, pagination.page]);

  const fetchInvoices = async () => {
    try {
      setFetchError(false);
      const params = {
        ...filters,
        page: pagination.page,
        limit: 10
      };

      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key];
      });

      const response = await api.get('/invoices', { params });
      setInvoices(response.data.invoices);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error(isArabic ? 'خطأ في جلب الفواتير' : 'Error loading invoices');
      setFetchError(true);
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
    if (newFilters.clientId) params.clientId = newFilters.clientId;
    setSearchParams(params);
  };

  const handleDelete = async (id) => {
    if (window.confirm(isArabic ? 'هل أنت متأكد من حذف هذه الفاتورة؟' : 'Are you sure you want to delete this invoice?')) {
      try {
        await api.delete(`/invoices/${id}`);
        toast.success(isArabic ? 'تم حذف الفاتورة بنجاح' : 'Invoice deleted successfully');
        fetchInvoices();
      } catch (error) {
        toast.error(isArabic ? 'خطأ في حذف الفاتورة' : 'Error deleting invoice');
      }
    }
  };

  const getStatusBadge = (status) => {
    return <FinancialStatusBadge status={status} />;
  };

  const formatAmount = (amount) => {
    if (amount == null) return '-';
    return `${Number(amount).toFixed(3)} ${t.currencyKWD || 'د.ك'}`;
  };

  if (loading) {
    return <div className="loading">{t.loading}</div>;
  }

  if (fetchError) {
    return (
      <div className="error-state" style={{ textAlign: 'center', padding: '3rem' }}>
        <p style={{ color: '#e53e3e', marginBottom: '1rem' }}>{isArabic ? 'فشل تحميل البيانات' : 'Failed to load data'}</p>
        <button className="btn btn-primary" onClick={() => { setFetchError(false); setLoading(true); fetchInvoices(); }}>
          {isArabic ? 'إعادة المحاولة' : 'Retry'}
        </button>
      </div>
    );
  }

  if (!canManageFinancials) {
    return (
      <div className="error-state" style={{ textAlign: 'center', padding: '3rem' }}>
        <p>{isArabic ? 'غير متاح لصلاحياتك' : 'Not available for your role'}</p>
      </div>
    );
  }

  return (
    <div className="invoices-list print-page">
      <div className="card-header no-print">
        <h2 className="card-title">{t.invoices} ({pagination.total})</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={() => window.print()}>
            {isArabic ? 'طباعة' : 'Print'}
          </button>
          <Link to="/dashboard/invoices/new" className="btn btn-primary">
            <FiPlus /> {t.addInvoice}
          </Link>
        </div>
      </div>

      <div className="search-filter no-print">
        <select
          name="status"
          className="form-control"
          value={filters.status}
          onChange={handleFilterChange}
        >
          <option value="">{t.allStatuses}</option>
          <option value="draft">{t.invoiceStatusDraft}</option>
          <option value="sent">{t.invoiceStatusSent}</option>
          <option value="partially_paid">{t.invoiceStatusPartiallyPaid}</option>
          <option value="paid">{t.invoiceStatusPaid}</option>
          <option value="overdue">{t.invoiceStatusOverdue}</option>
          <option value="cancelled">{t.invoiceStatusCancelled}</option>
        </select>

        <select
          name="type"
          className="form-control"
          value={filters.type}
          onChange={handleFilterChange}
        >
          <option value="">{t.allTypes}</option>
          <option value="consultation">{t.consultation}</option>
          <option value="case_fees">{t.case_fees}</option>
          <option value="court_fees">{t.court_fees}</option>
          <option value="document_fees">{t.document_fees}</option>
          <option value="other">{t.other}</option>
        </select>

        <div className="search-input" style={{ position: 'relative' }}>
          <input
            type="text"
            name="clientId"
            className="form-control"
            placeholder={isArabic ? 'رقم الموكل...' : 'Client number...'}
            value={filters.clientId}
            onChange={handleFilterChange}
            style={{ paddingRight: '2.5rem' }}
          />
          <FiSearch style={{ position: 'absolute', right: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
        </div>
      </div>

      {isMobile ? (
        <div className="inv-list">
          {invoices.length > 0 ? invoices.map((invoice) => (
            <div key={invoice.id} className="inv-card" dir={language === 'ar' ? 'rtl' : 'ltr'}>
              <div className="inv-head">
                <Link to={`/dashboard/invoices/${invoice.id}`} className="inv-num">{invoice.invoiceNumber || '—'}</Link>
                {getStatusBadge(invoice.status)}
              </div>

              <div className="inv-client">{invoice.client?.name || '—'}</div>

              <div className="inv-highlight">
                <div className="inv-amount">{formatAmount(invoice.totalAmount)}</div>
                <div className="inv-due">
                  {invoice.dueDate
                    ? format(new Date(invoice.dueDate), 'dd/MM/yyyy', { locale: ar })
                    : '—'}
                </div>
              </div>

              <div className="inv-body">
                <div className="inv-row">
                  <span className="inv-lbl">{t.invoiceType}</span>
                  <span className="inv-val">{t[invoice.type] || invoice.type}</span>
                </div>
                <div className="inv-row">
                  <span className="inv-lbl">{t.cases}</span>
                  <span className="inv-val">
                    {invoice.caseId ? (
                      <Link to={`/dashboard/cases/${invoice.caseId}`}>{invoice.case?.caseNumber || invoice.case?.title || '—'}</Link>
                    ) : '—'}
                  </span>
                </div>
              </div>

              <div className="inv-acts">
                <Link to={`/dashboard/invoices/${invoice.id}`} className="inv-btn inv-btn-primary">
                  <FiEye size={16} /> {t.viewDetails}
                </Link>
                <Link to={`/dashboard/invoices/${invoice.id}/edit`} className="inv-btn">
                  <FiEdit size={16} /> {t.edit}
                </Link>
                <button className="inv-btn inv-btn-del" onClick={() => handleDelete(invoice.id)}>
                  <FiTrash2 size={16} /> {t.delete}
                </button>
              </div>
            </div>
          )) : (
            <div className="no-data">{t.noData}</div>
          )}
        </div>
      ) : (
      <div className="table-container">
        <table className="no-card invoices-table">
          <thead>
            <tr>
              <th>{t.invoiceNumber}</th>
              <th>{t.cases}</th>
              <th>{t.clientName}</th>
              <th>{t.invoiceType}</th>
              <th>{t.amount}</th>
              <th>{t.status}</th>
              <th>{t.dueDate}</th>
              <th className="no-print">{t.actions}</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length > 0 ? (
              invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td><Link to={`/dashboard/invoices/${invoice.id}`}>{invoice.invoiceNumber || '-'}</Link></td>
                  <td>
                    {invoice.caseId ? (
                      <Link to={`/dashboard/cases/${invoice.caseId}`}>{invoice.case?.caseNumber || invoice.case?.title || '-'}</Link>
                    ) : '-'}
                  </td>
                  <td>{invoice.client?.name || '-'}</td>
                  <td>{t[invoice.type] || invoice.type}</td>
                  <td>{formatAmount(invoice.totalAmount)}</td>
                  <td>{getStatusBadge(invoice.status)}</td>
                  <td>
                    {invoice.dueDate
                      ? format(new Date(invoice.dueDate), 'dd/MM/yyyy', { locale: ar })
                      : '-'
                    }
                  </td>
                  <td>
                    <div className="actions no-print">
                      <Link to={`/dashboard/invoices/${invoice.id}`} className="btn btn-secondary" title={t.viewDetails}>
                        <FiEye />
                      </Link>
                      <Link to={`/dashboard/invoices/${invoice.id}/edit`} className="btn btn-secondary" title={t.edit}>
                        <FiEdit />
                      </Link>
                      <button
                        className="btn btn-danger"
                        title={t.delete}
                        onClick={() => handleDelete(invoice.id)}
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

export default InvoicesList;
