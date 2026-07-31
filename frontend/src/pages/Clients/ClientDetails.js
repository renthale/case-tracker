import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';
import { FiEdit, FiArrowRight, FiPlus } from 'react-icons/fi';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import toast from 'react-hot-toast';

const ClientDetails = () => {
  const { id } = useParams();
  const { t, language } = useLanguage();
  const isArabic = language === 'ar';
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    fetchClientDetails();
  }, [id]);

  const fetchClientDetails = async () => {
    setFetchError(false);
    setLoading(true);
    try {
      const response = await api.get(`/clients/${id}`);
      setClient(response.data.client);
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
    const statusClasses = {
      pending: 'badge-pending',
      paid: 'badge-won',
      overdue: 'badge-lost',
      cancelled: 'badge-closed'
    };
    return <span className={`badge ${statusClasses[status] || ''}`}>{t[status]}</span>;
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

      {client.invoices?.length > 0 && (
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
