import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { FiEdit, FiArrowRight, FiPlus } from 'react-icons/fi';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import toast from 'react-hot-toast';
import FinancialStatusBadge from '../../components/FinancialStatusBadge';

const CAN_MANAGE_FINANCIALS = ['admin', 'partner', 'legal_secretary'];

const ClientDetails = () => {
  const { id } = useParams();
  const { t, language } = useLanguage();
  const isArabic = language === 'ar';
  const navigate = useNavigate();
  const { user } = useAuth();
  const canManageFinancials = user && CAN_MANAGE_FINANCIALS.includes(user.role);
  const [client, setClient] = useState(null);
  const [financials, setFinancials] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    fetchClientDetails();
  }, [id]);

  const fetchClientDetails = async () => {
    setFetchError(false);
    setLoading(true);
    try {
      const requests = [api.get(`/clients/${id}`)];
      if (canManageFinancials) {
        requests.push(api.get(`/clients/${id}/financial-summary`));
      }
      const [clientRes, financialRes] = await Promise.all(requests);
      setClient(clientRes.data.client);
      if (financialRes) setFinancials(financialRes.data);
    } catch (error) {
      toast.error(t.errorFetchingClient || (isArabic ? 'خطأ في جلب بيانات العميل' : 'Error fetching client'));
      setFetchError(true);
    } finally {
      setLoading(false);
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

  const getInvoiceStatusBadge = (status) => {
    return <FinancialStatusBadge status={status} />;
  };

  if (loading) {
    return <div className="loading">{t.loading}</div>;
  }

  if (fetchError) {
    return (
      <div className="error-state">
        <p>{t.errorFetchingClient || (isArabic ? 'خطأ في جلب بيانات العميل' : 'Error fetching client')}</p>
        <button className="btn btn-primary" onClick={fetchClientDetails}>{t.retry || (isArabic ? 'إعادة المحاولة' : 'Retry')}</button>
      </div>
    );
  }

  if (!client) {
    return <div className="no-data">{t.clientNotFound || (isArabic ? 'العميل غير موجود' : 'Client not found')}</div>;
  }

  return (
    <div className="client-details">
      <div className="card-header">
        <h2 className="card-title">{client.name}</h2>
        <div className="actions">
          <Link to={`/dashboard/clients/${id}/edit`} className="btn btn-primary">
            <FiEdit /> {t.editClient || (isArabic ? 'تعديل بيانات العميل' : 'Edit Client')}
          </Link>
          <Link to="/dashboard/clients" className="btn btn-secondary">
            <FiArrowRight /> {t.backToClients || (isArabic ? 'العودة لقائمة العملاء' : 'Back to Clients')}
          </Link>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3 className="card-title">{t.personalInformation || (isArabic ? 'المعلومات الشخصية' : 'Personal Information')}</h3>
          <div className="details-grid">
            <div className="detail-item">
              <label>{t.clientName || (isArabic ? 'الاسم' : 'Name')}</label>
              <span>{client.name || '-'}</span>
            </div>
            <div className="detail-item">
              <label>{t.civilId || (isArabic ? 'الرقم المدني' : 'Civil ID')}</label>
              <span>{client.civilId || '-'}</span>
            </div>
            <div className="detail-item">
              <label>{t.passportNumber || (isArabic ? 'رقم الجواز' : 'Passport No.')}</label>
              <span>{client.passportNumber || '-'}</span>
            </div>
            <div className="detail-item">
              <label>{t.nationality || (isArabic ? 'الجنسية' : 'Nationality')}</label>
              <span>{client.nationality || '-'}</span>
            </div>
            <div className="detail-item">
              <label>{t.dateOfBirth || (isArabic ? 'تاريخ الميلاد' : 'Date of Birth')}</label>
              <span>
                {client.dateOfBirth
                  ? format(new Date(client.dateOfBirth), 'dd/MM/yyyy', { locale: ar })
                  : '-'
                }
              </span>
            </div>
            <div className="detail-item">
              <label>{t.registrationDate || (isArabic ? 'تاريخ التسجيل' : 'Registration Date')}</label>
              <span>
                {client.createdAt
                  ? format(new Date(client.createdAt), 'dd/MM/yyyy', { locale: ar })
                  : '-'
                }
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">{t.contactInformation || (isArabic ? 'معلومات الاتصال' : 'Contact Information')}</h3>
          <div className="details-grid">
            <div className="detail-item">
              <label>{t.phone || (isArabic ? 'الجوال' : 'Phone')}</label>
              <span>{client.phone || '-'}</span>
            </div>
            <div className="detail-item">
              <label>{t.email || (isArabic ? 'البريد الإلكتروني' : 'Email')}</label>
              <span>{client.email || '-'}</span>
            </div>
            <div className="detail-item">
              <label>{t.address || (isArabic ? 'العنوان' : 'Address')}</label>
              <span>{client.address || '-'}</span>
            </div>
          </div>
        </div>
      </div>

      {client.portalUser && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Portal Account / حساب بوابة العميل</h3>
          </div>
          <div className="details-grid">
            <div className="detail-item">
              <label>{t.email || (isArabic ? 'البريد الإلكتروني' : 'Email')}</label>
              <span>{client.portalUser.email || '-'}</span>
            </div>
            <div className="detail-item">
              <label>{t.accountStatus || (isArabic ? 'حالة الحساب' : 'Account Status')}</label>
              <span className={`badge ${
                client.portalUser.status === 'active' ? 'badge-active'
                : client.portalUser.status === 'disabled' ? 'badge-closed'
                : 'badge-pending'
              }`}>
                {client.portalUser.status === 'active'
                  ? (isArabic ? 'نشط' : 'Active')
                  : client.portalUser.status === 'disabled'
                    ? (isArabic ? 'معطل' : 'Disabled')
                    : (isArabic ? 'بانتظار التفعيل' : 'Invitation pending')}
              </span>
            </div>
            {client.portalUser.invitationSentAt && (
              <div className="detail-item">
                <label>{isArabic ? 'تاريخ آخر دعوة' : 'Last invitation sent'}</label>
                <span>{format(new Date(client.portalUser.invitationSentAt), 'dd/MM/yyyy HH:mm', { locale: ar })}</span>
              </div>
            )}
          </div>
          <div className="actions" style={{ flexWrap: 'wrap', marginTop: '0.75rem' }}>
            {client.portalUser.status === 'invited' && (
              <button
                className="btn btn-primary"
                onClick={async () => {
                  try {
                    const res = await api.post(`/portal/admin/resend-invitation/${id}`);
                    toast.success(res.data.invitationLink ? (isArabic ? 'تم إعادة إرسال الدعوة' : 'Invitation resent') : res.data.message);
                    fetchClientDetails();
                  } catch (error) {
                    toast.error(error.response?.data?.error || (isArabic ? 'فشل إعادة الإرسال' : 'Failed to resend'));
                  }
                }}
              >
                {isArabic ? 'إعادة إرسال دعوة التفعيل' : 'Resend Activation Invitation'}
              </button>
            )}
            {client.portalUser.status !== 'invited' && (
              <>
                <button
                  className="btn btn-secondary"
                  onClick={async () => {
                    try {
                      const res = await api.post(`/portal/admin/${client.portalUser.id}/generate-reset-link`);
                      toast.success(res.data.resetUrl || res.data.message, { duration: 20000 });
                    } catch (error) {
                      toast.error(error.response?.data?.error || (isArabic ? 'فشل إنشاء الرابط' : 'Failed to generate link'));
                    }
                  }}
                >
                  {isArabic ? 'رابط إعادة تعيين كلمة المرور' : 'Password Reset Link'}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={async () => {
                    try {
                      const res = await api.put(`/portal/admin/${client.portalUser.id}/toggle`);
                      toast.success(res.data.message);
                      fetchClientDetails();
                    } catch (error) {
                      toast.error(error.response?.data?.error || (isArabic ? 'فشل التحديث' : 'Failed to update'));
                    }
                  }}
                >
                  {client.portalUser.status === 'disabled'
                    ? (isArabic ? 'تفعيل الحساب' : 'Enable Account')
                    : (isArabic ? 'تعطيل الحساب' : 'Disable Account')}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {client.notes && (
        <div className="card">
          <h3 className="card-title">{t.notes || (isArabic ? 'ملاحظات' : 'Notes')}</h3>
          <p>{client.notes}</p>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">{t.linkedCases || (isArabic ? 'القضايا المرتبطة' : 'Linked Cases')}</h3>
          <Link to={`/dashboard/cases/new?clientId=${id}`} className="btn btn-primary">
            <FiPlus /> {t.addCase || (isArabic ? 'إضافة قضية' : 'Add Case')}
          </Link>
        </div>

        {client.cases?.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>{t.caseNumber || (isArabic ? 'رقم القضية' : 'Case No.')}</th>
                  <th>{t.caseTitle || (isArabic ? 'عنوان القضية' : 'Case Title')}</th>
                  <th>{t.caseType || (isArabic ? 'نوع القضية' : 'Case Type')}</th>
                  <th>{t.caseStatus || (isArabic ? 'الحالة' : 'Status')}</th>
                  <th>{t.actions || (isArabic ? 'إجراءات' : 'Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {client.cases.map((caseItem) => (
                  <tr key={caseItem.id}>
                    <td><Link to={`/dashboard/cases/${caseItem.id}`}>{caseItem.caseNumber || '-'}</Link></td>
                    <td><Link to={`/dashboard/cases/${caseItem.id}`}>{caseItem.title}</Link></td>
                    <td>{t[caseItem.type]}</td>
                    <td>{getStatusBadge(caseItem.status)}</td>
                    <td>
                      <Link to={`/dashboard/cases/${caseItem.id}`} className="btn btn-secondary">
                        {t.viewDetails}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="no-data">{t.noCases || (isArabic ? 'لا توجد قضايا مرتبطة' : 'No linked cases')}</p>
        )}
      </div>

      {canManageFinancials && financials && (
        <div className="card">
          <h3 className="card-title">{isArabic ? 'الملخص المالي للعميل' : 'Client Financial Summary'}</h3>
          <div className="stats-grid" style={{ marginBottom: '1rem' }}>
            <div className="stat-card">
              <span className="stat-label">{isArabic ? 'إجمالي الفواتير' : 'Total Invoiced'}</span>
              <span className="stat-value">{financials.summary.totalInvoiced.toFixed(3)} {t.currency || (isArabic ? 'د.ك' : 'KWD')}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">{isArabic ? 'إجمالي المدفوع' : 'Total Paid'}</span>
              <span className="stat-value">{financials.summary.totalPaid.toFixed(3)} {t.currency || (isArabic ? 'د.ك' : 'KWD')}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">{isArabic ? 'المستحق' : 'Outstanding'}</span>
              <span className="stat-value" style={{ color: financials.summary.outstanding > 0 ? '#e53e3e' : undefined }}>{financials.summary.outstanding.toFixed(3)} {t.currency || (isArabic ? 'د.ك' : 'KWD')}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">{isArabic ? 'غير مفوتر (قابل للفوترة)' : 'Unbilled Billable'}</span>
              <span className="stat-value">{financials.summary.unbilledBillable.toFixed(3)} {t.currency || (isArabic ? 'د.ك' : 'KWD')}</span>
            </div>
          </div>

          {financials.caseBreakdown?.length > 0 && (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>{t.caseNumber || (isArabic ? 'رقم القضية' : 'Case No.')}</th>
                    <th>{isArabic ? 'العنوان' : 'Title'}</th>
                    <th>{isArabic ? 'فوترة' : 'Invoiced'}</th>
                    <th>{isArabic ? 'مدفوع' : 'Paid'}</th>
                    <th>{isArabic ? 'مستحق' : 'Outstanding'}</th>
                    <th>{isArabic ? 'غير مفوتر' : 'Unbilled'}</th>
                    <th>{isArabic ? 'إجراء' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody>
                  {financials.caseBreakdown.map(c => (
                    <tr key={c.caseId}>
                      <td><Link to={`/dashboard/cases/${c.caseId}`}>{c.caseNumber || '-'}</Link></td>
                      <td>{c.title}</td>
                      <td>{c.invoiced.toFixed(3)}</td>
                      <td>{c.paid.toFixed(3)}</td>
                      <td style={{ color: c.outstanding > 0 ? '#e53e3e' : undefined }}>{c.outstanding.toFixed(3)}</td>
                      <td>{c.unbilledBillable.toFixed(3)}</td>
                      <td>
                        <Link to={`/dashboard/cases/${c.caseId}`} className="btn btn-secondary">
                          {isArabic ? 'فتح' : 'Open'}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {canManageFinancials && client.invoices?.length > 0 && (
        <div className="card">
          <h3 className="card-title">{t.invoices || (isArabic ? 'الفواتير' : 'Invoices')}</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>{t.invoiceNumber || (isArabic ? 'رقم الفاتورة' : 'Invoice No.')}</th>
                  <th>{t.totalAmount || (isArabic ? 'المبلغ الإجمالي' : 'Total Amount')}</th>
                  <th>{t.paidAmount || (isArabic ? 'المبلغ المدفوع' : 'Paid Amount')}</th>
                  <th>{t.status || (isArabic ? 'الحالة' : 'Status')}</th>
                  <th>{t.dueDate || (isArabic ? 'تاريخ الاستحقاق' : 'Due Date')}</th>
                </tr>
              </thead>
              <tbody>
                {client.invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>{invoice.invoiceNumber}</td>
                    <td>{invoice.totalAmount} {t.currency || (isArabic ? 'د.ك' : 'KWD')}</td>
                    <td>{invoice.paidAmount} {t.currency || (isArabic ? 'د.ك' : 'KWD')}</td>
                    <td>{getInvoiceStatusBadge(invoice.status)}</td>
                    <td>
                      {invoice.dueDate
                        ? format(new Date(invoice.dueDate), 'dd/MM/yyyy', { locale: ar })
                        : '-'
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientDetails;
