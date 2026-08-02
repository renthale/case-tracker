import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiClock, FiPlus, FiTrash2, FiPrinter, FiFilter } from 'react-icons/fi';
import './TimeTracking.css';

const TimeTracking = () => {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const isArabic = language === 'ar';
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fetchingEntries, setFetchingEntries] = useState(false);
  const [entries, setEntries] = useState([]);
  const [cases, setCases] = useState([]);
  const [stats, setStats] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({ caseId: '', startDate: '', endDate: '', billable: '' });
  const [formData, setFormData] = useState({
    caseId: '',
    date: new Date().toISOString().split('T')[0],
    hours: '',
    description: '',
    billable: true,
    rate: 0,
    category: 'general',
    notes: ''
  });

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 768px)');
    setIsMobile(mql.matches);
    const handler = (e) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [casesRes] = await Promise.all([
        api.get('/cases?limit=500'),
      ]);
      setCases(casesRes.data.cases || []);
      await fetchEntries();
      await fetchStats();
    } catch (error) {
      toast.error(isArabic ? 'خطأ في تحميل بيانات الوقت' : 'Error loading time data');
    } finally {
      setLoading(false);
    }
  };

  const fetchEntries = async (page = 1) => {
    try {
      setFetchingEntries(true);
      const params = new URLSearchParams({ page, limit: 50 });
      if (filters.caseId) params.append('caseId', filters.caseId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.billable) params.append('billable', filters.billable);

      const res = await api.get(`/time-entries?${params}`);
      setEntries(res.data.entries || []);
    } catch (error) {
      toast.error(isArabic ? 'خطأ في جلب سجلات الوقت' : 'Error fetching time entries');
    } finally {
      setFetchingEntries(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/time-entries/stats');
      setStats(res.data);
    } catch (error) {
      toast.error(isArabic ? 'خطأ في تحميل إحصائيات الوقت' : 'Error loading time stats');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/time-entries', formData);
      toast.success(isArabic ? 'تم إضافة الوقت بنجاح' : 'Time entry added successfully');
      setShowForm(false);
      setFormData({
        caseId: '',
        date: new Date().toISOString().split('T')[0],
        hours: '',
        description: '',
        billable: true,
        rate: 0,
        category: 'general',
        notes: ''
      });
      await fetchEntries();
      await fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.error || (isArabic ? 'خطأ في الإضافة' : 'Error adding entry'));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(isArabic ? 'هل أنت متأكد من الحذف؟' : 'Are you sure you want to delete?')) return;
    try {
      await api.delete(`/time-entries/${id}`);
      toast.success(isArabic ? 'تم الحذف بنجاح' : 'Deleted successfully');
      await fetchEntries();
      await fetchStats();
    } catch (error) {
      toast.error(isArabic ? 'خطأ في الحذف' : 'Error deleting');
    }
  };

  const categories = [
    { value: 'general', labelAr: 'عام', labelEn: 'General' },
    { value: 'consultation', labelAr: 'استشارة', labelEn: 'Consultation' },
    { value: 'court', labelAr: 'محكمة', labelEn: 'Court' },
    { value: 'research', labelAr: 'بحث', labelEn: 'Research' },
    { value: 'drafting', labelAr: 'إعداد', labelEn: 'Drafting' },
    { value: 'meeting', labelAr: 'اجتماع', labelEn: 'Meeting' },
    { value: 'travel', labelAr: 'سفر', labelEn: 'Travel' }
  ];

  const kpiStyle = (color) => ({ padding: '1rem 1.25rem', background: color + '12', borderRadius: 10, borderLeft: `4px solid ${color}`, textAlign: 'center' });
  const kpiNum = (color) => ({ fontSize: '1.6rem', fontWeight: 'bold', color, lineHeight: 1.2 });
  const kpiLabel = () => ({ fontSize: '0.82rem', color: '#666', marginTop: 4 });

  if (loading) return <div className="loading">{isArabic ? 'جاري التحميل...' : 'Loading...'}</div>;

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1><FiClock /> {isArabic ? 'تتبع الوقت' : 'Time Tracking'}</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <FiPlus /> {isArabic ? 'إضافة وقت' : 'Add Time Entry'}
        </button>
      </div>

      {stats && stats.summary && (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(auto-fill, minmax(150px, 1fr))' : 'repeat(auto-fill, minmax(170px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={kpiStyle('#3498db')}>
            <div style={kpiNum('#3498db')}>{stats.summary.totalHours}</div>
            <div style={kpiLabel()}>{isArabic ? 'إجمالي الساعات' : 'Total Hours'}</div>
          </div>
          <div style={kpiStyle('#2ecc71')}>
            <div style={kpiNum('#2ecc71')}>{stats.summary.billableHours}</div>
            <div style={kpiLabel()}>{isArabic ? 'ساعات قابلة للفوترة' : 'Billable Hours'}</div>
          </div>
          <div style={kpiStyle('#e74c3c')}>
            <div style={kpiNum('#e74c3c')}>{stats.summary.nonBillableHours}</div>
            <div style={kpiLabel()}>{isArabic ? 'ساعات غير قابلة' : 'Non-Billable'}</div>
          </div>
          <div style={kpiStyle('#9b59b6')}>
            <div style={kpiNum('#9b59b6')}>{stats.summary.totalAmount != null ? parseFloat(stats.summary.totalAmount).toFixed(3) : '0.000'}</div>
            <div style={kpiLabel()}>{isArabic ? 'المبلغ الإجمالي (د.ك)' : 'Total Amount (KWD)'}</div>
          </div>
          <div style={kpiStyle('#f39c12')}>
            <div style={kpiNum('#f39c12')}>{stats.summary.utilizationRate}%</div>
            <div style={kpiLabel()}>{isArabic ? 'معدل الاستغلال' : 'Utilization Rate'}</div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 className="card-title">{isArabic ? 'إضافة سجل وقت جديد' : 'Add New Time Entry'}</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
              <div className="form-group">
                <label>{isArabic ? 'القضية' : 'Case'} *</label>
                <select className="form-control" value={formData.caseId} onChange={e => setFormData({ ...formData, caseId: e.target.value })} required>
                  <option value="">{isArabic ? 'اختر القضية...' : 'Select case...'}</option>
                  {cases.map(c => (
                    <option key={c.id} value={c.id}>{c.caseNumber} - {c.title}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>{isArabic ? 'التاريخ' : 'Date'}</label>
                <input type="date" className="form-control" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
              </div>
              <div className="form-group">
                <label>{isArabic ? 'الساعات' : 'Hours'} *</label>
                <input type="number" className="form-control" step="0.25" min="0.25" max="24" value={formData.hours} onChange={e => setFormData({ ...formData, hours: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>{isArabic ? 'الفئة' : 'Category'}</label>
                <select className="form-control" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                  {categories.map(c => (
                    <option key={c.value} value={c.value}>{isArabic ? c.labelAr : c.labelEn}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>{isArabic ? 'قابل للفوترة' : 'Billable'}</label>
                <select className="form-control" value={formData.billable} onChange={e => setFormData({ ...formData, billable: e.target.value === 'true' })}>
                  <option value="true">{isArabic ? 'نعم' : 'Yes'}</option>
                  <option value="false">{isArabic ? 'لا' : 'No'}</option>
                </select>
              </div>
              <div className="form-group">
                <label>{isArabic ? 'المعدل (د.ك/ساعة)' : 'Rate (KWD/hr)'}</label>
                <input type="number" className="form-control" step="0.001" min="0" value={formData.rate} onChange={e => setFormData({ ...formData, rate: e.target.value })} />
              </div>
            </div>
            <div className="form-group" style={{ marginTop: '0.5rem' }}>
              <label>{isArabic ? 'الوصف' : 'Description'} *</label>
              <textarea className="form-control" rows="2" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>{isArabic ? 'ملاحظات' : 'Notes'}</label>
              <textarea className="form-control" rows="2" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button type="submit" className="btn btn-primary">{isArabic ? 'إضافة' : 'Add'}</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>{isArabic ? 'إلغاء' : 'Cancel'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center' }}>
          <FiFilter style={{ color: '#666' }} />
          <select className="form-control" style={{ maxWidth: isMobile ? 'none' : 200, width: isMobile ? '100%' : 'auto' }} value={filters.caseId} onChange={e => setFilters({ ...filters, caseId: e.target.value })}>
            <option value="">{isArabic ? 'جميع القضايا' : 'All Cases'}</option>
            {cases.map(c => (
              <option key={c.id} value={c.id}>{c.caseNumber}</option>
            ))}
          </select>
          <input type="date" className="form-control" style={{ maxWidth: isMobile ? 'none' : 160, width: isMobile ? '100%' : 'auto' }} value={filters.startDate} onChange={e => setFilters({ ...filters, startDate: e.target.value })} />
          <span>{isArabic ? 'إلى' : 'to'}</span>
          <input type="date" className="form-control" style={{ maxWidth: isMobile ? 'none' : 160, width: isMobile ? '100%' : 'auto' }} value={filters.endDate} onChange={e => setFilters({ ...filters, endDate: e.target.value })} />
          <button className="btn btn-primary btn-sm" onClick={() => fetchEntries(1)} style={{ width: isMobile ? '100%' : 'auto' }}>
            {isArabic ? 'بحث' : 'Search'}
          </button>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">{isArabic ? 'سجلات الوقت' : 'Time Entries'}</h3>
        {fetchingEntries && <div className="loading" style={{ padding: '1rem' }}>{isArabic ? 'جاري التحميل...' : 'Loading...'}</div>}
        {!fetchingEntries && (isMobile ? (
          <div className="tt-list">
            {entries.length > 0 ? entries.map(entry => (
              <div key={entry.id} className="tt-card" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                <div className="tt-head">
                  <span className="tt-date">{new Date(entry.date).toLocaleDateString('ar-KW')}</span>
                  <span className="tt-hours">{entry.hours} {isArabic ? 'س' : 'hrs'}</span>
                </div>
                <div className="tt-desc">{entry.description}</div>
                <div className="tt-body">
                  <div className="tt-row">
                    <span className="tt-lbl">{isArabic ? 'القضية' : 'Case'}</span>
                    <span className="tt-val">{entry.case?.caseNumber || '—'}</span>
                  </div>
                  <div className="tt-row">
                    <span className="tt-lbl">{isArabic ? 'الفئة' : 'Category'}</span>
                    <span className="tt-val">{categories.find(c => c.value === entry.category)?.[isArabic ? 'labelAr' : 'labelEn'] || entry.category}</span>
                  </div>
                  <div className="tt-row">
                    <span className="tt-lbl">{isArabic ? 'قابل للفوترة' : 'Billable'}</span>
                    <span className="tt-val" style={{ color: entry.billable ? '#059669' : '#dc2626' }}>
                      {entry.billable ? (isArabic ? 'نعم' : 'Yes') : (isArabic ? 'لا' : 'No')}
                    </span>
                  </div>
                  <div className="tt-row">
                    <span className="tt-lbl">{isArabic ? 'المعدل' : 'Rate'}</span>
                    <span className="tt-val">{entry.rate != null ? parseFloat(entry.rate).toFixed(3) : '0.000'} {isArabic ? 'د.ك' : 'KWD'}</span>
                  </div>
                  <div className="tt-row">
                    <span className="tt-lbl">{isArabic ? 'المبلغ' : 'Amount'}</span>
                    <span className="tt-val tt-amount">{entry.totalAmount != null ? parseFloat(entry.totalAmount).toFixed(3) : '0.000'} {isArabic ? 'د.ك' : 'KWD'}</span>
                  </div>
                </div>
                <div className="tt-acts">
                  {(entry.userId === user?.id || ['admin', 'partner'].includes(user?.role)) && (
                    <button className="tt-btn tt-btn-del" onClick={() => handleDelete(entry.id)}>
                      <FiTrash2 size={16} /> {isArabic ? 'حذف' : 'Delete'}
                    </button>
                  )}
                </div>
              </div>
            )) : (
              <div className="no-data">{isArabic ? 'لا توجد سجلات وقت' : 'No time entries'}</div>
            )}
          </div>
        ) : (
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table className="data-table" style={{ width: '100%', minWidth: isMobile ? '700px' : 'auto' }}>
            <thead>
              <tr>
                <th>{isArabic ? 'التاريخ' : 'Date'}</th>
                <th>{isArabic ? 'القضية' : 'Case'}</th>
                <th>{isArabic ? 'الفئة' : 'Category'}</th>
                <th>{isArabic ? 'الساعات' : 'Hours'}</th>
                <th>{isArabic ? 'الوصف' : 'Description'}</th>
                <th>{isArabic ? 'قابل للفوترة' : 'Billable'}</th>
                <th>{isArabic ? 'المعدل' : 'Rate'}</th>
                <th>{isArabic ? 'المبلغ' : 'Amount'}</th>
                <th>{isArabic ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(entry => (
                <tr key={entry.id}>
                  <td>{new Date(entry.date).toLocaleDateString('ar-KW')}</td>
                  <td>{entry.case?.caseNumber || '-'}</td>
                  <td>
                    <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: '0.8rem', background: '#f0f0f0' }}>
                      {categories.find(c => c.value === entry.category)?.[isArabic ? 'labelAr' : 'labelEn'] || entry.category}
                    </span>
                  </td>
                  <td style={{ fontWeight: 'bold' }}>{entry.hours}</td>
                  <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.description}</td>
                  <td>
                    <span style={{ color: entry.billable ? '#2ecc71' : '#e74c3c', fontWeight: 600 }}>
                      {entry.billable ? (isArabic ? 'نعم' : 'Yes') : (isArabic ? 'لا' : 'No')}
                    </span>
                  </td>
                  <td>{entry.rate != null ? parseFloat(entry.rate).toFixed(3) : '0.000'} {isArabic ? 'د.ك' : 'KWD'}</td>
                  <td style={{ fontWeight: 'bold' }}>{entry.totalAmount != null ? parseFloat(entry.totalAmount).toFixed(3) : '0.000'} {isArabic ? 'د.ك' : 'KWD'}</td>
                  <td>
                    {(entry.userId === user?.id || ['admin', 'partner'].includes(user?.role)) && (
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(entry.id)} style={{ padding: '2px 8px' }}>
                        <FiTrash2 />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {entries.length === 0 && (
                <tr><td colSpan="9" className="no-data">{isArabic ? 'لا توجد سجلات وقت' : 'No time entries'}</td></tr>
              )}
            </tbody>
          </table>
        </div>
        ))}
      </div>
    </div>
  );
};

export default TimeTracking;
