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
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClientDetails();
  }, [id]);

  const fetchClientDetails = async () => {
    try {
      const response = await api.get(`/clients/${id}`);
      setClient(response.data.client);
    } catch (error) {
      toast.error(t.errorFetchingClient || 'خطأ في جلب بيانات العميل');
      navigate('/clients');
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

  if (!client) {
    return <div className="no-data">{t.clientNotFound || 'العميل غير موجود'}</div>;
  }

  return (
    <div className="client-details">
      <div className="card-header">
        <h2 className="card-title">{client.name}</h2>
        <div className="actions">
          <Link to={`/clients/${id}/edit`} className="btn btn-primary">
            <FiEdit /> {t.editClient || 'تعديل بيانات العميل'}
          </Link>
          <Link to="/clients" className="btn btn-secondary">
            <FiArrowRight /> {t.backToClients || 'العودة لقائمة العملاء'}
          </Link>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3 className="card-title">{t.personalInformation || 'المعلومات الشخصية'}</h3>
          <div className="details-grid">
            <div className="detail-item">
              <label>{t.clientName || 'الاسم'}</label>
              <span>{client.name || '-'}</span>
            </div>
            <div className="detail-item">
              <label>{t.civilId || 'الرقم المدني'}</label>
              <span>{client.civilId || '-'}</span>
            </div>
            <div className="detail-item">
              <label>{t.passportNumber || 'رقم الجواز'}</label>
              <span>{client.passportNumber || '-'}</span>
            </div>
            <div className="detail-item">
              <label>{t.nationality || 'الجنسية'}</label>
              <span>{client.nationality || '-'}</span>
            </div>
            <div className="detail-item">
              <label>{t.dateOfBirth || 'تاريخ الميلاد'}</label>
              <span>
                {client.dateOfBirth
                  ? format(new Date(client.dateOfBirth), 'dd/MM/yyyy', { locale: ar })
                  : '-'
                }
              </span>
            </div>
            <div className="detail-item">
              <label>{t.registrationDate || 'تاريخ التسجيل'}</label>
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
          <h3 className="card-title">{t.contactInformation || 'معلومات الاتصال'}</h3>
          <div className="details-grid">
            <div className="detail-item">
              <label>{t.phone || 'الجوال'}</label>
              <span>{client.phone || '-'}</span>
            </div>
            <div className="detail-item">
              <label>{t.email || 'البريد الإلكتروني'}</label>
              <span>{client.email || '-'}</span>
            </div>
            <div className="detail-item">
              <label>{t.address || 'العنوان'}</label>
              <span>{client.address || '-'}</span>
            </div>
          </div>
        </div>
      </div>

      {client.notes && (
        <div className="card">
          <h3 className="card-title">{t.notes || 'ملاحظات'}</h3>
          <p>{client.notes}</p>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">{t.linkedCases || 'القضايا المرتبطة'}</h3>
          <Link to={`/cases/new?clientId=${id}`} className="btn btn-primary">
            <FiPlus /> {t.addCase || 'إضافة قضية'}
          </Link>
        </div>

        {client.cases?.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>{t.caseNumber || 'رقم القضية'}</th>
                  <th>{t.caseTitle || 'عنوان القضية'}</th>
                  <th>{t.caseType || 'نوع القضية'}</th>
                  <th>{t.caseStatus || 'الحالة'}</th>
                  <th>{t.actions || 'إجراءات'}</th>
                </tr>
              </thead>
              <tbody>
                {client.cases.map((caseItem) => (
                  <tr key={caseItem.id}>
                    <td><Link to={`/cases/${caseItem.id}`}>{caseItem.caseNumber || '-'}</Link></td>
                    <td><Link to={`/cases/${caseItem.id}`}>{caseItem.title}</Link></td>
                    <td>{t[caseItem.type]}</td>
                    <td>{getStatusBadge(caseItem.status)}</td>
                    <td>
                      <Link to={`/cases/${caseItem.id}`} className="btn btn-secondary">
                        {t.viewDetails}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="no-data">{t.noCases || 'لا توجد قضايا مرتبطة'}</p>
        )}
      </div>

      {client.invoices?.length > 0 && (
        <div className="card">
          <h3 className="card-title">{t.invoices || 'الفواتير'}</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>{t.invoiceNumber || 'رقم الفاتورة'}</th>
                  <th>{t.totalAmount || 'المبلغ الإجمالي'}</th>
                  <th>{t.paidAmount || 'المبلغ المدفوع'}</th>
                  <th>{t.status || 'الحالة'}</th>
                  <th>{t.dueDate || 'تاريخ الاستحقاق'}</th>
                </tr>
              </thead>
              <tbody>
                {client.invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>{invoice.invoiceNumber}</td>
                    <td>{invoice.totalAmount} {t.currency || 'د.ك'}</td>
                    <td>{invoice.paidAmount} {t.currency || 'د.ك'}</td>
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
