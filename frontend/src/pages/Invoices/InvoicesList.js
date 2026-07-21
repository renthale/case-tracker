import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';
import { FiPlus, FiSearch, FiEye, FiEdit, FiTrash2 } from 'react-icons/fi';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import toast from 'react-hot-toast';

const InvoicesList = () => {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
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
    fetchInvoices();
  }, [filters, pagination.page]);

  const fetchInvoices = async () => {
    try {
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
      toast.error('خطأ في جلب الفواتير');
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
    if (window.confirm('هل أنت متأكد من حذف هذه الفاتورة؟')) {
      try {
        await api.delete(`/invoices/${id}`);
        toast.success('تم حذف الفاتورة بنجاح');
        fetchInvoices();
      } catch (error) {
        toast.error('خطأ في حذف الفاتورة');
      }
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      paid: 'badge-won',
      partial: 'badge-pending',
      pending: 'badge-pending',
      overdue: 'badge-lost'
    };
    const statusLabels = {
      paid: 'مدفوع',
      partial: 'مدفوع جزئياً',
      pending: 'معلق',
      overdue: 'متأخر'
    };
    return <span className={`badge ${statusClasses[status] || ''}`}>{statusLabels[status] || t[status]}</span>;
  };

  const formatAmount = (amount) => {
    if (amount == null) return '-';
    return `${Number(amount).toFixed(3)} د.ك`;
  };

  if (loading) {
    return <div className="loading">{t.loading}</div>;
  }

  return (
    <div className="invoices-list">
      <div className="card-header">
        <h2 className="card-title">الفواتير ({pagination.total})</h2>
        <Link to="/invoices/new" className="btn btn-primary">
          <FiPlus /> إضافة فاتورة
        </Link>
      </div>

      <div className="search-filter">
        <select
          name="status"
          className="form-control"
          value={filters.status}
          onChange={handleFilterChange}
        >
          <option value="">جميع الحالات</option>
          <option value="paid">مدفوع</option>
          <option value="partial">مدفوع جزئياً</option>
          <option value="pending">معلق</option>
          <option value="overdue">متأخر</option>
        </select>

        <select
          name="type"
          className="form-control"
          value={filters.type}
          onChange={handleFilterChange}
        >
          <option value="">جميع الأنواع</option>
          <option value="consultation">رسوم استشارة</option>
          <option value="case_fees">رسوم ترافع</option>
          <option value="court_fees">رسوم جلسة</option>
          <option value="document_fees">رسوم مستندات</option>
          <option value="other">أخرى</option>
        </select>

        <div className="search-input" style={{ position: 'relative' }}>
          <input
            type="text"
            name="clientId"
            className="form-control"
            placeholder="رقم الموكل..."
            value={filters.clientId}
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
              <th>رقم الفاتورة</th>
              <th>القضية</th>
              <th>الموكل</th>
              <th>النوع</th>
              <th>المبلغ</th>
              <th>حالة الدفع</th>
              <th>تاريخ الاستحقاق</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length > 0 ? (
              invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td><Link to={`/invoices/${invoice.id}`}>{invoice.invoiceNumber || '-'}</Link></td>
                  <td>
                    {invoice.caseId ? (
                      <Link to={`/cases/${invoice.caseId}`}>{invoice.caseNumber || invoice.caseTitle || '-'}</Link>
                    ) : '-'}
                  </td>
                  <td>{invoice.clientName || '-'}</td>
                  <td>{t[invoice.type] || invoice.type}</td>
                  <td>{formatAmount(invoice.amount)}</td>
                  <td>{getStatusBadge(invoice.status)}</td>
                  <td>
                    {invoice.dueDate
                      ? format(new Date(invoice.dueDate), 'dd/MM/yyyy', { locale: ar })
                      : '-'
                    }
                  </td>
                  <td>
                    <div className="actions">
                      <Link to={`/invoices/${invoice.id}`} className="btn btn-secondary" title={t.viewDetails}>
                        <FiEye />
                      </Link>
                      <Link to={`/invoices/${invoice.id}/edit`} className="btn btn-secondary" title={t.edit}>
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

      {pagination.pages > 1 && (
        <div className="pagination">
          <button
            className="btn btn-secondary"
            disabled={pagination.page === 1}
            onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
          >
            السابق
          </button>
          <span>صفحة {pagination.page} من {pagination.pages}</span>
          <button
            className="btn btn-secondary"
            disabled={pagination.page === pagination.pages}
            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
          >
            التالي
          </button>
        </div>
      )}
    </div>
  );
};

export default InvoicesList;
