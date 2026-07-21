import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiMapPin } from 'react-icons/fi';

const statusColors = {
  submitted: 'info',
  processing: 'warning',
  completed: 'success',
  rejected: 'danger',
  pending: 'muted'
};

const statusLabels = {
  submitted: { ar: 'مقدمة', en: 'Submitted' },
  processing: { ar: 'قيد المعالجة', en: 'Processing' },
  completed: { ar: 'منجزة', en: 'Completed' },
  rejected: { ar: 'مرفوضة', en: 'Rejected' },
  pending: { ar: 'معلقة', en: 'Pending' }
};

const TransactionsList = () => {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({ status: '', entityType: '', search: '', page: 1 });

  useEffect(() => { fetchTransactions(); }, [filters]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      const { data } = await api.get(`/transactions?${params}`);
      setTransactions(data.transactions || []);
      setPagination(data.pagination || {});
    } catch (error) {
      toast.error(isArabic ? 'خطأ في جلب المعاملات' : 'Error loading transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(isArabic ? 'هل أنت متأكد من حذف المعاملة؟' : 'Are you sure?')) return;
    try {
      await api.delete(`/transactions/${id}`);
      toast.success(isArabic ? 'تم الحذف بنجاح' : 'Deleted successfully');
      fetchTransactions();
    } catch (error) {
      toast.error(isArabic ? 'لا يمكن حذف المعاملة' : 'Cannot delete transaction');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1><FiMapPin /> {isArabic ? 'المعاملات الحكومية' : 'Government Transactions'}</h1>
        <Link to="/transactions/new" className="btn btn-primary">
          <FiPlus /> {isArabic ? 'إضافة معاملة' : 'Add Transaction'}
        </Link>
      </div>

      <div className="filters-bar">
        <input type="text" placeholder={isArabic ? 'بحث...' : 'Search...'}
          value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value, page: 1 })} />
        <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value, page: 1 })}>
          <option value="">{isArabic ? 'جميع الحالات' : 'All Statuses'}</option>
          {Object.entries(statusLabels).map(([key, label]) => (
            <option key={key} value={key}>{label[language]}</option>
          ))}
        </select>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>{isArabic ? 'العنوان' : 'Title'}</th>
              <th>{isArabic ? 'الجهة' : 'Entity'}</th>
              <th>{isArabic ? 'الحالة' : 'Status'}</th>
              <th>{isArabic ? 'التاريخ' : 'Date'}</th>
              <th>{isArabic ? 'إجراءات' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" className="loading-cell">{isArabic ? 'جاري التحميل...' : 'Loading...'}</td></tr>
            ) : transactions.length === 0 ? (
              <tr><td colSpan="5" className="empty-cell">{isArabic ? 'لا توجد معاملات' : 'No transactions'}</td></tr>
            ) : transactions.map(tx => (
              <tr key={tx.id}>
                <td>{tx.title}</td>
                <td>{tx.governmentEntity}</td>
                <td>
                  <span className={`status-badge status-${statusColors[tx.status] || 'muted'}`}>
                    {statusLabels[tx.status]?.[language] || tx.status}
                  </span>
                </td>
                <td>{tx.submissionDate || '-'}</td>
                <td>
                  <button className="btn-icon" onClick={() => navigate(`/transactions/${tx.id}/edit`)}>
                    <FiEdit2 />
                  </button>
                  <button className="btn-icon btn-danger" onClick={() => handleDelete(tx.id)}>
                    <FiTrash2 />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination.pages > 1 && (
        <div className="pagination">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(page => (
            <button key={page} className={`btn-page ${page === filters.page ? 'active' : ''}`}
              onClick={() => setFilters({ ...filters, page })}>
              {page}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default TransactionsList;
