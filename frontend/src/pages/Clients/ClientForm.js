import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ClientForm = () => {
  const { id } = useParams();
  const { t, language } = useLanguage();
  const isArabic = language === 'ar';
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    civilId: '',
    passportNumber: '',
    phone: '',
    email: '',
    address: '',
    nationality: '',
    dateOfBirth: '',
    firstCooperationDate: '',
    notes: ''
  });
  const [createPortalAccount, setCreatePortalAccount] = useState(false);
  const [sendCredentials, setSendCredentials] = useState(false);
  const [portalUser, setPortalUser] = useState(null);
  const [resending, setResending] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 768px)');
    setIsMobile(mql.matches);
    const handler = (e) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (id) {
      fetchClient();
    } else {
      setFetching(false);
    }
  }, [id]);

  const fetchClient = async () => {
    try {
      const response = await api.get(`/clients/${id}`);
      const client = response.data.client;
      setFormData({
        name: client.name || '',
        civilId: client.civilId || '',
        passportNumber: client.passportNumber || '',
        phone: client.phone || '',
        email: client.email || '',
        address: client.address || '',
        nationality: client.nationality || '',
        dateOfBirth: client.dateOfBirth?.split('T')[0] || '',
        firstCooperationDate: client.firstCooperationDate?.split('T')[0] || '',
        notes: client.notes || ''
      });
      if (client.portalUser) {
        setPortalUser(client.portalUser);
      }
    } catch (error) {
      toast.error(t.errorFetchingClient || 'خطأ في جلب بيانات العميل');
      navigate('/dashboard/clients');
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error(t.clientNameRequired || 'اسم الموكل مطلوب');
      return;
    }
    if (createPortalAccount && !formData.email.trim()) {
      toast.error(t.portalEmailRequired || 'يرجى إدخال البريد الإلكتروني لإنشاء حساب البوابة');
      return;
    }

    setLoading(true);

    const cleanedData = { ...formData };
    Object.keys(cleanedData).forEach(key => {
      if (cleanedData[key] === '') cleanedData[key] = null;
    });

    try {
      if (id) {
        await api.put(`/clients/${id}`, cleanedData);
        toast.success(t.clientUpdated || 'تم تحديث بيانات العميل بنجاح');
      } else {
        const payload = { ...cleanedData };
        if (createPortalAccount && cleanedData.email) {
          payload.createPortalAccount = true;
          payload.sendCredentials = sendCredentials;
        }
        const response = await api.post('/clients', payload);
        const portalInfo = response.data.portalAccount;
        if (portalInfo && portalInfo.invitationLink) {
          toast.success(
            (t) => (
              <div>
                <div style={{ marginBottom: '0.35rem' }}>{isArabic ? 'تم إنشاء العميل وإرسال دعوة تفعيل الحساب. رابط الدعوة (استخدام واحد):' : 'Client created. Invitation link (single use):'}</div>
                <code className="invite-link-box" style={{ display: 'block', wordBreak: 'break-all', background: '#edf2f7', padding: '0.5rem', borderRadius: '4px', fontSize: '0.8rem' }}>{portalInfo.invitationLink}</code>
              </div>
            ),
            { duration: 20000 }
          );
        } else if (portalInfo) {
          toast.success(isArabic ? 'تم إنشاء العميل وإرسال دعوة التفعيل عبر البريد الإلكتروني' : 'Client created. Invitation sent by email');
        } else {
          toast.success(t.clientCreated || 'تم إنشاء العميل بنجاح');
        }
      }
      navigate('/dashboard/clients');
    } catch (error) {
      toast.error(error.response?.data?.details || error.response?.data?.error || (t.errorSavingClient || 'خطأ في حفظ بيانات العميل'));
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="loading">{t.loading}</div>;
  }

  return (
    <div className={`client-form ${isMobile ? 'client-form-mobile' : ''}`}>
      <div className="card-header">
        <h2 className="card-title">{id ? (t.editClient || 'تعديل بيانات العميل') : (t.addClient || 'إضافة عميل')}</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <div className={`grid grid-2 ${isMobile ? 'grid-mobile-stack' : ''}`}>
          <div className="card">
            <h3 className="card-title">{t.personalInformation || 'المعلومات الشخصية'}</h3>

            <div className="form-group">
              <label>{t.clientName || 'الاسم'} *</label>
              <input
                type="text"
                name="name"
                className="form-control"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>{t.civilId || 'الرقم المدني'}</label>
              <input
                type="text"
                name="civilId"
                className="form-control"
                value={formData.civilId}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>{t.passportNumber || 'رقم الجواز'}</label>
              <input
                type="text"
                name="passportNumber"
                className="form-control"
                value={formData.passportNumber}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>{t.nationality || 'الجنسية'}</label>
              <input
                type="text"
                name="nationality"
                className="form-control"
                value={formData.nationality}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>{t.dateOfBirth || 'تاريخ الميلاد'}</label>
              <input
                type="date"
                name="dateOfBirth"
                className="form-control"
                value={formData.dateOfBirth}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>{t.firstCooperationDate || 'تاريخ أول تعاون'}</label>
              <input
                type="date"
                name="firstCooperationDate"
                className="form-control"
                value={formData.firstCooperationDate}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="card">
            <h3 className="card-title">{t.contactInformation || 'معلومات الاتصال'}</h3>

            <div className="form-group">
              <label>{t.phone || 'الجوال'}</label>
              <input
                type="tel"
                name="phone"
                className="form-control"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>{t.email || 'البريد الإلكتروني'}</label>
              <input
                type="email"
                name="email"
                className="form-control"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>{t.address || 'العنوان'}</label>
              <textarea
                name="address"
                className="form-control"
                rows={isMobile ? 2 : 3}
                value={formData.address}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>{t.notes || 'ملاحظات'}</label>
              <textarea
                name="notes"
                className="form-control"
                rows={isMobile ? 2 : 3}
                value={formData.notes}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {!id && (
          <div className="card" style={{ marginTop: isMobile ? '0.75rem' : '1rem' }}>
            <h3 className="card-title">Portal Account / حساب بوابة العميل</h3>
            <p style={{ color: '#666', fontSize: '0.85rem', marginBottom: '1rem' }}>
              Create a client portal account so the client can track their cases and invoices online. The client will receive a secure one-time activation link.
            </p>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={createPortalAccount}
                  onChange={(e) => {
                    setCreatePortalAccount(e.target.checked);
                    if (!e.target.checked) setSendCredentials(false);
                  }}
                  style={{ width: '18px', height: '18px' }}
                />
                <span>{isArabic ? 'إنشاء حساب بوابة لهذا العميل' : 'Create portal account for this client'}</span>
              </label>
            </div>
            {createPortalAccount && formData.email && (
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={sendCredentials}
                    onChange={(e) => setSendCredentials(e.target.checked)}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <span>{isArabic ? 'إرسال رابط التفعيل إلى البريد الإلكتروني' : 'Send activation link to client email'}</span>
                </label>
              </div>
            )}
            {createPortalAccount && !formData.email && (
              <p style={{ color: '#e53e3e', fontSize: '0.85rem' }}>
                {isArabic ? 'يرجى إدخال البريد الإلكتروني للعميل لإنشاء حساب البوابة' : 'Please enter the client email to create a portal account'}
              </p>
            )}
          </div>
        )}

        {id && portalUser && (
          <div className="card" style={{ marginTop: isMobile ? '0.75rem' : '1rem' }}>
            <h3 className="card-title">Portal Account / حساب بوابة العميل</h3>
            <div className="details-grid">
              <div className="detail-item">
                <label>{t.email}</label>
                <span>{portalUser.email || '-'}</span>
              </div>
              <div className="detail-item">
                <label>{t.accountStatus}</label>
                <span className={`badge ${portalUser.status === 'active' ? 'badge-active' : portalUser.status === 'disabled' ? 'badge-closed' : 'badge-pending'}`}>
                  {portalUser.status === 'active'
                    ? (isArabic ? 'نشط' : 'Active')
                    : portalUser.status === 'disabled'
                      ? (isArabic ? 'معطل' : 'Disabled')
                      : (isArabic ? 'بانتظار التفعيل' : 'Invitation pending')}
                </span>
              </div>
            </div>

            <div className="actions" style={{ flexWrap: 'wrap', marginTop: '0.75rem' }}>
              {portalUser.status === 'invited' && (
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={resending}
                  onClick={async () => {
                    if (!portalUser.email) {
                      toast.error('Client has no portal email');
                      return;
                    }
                    setResending(true);
                    try {
                      const res = await api.post(`/portal/admin/resend-invitation/${id}`);
                      if (res.data.invitationLink) {
                        toast.success(
                          (t) => (
                            <div>
                              <div style={{ marginBottom: '0.35rem' }}>{isArabic ? 'تم إعادة إرسال الدعوة. رابط الدعوة (استخدام واحد):' : 'Invitation resent. Link (single use):'}</div>
                              <code className="invite-link-box" style={{ display: 'block', wordBreak: 'break-all', background: '#edf2f7', padding: '0.5rem', borderRadius: '4px', fontSize: '0.8rem' }}>{res.data.invitationLink}</code>
                            </div>
                          ),
                          { duration: 20000 }
                        );
                      } else {
                        toast.success(res.data.message || 'Invitation sent to client email');
                      }
                    } catch (error) {
                      toast.error(error.response?.data?.error || 'Failed to resend invitation');
                    } finally {
                      setResending(false);
                    }
                  }}
                >
                  {resending ? 'Sending...' : (isArabic ? 'إعادة إرسال دعوة التفعيل' : 'Resend Activation Invitation')}
                </button>
              )}

              {portalUser.status !== 'invited' && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={resetting}
                  onClick={async () => {
                    setResetting(true);
                    try {
                      const res = await api.post(`/portal/admin/${portalUser.id}/generate-reset-link`);
                      toast.success(
                        (t) => (
                          <div>
                            <div style={{ marginBottom: '0.35rem' }}>{isArabic ? 'رابط إعادة تعيين كلمة المرور (استخدام واحد):' : 'Password reset link (single use):'}</div>
                            <code className="invite-link-box" style={{ display: 'block', wordBreak: 'break-all', background: '#edf2f7', padding: '0.5rem', borderRadius: '4px', fontSize: '0.8rem' }}>{res.data.resetUrl}</code>
                          </div>
                        ),
                        { duration: 20000 }
                      );
                    } catch (error) {
                      toast.error(error.response?.data?.error || 'Failed to generate reset link');
                    } finally {
                      setResetting(false);
                    }
                  }}
                >
                  {resetting ? 'Generating...' : (isArabic ? 'إنشاء رابط إعادة تعيين كلمة المرور' : 'Generate Password Reset Link')}
                </button>
              )}

              {portalUser.status !== 'invited' && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={async () => {
                    try {
                      const res = await api.put(`/portal/admin/${portalUser.id}/toggle`);
                      toast.success(res.data.message);
                      const updated = await api.get(`/clients/${id}`);
                      setPortalUser(updated.data.client.portalUser);
                    } catch (error) {
                      toast.error(error.response?.data?.error || 'Failed to update account');
                    }
                  }}
                >
                  {portalUser.status === 'disabled'
                    ? (isArabic ? 'تفعيل الحساب' : 'Enable Account')
                    : (isArabic ? 'تعطيل الحساب' : 'Disable Account')}
                </button>
              )}
            </div>
          </div>
        )}

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? t.loading : t.save}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/dashboard/clients')}>
            {t.cancel}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClientForm;
