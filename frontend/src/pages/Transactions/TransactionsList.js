import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiMapPin, FiSearch, FiFilter, FiPrinter, FiEye } from 'react-icons/fi';

const statusOptions = [
  { value: 'submitted', ar: 'مقدمة', en: 'Submitted', color: '#3498db' },
  { value: 'processing', ar: 'قيد المعالجة', en: 'Processing', color: '#f39c12' },
  { value: 'completed', ar: 'منجزة', en: 'Completed', color: '#2ecc71' },
  { value: 'rejected', ar: 'مرفوضة', en: 'Rejected', color: '#e74c3c' },
  { value: 'pending', ar: 'معلقة', en: 'Pending', color: '#95a5a6' },
];

const entityTypeOptions = [
  { value: 'ministry_of_justice', ar: 'وزارة العدل', en: 'Ministry of Justice' },
  { value: 'awqaf', ar: 'هيئة الأوقاف', en: 'Awqaf' },
  { value: 'general_sec', ar: 'الأمانة العامة', en: 'General Secretariat' },
  { value: 'kuwait_municipality', ar: 'البلدية', en: 'Municipality' },
  { value: 'paci', ar: 'الهيئة العامة للسكان', en: 'PACI' },
  { value: 'embassy', ar: 'السفارة', en: 'Embassy' },
  { value: 'court', ar: 'المحاكم', en: 'Courts' },
  { value: 'other', ar: 'أخرى', en: 'Other' },
];

const TransactionsList = () => {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [stats, setStats] = useState({ countByStatus: {}, countByEntity: {} });
  const [filters, setFilters] = useState({ status: '', entityType: '', search: '', page: 1 });

  useEffect(() => { fetchTransactions(); }, [filters]);
  useEffect(() => { fetchStats(); }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      params.append('limit', '20');
      const { data } = await api.get(`/transactions?${params}`);
      setTransactions(data.transactions || []);
      setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (error) {
      toast.error(isArabic ? 'خطأ في جلب المعاملات' : 'Error loading transactions');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/transactions/stats');
      setStats(data || { countByStatus: {}, countByEntity: {} });
    } catch (e) {
      console.error('Stats error:', e);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(isArabic ? 'هل أنت متأكد من حذف المعاملة؟' : 'Are you sure?')) return;
    try {
      await api.delete(`/transactions/${id}`);
      toast.success(isArabic ? 'تم الحذف بنجاح' : 'Deleted successfully');
      fetchTransactions();
      fetchStats();
    } catch (error) {
      toast.error(isArabic ? 'لا يمكن حذف المعاملة' : 'Cannot delete transaction');
    }
  };

  const getStatusBadge = (status) => {
    const opt = statusOptions.find(s => s.value === status);
    return (
      <span style={{
        display: 'inline-block', padding: '0.25rem 0.75rem', borderRadius: 20,
        fontSize: '0.8rem', fontWeight: 500, background: (opt?.color || '#95a5a6') + '18',
        color: opt?.color || '#95a5a6', border: `1px solid ${opt?.color || '#95a5a6'}30`
      }}>
        {opt?.[language] || status}
      </span>
    );
  };

  const getEntityLabel = (value) => {
    const opt = entityTypeOptions.find(e => e.value === value);
    return opt?.[language] || value || '-';
  };

  const kpi = (val, color) => ({ padding: '0.75rem 1rem', background: color + '12', borderRadius: 10, borderLeft: `4px solid ${color}`, textAlign: 'center' });
  const kpiNum = (color) => ({ fontSize: '1.4rem', fontWeight: 'bold', color, lineHeight: 1.2 });
  const kpiLabel = () => ({ fontSize: '0.78rem', color: '#666', marginTop: 2 });

  const totalTx = pagination.total || 0;
  const completedTx = stats.countByStatus?.completed || 0;
  const processingTx = stats.countByStatus?.processing || 0;
  const pendingTx = stats.countByStatus?.pending || 0;
  const rejectedTx = stats.countByStatus?.rejected || 0;
  const submittedTx = stats.countByStatus?.submitted || 0;

  return (
    <div className="page-container print-page">
      <div className="page-header no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1><FiMapPin /> {isArabic ? 'المعاملات الحكومية' : 'Government Transactions'}</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={() => window.print()}>
            <FiPrinter /> {isArabic ? 'طباعة' : 'Print'}
          </button>
          <Link to="/transactions/new" className="btn btn-primary">
            <FiPlus /> {isArabic ? 'إضافة معاملة' : 'Add Transaction'}
          </Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div style={kpi('#3498db')}>
          <div style={kpiNum('#3498db')}>{totalTx}</div>
          <div style={kpiLabel()}>{isArabic ? 'إجمالي' : 'Total'}</div>
        </div>
        <div style={kpi('#2ecc71')}>
          <div style={kpiNum('#2ecc71')}>{completedTx}</div>
          <div style={kpiLabel()}>{isArabic ? 'منجزة' : 'Completed'}</div>
        </div>
        <div style={kpi('#f39c12')}>
          <div style={kpiNum('#f39c12')}>{processingTx}</div>
          <div style={kpiLabel()}>{isArabic ? 'قيد المعالجة' : 'Processing'}</div>
        </div>
        <div style={kpi('#3498db')}>
          <div style={kpiNum('#3498db')}>{submittedTx}</div>
          <div style={kpiLabel()}>{isArabic ? 'مقدمة' : 'Submitted'}</div>
        </div>
        <div style={kpi('#95a5a6')}>
          <div style={kpiNum('#95a5a6')}>{pendingTx}</div>
          <div style={kpiLabel()}>{isArabic ? 'معلقة' : 'Pending'}</div>
        </div>
        <div style={kpi('#e74c3c')}>
          <div style={kpiNum('#e74c3c')}>{rejectedTx}</div>
          <div style={kpiLabel()}>{isArabic ? 'مرفوضة' : 'Rejected'}</div>
        </div>
      </div>

      <div className="no-print" style={{ marginBottom: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <input
            type="text"
            className="form-control"
            placeholder={isArabic ? 'بحث في العنوان أو الجهة...' : 'Search title or entity...'}
            value={filters.search}
            onChange={e => setFilters({ ...filters, search: e.target.value, page: 1 })}
            style={{ paddingRight: '2.5rem' }}
          />
          <FiSearch style={{ position: 'absolute', right: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
        </div>
        <select className="form-control" style={{ maxWidth: 180 }}
          value={filters.status}
          onChange={e => setFilters({ ...filters, status: e.target.value, page: 1 })}>
          <option value="">{isArabic ? 'جميع الحالات' : 'All Statuses'}</option>
          {statusOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt[language]}</option>
          ))}
        </select>
        <select className="form-control" style={{ maxWidth: 180 }}
          value={filters.entityType}
          onChange={e => setFilters({ ...filters, entityType: e.target.value, page: 1 })}>
          <option value="">{isArabic ? 'جميع الجهات' : 'All Entities'}</option>
          {entityTypeOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt[language]}</option>
          ))}
        </select>
        {(filters.search || filters.status || filters.entityType) && (
          <button className="btn btn-secondary btn-sm" onClick={() => setFilters({ status: '', entityType: '', search: '', page: 1 })}>
            {isArabic ? 'مسح الفلتر' : 'Clear'}
          </button>
        )}
      </div>

      <div className="card" style={{ margin: 0 }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>#</th>
                <th>{isArabic ? 'العنوان' : 'Title'}</th>
                <th>{isArabic ? 'الجهة الحكومية' : 'Entity'}</th>
                <th>{isArabic ? 'نوع الجهة' : 'Type'}</th>
                <th>{isArabic ? 'القضية' : 'Case'}</th>
                <th>{isArabic ? 'الموكل' : 'Client'}</th>
                <th>{isArabic ? 'الحالة' : 'Status'}</th>
                <th>{isArabic ? 'التقديم' : 'Submitted'}</th>
                <th>{isArabic ? 'المتوقع' : 'Expected'}</th>
                <th className="no-print">{isArabic ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="10" style={{ textAlign: 'center', padding: 30, color: '#999' }}>{isArabic ? 'جاري التحميل...' : 'Loading...'}</td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan="10" style={{ textAlign: 'center', padding: 30, color: '#999' }}>{isArabic ? 'لا توجد معاملات' : 'No transactions found'}</td></tr>
              ) : transactions.map((tx, idx) => (
                <tr key={tx.id}>
                  <td style={{ color: '#999', fontSize: '0.85rem' }}>{(pagination.page - 1) * 20 + idx + 1}</td>
                  <td style={{ fontWeight: 600 }}>{tx.title}</td>
                  <td>{tx.governmentEntity}</td>
                  <td>{getEntityLabel(tx.entityType)}</td>
                  <td>
                    {tx.case ? (
                      <Link to={`/cases/${tx.case.id}`} style={{ color: '#3182ce', fontWeight: 500 }}>
                        {tx.case.caseNumber}
                      </Link>
                    ) : <span style={{ color: '#999' }}>-</span>}
                  </td>
                  <td>{tx.client?.name || <span style={{ color: '#999' }}>-</span>}</td>
                  <td>{getStatusBadge(tx.status)}</td>
                  <td>{tx.submissionDate || '-'}</td>
                  <td>
                    {tx.expectedDate ? (
                      <span style={{ color: new Date(tx.expectedDate) < new Date() && tx.status !== 'completed' ? '#e74c3c' : '#333' }}>
                        {tx.expectedDate}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="no-print">
                    <div className="actions" style={{ display: 'flex', gap: '0.3rem' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/transactions/${tx.id}/edit`)} title={isArabic ? 'تعديل' : 'Edit'}>
                        <FiEdit2 />
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(tx.id)} title={isArabic ? 'حذف' : 'Delete'}>
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {pagination.pages > 1 && (
        <div className="pagination">
          <button className="btn btn-secondary btn-sm" disabled={pagination.page <= 1}
            onClick={() => setFilters({ ...filters, page: pagination.page - 1 })}>
            {isArabic ? 'السابق' : 'Previous'}
          </button>
          <span style={{ fontSize: '0.9rem', color: '#666' }}>
            {isArabic ? 'صفحة' : 'Page'} {pagination.page} {isArabic ? 'من' : 'of'} {pagination.pages}
          </span>
          <button className="btn btn-secondary btn-sm" disabled={pagination.page >= pagination.pages}
            onClick={() => setFilters({ ...filters, page: pagination.page + 1 })}>
            {isArabic ? 'التالي' : 'Next'}
          </button>
        </div>
      )}
    </div>
  );
};

export default TransactionsList;
