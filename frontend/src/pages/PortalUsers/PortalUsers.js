import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiUserPlus, FiToggleLeft, FiToggleRight, FiTrash2, FiMail, FiRefreshCw, FiLink } from 'react-icons/fi';
import './PortalUsers.css';

const PortalUsers = () => {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const [portalUsers, setPortalUsers] = useState([]);
  const [availableClients, setAvailableClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 768px)');
    setIsMobile(mql.matches);
    const handler = (e) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ clientId: '', email: '' });
  const [busyId, setBusyId] = useState(null);

  useEffect(() => { fetchData(); }, []);

  const L = (en, ar) => (isArabic ? ar : en);

  const fetchData = async () => {
    try {
      setFetchError(false);
      const [usersRes, clientsRes] = await Promise.all([
        api.get('/api/portal/admin/list'),
        api.get('/api/portal/admin/available-clients')
      ]);
      setPortalUsers(usersRes.data.portalUsers || []);
      setAvailableClients(clientsRes.data.clients || []);
    } catch (error) {
      toast.error(L('Error loading data', 'فشل تحميل البيانات'));
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  };

  const showLinkToast = (link, label) => {
    toast.success(
      () => (
        <div>
          <div style={{ marginBottom: '0.35rem' }}>{label}</div>
          <code className="invite-link-box" style={{ display: 'block', wordBreak: 'break-all', background: '#edf2f7', padding: '0.5rem', borderRadius: '4px', fontSize: '0.8rem' }}>{link}</code>
        </div>
      ),
      { duration: 30000 }
    );
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/api/portal/admin/invite', form);
      if (res.data.invitationLink) {
        showLinkToast(res.data.invitationLink, L('Invitation link (single use):', 'رابط الدعوة (استخدام واحد):'));
      } else {
        toast.success(L('Invitation sent', 'تم إرسال الدعوة'));
      }
      setShowCreate(false);
      setForm({ clientId: '', email: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || L('Error sending invitation', 'خطأ في إرسال الدعوة'));
    }
  };

  const handleResendInvitation = async (pu) => {
    setBusyId(pu.id);
    try {
      const res = await api.post(`/api/portal/admin/resend-invitation/${pu.client?.id}`);
      if (res.data.invitationLink) {
        showLinkToast(res.data.invitationLink, L('Invitation link (single use):', 'رابط الدعوة (استخدام واحد):'));
      } else {
        toast.success(res.data.message || L('Invitation resent', 'تم إعادة إرسال الدعوة'));
      }
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || L('Failed to resend', 'فشل إعادة الإرسال'));
    } finally {
      setBusyId(null);
    }
  };

  const handleResetLink = async (pu) => {
    setBusyId(pu.id);
    try {
      const res = await api.post(`/api/portal/admin/${pu.id}/generate-reset-link`);
      showLinkToast(res.data.resetUrl, L('Password reset link (single use):', 'رابط إعادة تعيين كلمة المرور (استخدام واحد):'));
    } catch (error) {
      toast.error(error.response?.data?.error || L('Failed to generate link', 'فشل إنشاء الرابط'));
    } finally {
      setBusyId(null);
    }
  };

  const handleToggle = async (id) => {
    try {
      const res = await api.put(`/api/portal/admin/${id}/toggle`);
      toast.success(res.data.message);
      fetchData();
    } catch (error) {
      toast.error(L('Error toggling account', 'خطأ في تحديث الحساب'));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(L('Delete this portal account?', 'حذف هذا الحساب؟'))) return;
    try {
      await api.delete(`/api/portal/admin/${id}`);
      toast.success(L('Account deleted', 'تم حذف الحساب'));
      fetchData();
    } catch (error) {
      toast.error(L('Error deleting account', 'خطأ في حذف الحساب'));
    }
  };

  const statusBadge = (pu) => {
    if (pu.status === 'disabled') {
      return { text: L('Disabled', 'معطل'), bg: '#f8d7da', color: '#721c24' };
    }
    if (pu.status === 'invited') {
      return { text: L('Invitation pending', 'بانتظار التفعيل'), bg: '#fff3cd', color: '#856404' };
    }
    return { text: L('Active', 'نشط'), bg: '#d4edda', color: '#155724' };
  };

  const formatDate = (value) =>
    value ? new Date(value).toLocaleString() : '—';

  if (loading) return <div className="loading">Loading...</div>;

  if (fetchError) {
    return (
      <div className="error-state" style={{ textAlign: 'center', padding: '3rem' }}>
        <p style={{ color: '#e53e3e', marginBottom: '1rem' }}>{isArabic ? 'فشل تحميل البيانات' : 'Failed to load data'}</p>
        <button className="btn btn-primary" onClick={() => { setFetchError(false); setLoading(true); fetchData(); }}>
          {isArabic ? 'إعادة المحاولة' : 'Retry'}
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '0' }}>
      <div className="card-header">
        <h2 className="card-title">{L('Client Portal Users', 'مستخدمي بوابة العميل')} ({portalUsers.length})</h2>
        <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>
          <FiUserPlus /> {L('Invite Client', 'دعوة عميل')}
        </button>
      </div>

      {showCreate && (
        <div style={{ background: '#f8f9fa', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>{L('Invite a client to the portal', 'دعوة عميل للبوابة')}</h3>
          <form onSubmit={handleInvite} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>{L('Client', 'العميل')}</label>
              <select className="form-control" value={form.clientId} onChange={e => setForm({...form, clientId: e.target.value})} required>
                <option value="">{L('Select client...', 'اختر العميل...')}</option>
                {availableClients.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.email || c.phone})</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>{L('Portal Email', 'بريد الدخول')}</label>
              <input type="email" className="form-control" placeholder="client@email.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="btn btn-primary"><FiMail /> {L('Send Invitation', 'إرسال الدعوة')}</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>{L('Cancel', 'إلغاء')}</button>
            </div>
          </form>
        </div>
      )}

      {isMobile ? (
        <div className="pu-list">
          {portalUsers.length > 0 ? portalUsers.map(pu => {
            const badge = statusBadge(pu);
            return (
              <div key={pu.id} className="pu-card" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                <div className="pu-head">
                  <span className="pu-name">{pu.client?.name || 'N/A'}</span>
                  <span className="pu-badge" style={{ background: badge.bg, color: badge.color }}>
                    {badge.text}
                  </span>
                </div>
                <div className="pu-body">
                  <div className="pu-row">
                    <span className="pu-lbl">{L('Email', 'البريد')}</span>
                    <span className="pu-val">{pu.client?.email || '-'}</span>
                  </div>
                  <div className="pu-row">
                    <span className="pu-lbl">{L('Portal Email', 'بريد الدخول')}</span>
                    <span className="pu-val">{pu.email}</span>
                  </div>
                  <div className="pu-row">
                    <span className="pu-lbl">{L('Last Login', 'آخر دخول')}</span>
                    <span className="pu-val">{pu.lastLogin ? new Date(pu.lastLogin).toLocaleString() : L('Never', 'أبداً')}</span>
                  </div>
                  {pu.invitationSentAt && (
                    <div className="pu-row">
                      <span className="pu-lbl">{L('Invited', 'الدعوة')}</span>
                      <span className="pu-val">{formatDate(pu.invitationSentAt)}</span>
                    </div>
                  )}
                </div>
                <div className="pu-acts">
                  {pu.status === 'invited' && (
                    <button className="pu-btn" disabled={busyId === pu.id} onClick={() => handleResendInvitation(pu)}>
                      <FiRefreshCw size={16} /> {L('Resend', 'إعادة إرسال')}
                    </button>
                  )}
                  {pu.status !== 'invited' && (
                    <button className="pu-btn" disabled={busyId === pu.id} onClick={() => handleResetLink(pu)}>
                      <FiLink size={16} /> {L('Reset Link', 'رابط إعادة التعيين')}
                    </button>
                  )}
                  <button className="pu-btn" onClick={() => handleToggle(pu.id)}>
                    {pu.isActive ? <FiToggleRight size={16} /> : <FiToggleLeft size={16} />}
                    {pu.isActive ? L('Disable', 'تعطيل') : L('Enable', 'تفعيل')}
                  </button>
                  <button className="pu-btn pu-btn-del" onClick={() => handleDelete(pu.id)}>
                    <FiTrash2 size={16} /> {L('Delete', 'حذف')}
                  </button>
                </div>
              </div>
            );
          }) : (
            <div className="no-data">{L('No portal users found', 'لا يوجد مستخدمون للبوابة')}</div>
          )}
        </div>
      ) : (
      <div className="table-container">
        <table className="portal-users-table">
          <thead>
            <tr>
              <th>{L('Client Name', 'اسم العميل')}</th>
              <th>{L('Email', 'البريد')}</th>
              <th>{L('Portal Email', 'بريد الدخول')}</th>
              <th>{L('Status', 'الحالة')}</th>
              <th>{L('Invited', 'الدعوة')}</th>
              <th>{L('Last Login', 'آخر دخول')}</th>
              <th>{L('Actions', 'إجراءات')}</th>
            </tr>
          </thead>
          <tbody>
            {portalUsers.map(pu => {
              const badge = statusBadge(pu);
              return (
                <tr key={pu.id}>
                  <td><strong>{pu.client?.name || 'N/A'}</strong></td>
                  <td>{pu.client?.email || '-'}</td>
                  <td>{pu.email}</td>
                  <td>
                    <span style={{
                      padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '600',
                      background: badge.bg, color: badge.color
                    }}>
                      {badge.text}
                    </span>
                  </td>
                  <td>{pu.invitationSentAt ? formatDate(pu.invitationSentAt) : '—'}</td>
                  <td>{pu.lastLogin ? formatDate(pu.lastLogin) : L('Never', 'أبداً')}</td>
                  <td>
                    <div className="actions">
                      {pu.status === 'invited' && (
                        <button className="btn btn-secondary" title={L('Resend Invitation', 'إعادة إرسال الدعوة')} disabled={busyId === pu.id} onClick={() => handleResendInvitation(pu)}>
                          <FiRefreshCw />
                        </button>
                      )}
                      {pu.status !== 'invited' && (
                        <button className="btn btn-secondary" title={L('Password Reset Link', 'رابط إعادة تعيين كلمة المرور')} disabled={busyId === pu.id} onClick={() => handleResetLink(pu)}>
                          <FiLink />
                        </button>
                      )}
                      <button className="btn btn-secondary" title={L('Enable/Disable', 'تفعيل/تعطيل')} onClick={() => handleToggle(pu.id)}>
                        {pu.isActive ? <FiToggleRight /> : <FiToggleLeft />}
                      </button>
                      <button className="btn btn-danger" title={L('Delete', 'حذف')} onClick={() => handleDelete(pu.id)}>
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {portalUsers.length === 0 && (
              <tr><td colSpan="7" className="no-data">{L('No portal users found', 'لا يوجد مستخدمون للبوابة')}</td></tr>
            )}
          </tbody>
        </table>
      </div>
      )}

      <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#e8f4fd', borderRadius: '8px', fontSize: '0.9rem' }}>
        <strong>{L('How it works:', 'كيف يعمل:')}</strong>{' '}
        {L(
          'Invite a client → they receive a one-time activation link by email → they set their own password and log in at /portal to view their cases, sessions and invoices.',
          'ادعُ عميلاً ← يصله رابط تفعيل لمرة واحدة ← يحدد كلمة المرور الخاصة به ← يسجل الدخول من /portal لمتابعة قضاياه وجلساته وفواتيره.'
        )}
      </div>
    </div>
  );
};

export default PortalUsers;
