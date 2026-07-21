import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';
import { FiPlus, FiSearch, FiEye, FiEdit, FiTrash2 } from 'react-icons/fi';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import toast from 'react-hot-toast';

const TransactionsList = () => {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    type: searchParams.get('type') || ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0
  });

  useEffect(() => {
    fetchTransactions();
  }, [filters, pagination.page]);

  const fetchTransactions = async () => {
    try {
      const params = {
        ...filters,
        page: pagination.page,
        limit: 10
      };

      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key];
      });

      const response = await api.get('/transactions', { params });
      setTransactions(response.data.transactions);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error('خطأ في جلب المعاملات');
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
    setSearchParams(params);
  };

  const handleDelete = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذه المعاملة؟')) {
      try {
        await api.delete(`/transactions/${id}`);
        toast.success('تم حذف المعاملة بنجاح');
        fetchTransactions();
      } catch (error) {
        toast.error('خطأ في حذف المعاملة');
      }
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      pending: 'badge-pending',
      completed: 'badge-won',
      cancelled: 'badge-lost'
    };
    return <span className={`badge ${statusClasses[status] || ''}`}>{t[status] || status}</span>;
  };

  const getTypeBadge = (type) => {
    return (
      <span className={`badge ${type === 'income' ? 'badge-won' : 'badge-lost'}`}>
        {type === 'income' ? (t.income || 'إيراد') : (t.expense || 'مصروف')}
      </span>
    );
  };

  if (loading) {
    return <div className="loading">{t.loading}</div>;
  }

  return (
    <div className="transactions-list">
      <div className="card-header">
        <h2 className="card-title">{t.allTransactions || 'جميع المعاملات'} ({pagination.total})</h2>
        <Link to="/transactions/new" className="btn btn-primary">
          <FiPlus /> {t.addTransaction || 'إضافة معاملة'}
        </Link>
      </div>

      <div className="search-filter">
        <select
          name="type"
          className="form-control"
          value={filters.type}
          onChange={handleFilterChange}
        >
          <option value="">جميع الأنواع</option>
          <option value="income">{t.income || 'إيراد'}</option>
          <option value="expense">{t.expense || 'مصروف'}</option>
        </select>

        <select
          name="status"
          className="form-control"
          value={filters.status}
          onChange={handleFilterChange}
        >
          <option value="">جميع الحالات</option>
          <option value="pending">{t.pending}</option>
          <option value="completed">{t.completed}</option>
          <option value="cancelled">{t.cancelled || 'ملغي'}</option>
        </select>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>{t.type || 'النوع'}</th>
              <th>{t.amount || 'المبلغ'}</th>
              <th>{t.description || 'الوصف'}</th>
              <th>{t.category || 'الفئة'}</th>
              <th>{t.caseTitle || 'القضية'}</th>
              <th>{t.clientName || 'العميل'}</th>
              <th>{t.status || 'الحالة'}</th>
              <th>{t.date || 'التاريخ'}</th>
              <th>{t.actions || 'إجراءات'}</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length > 0 ? (
              transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td>{getTypeBadge(transaction.type)}</td>
                  <td>{Number(transaction.amount).toFixed(3)} {t.currency || 'د.ك'}</td>
                  <td>{transaction.description || '-'}</td>
                  <td>{transaction.category || '-'}</td>
                  <td>
                    {transaction.case ? (
                      <Link to={`/cases/${transaction.case.id}`}>{transaction.case.title}</Link>
                    ) : '-'}
                  </td>
                  <td>{transaction.client?.name || '-'}</td>
                  <td>{getStatusBadge(transaction.status)}</td>
                  <td>
                    {transaction.createdAt
                      ? format(new Date(transaction.createdAt), 'dd/MM/yyyy', { locale: ar })
                      : '-'
                    }
                  </td>
                  <td>
                    <div className="actions">
                      <Link to={`/transactions/${transaction.id}`} className="btn btn-secondary" title={t.viewDetails}>
                        <FiEye />
                      </Link>
                      <Link to={`/transactions/${transaction.id}/edit`} className="btn btn-secondary" title={t.edit}>
                        <FiEdit />
                      </Link>
                      <button
                        className="btn btn-danger"
                        title={t.delete}
                        onClick={() => handleDelete(transaction.id)}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="no-data">{t.noData}</td>
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
            {t.previous || 'السابق'}
          </button>
          <span>{t.page || 'صفحة'} {pagination.page} {t.of || 'من'} {pagination.pages}</span>
          <button
            className="btn btn-secondary"
            disabled={pagination.page === pagination.pages}
            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
          >
            {t.next || 'التالي'}
          </button>
        </div>
      )}
    </div>
  );
};

export default TransactionsList;
