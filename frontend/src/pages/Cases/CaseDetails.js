import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { FiEdit, FiArrowRight, FiPlus, FiChevronDown } from 'react-icons/fi';
import { format } from 'date-fns';
import { ar as arLocale } from 'date-fns/locale';
import toast from 'react-hot-toast';
import CaseOverview from './CaseOverview';
import CaseFinancials from './CaseFinancials';
import CaseFeeAgreementSection from './CaseFeeAgreementSection';
import FinancialEntryForm from './FinancialEntryForm';
import FinancialStatusBadge from '../../components/FinancialStatusBadge';
import CaseTimeline from './CaseTimeline';

const FINANCIAL_ROLES = ['admin', 'partner', 'legal_secretary'];

const getStatusBadge = (status, t) => {
  const statusClasses = {
    active: 'badge-active',
    pending: 'badge-pending',
    closed: 'badge-closed',
    won: 'badge-won',
    lost: 'badge-lost'
  };
  return <span className={`badge ${statusClasses[status] || 'badge-closed'}`}>{t[status] || status}</span>;
};

const CaseDetails = () => {
  const { id } = useParams();
  const { t, language } = useLanguage();
  const isArabic = language === 'ar';
  const navigate = useNavigate();
  const { user } = useAuth();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedSession, setExpandedSession] = useState(null);
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [sessionFormSession, setSessionFormSession] = useState('');

  const canManageFinancials = FINANCIAL_ROLES.includes(user?.role);

  useEffect(() => {
    fetchCaseDetails();
  }, [id]);

  const fetchCaseDetails = async () => {
    setFetchError(false);
    setLoading(true);
    try {
      const response = await api.get(`/cases/${id}`);
      setCaseData(response.data.case);
    } catch (error) {
      toast.error(t.errorFetchingCase);
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { key: 'overview', label: isArabic ? 'نظرة عامة' : 'Overview' },
    { key: 'details', label: isArabic ? 'تفاصيل القضية' : 'Case Details' },
    { key: 'sessions', label: isArabic ? 'الجلسات' : 'Sessions' },
    ...(canManageFinancials ? [{ key: 'financials', label: isArabic ? 'المالية' : 'Financials' }] : []),
    ...(canManageFinancials ? [{ key: 'invoices', label: isArabic ? 'الفواتير والدفعات' : 'Invoices & Payments' }] : []),
    { key: 'documents', label: isArabic ? 'المستندات' : 'Documents' },
    { key: 'transactions', label: isArabic ? 'المعاملات الحكومية' : 'Gov. Transactions' },
    { key: 'timeline', label: isArabic ? 'الجدول الزمني' : 'Timeline' },
    { key: 'notes', label: isArabic ? 'الملاحظات والنشاط' : 'Notes / Activity' }
  ];

  if (loading) {
    return <div className="loading">{t.loading}</div>;
  }

  if (fetchError) {
    return (
      <div className="error-state">
        <p>{t.errorFetchingCase}</p>
        <button className="btn btn-primary" onClick={fetchCaseDetails}>{t.retry || (isArabic ? 'إعادة المحاولة' : 'Retry')}</button>
      </div>
    );
  }

  if (!caseData) {
    return <div className="no-data">{t.caseNotFound}</div>;
  }

  const openSessionExpense = (sessionId) => {
    setSessionFormSession(String(sessionId));
    setShowSessionForm(true);
  };

  const renderDetails = () => (
    <>
      <div className="grid grid-2">
        <div className="card">
          <h3 className="card-title">{isArabic ? 'معلومات القضية' : 'Case Info'}</h3>
          <div className="details-grid">
            <div className="detail-item">
              <label>{t.caseNumber}</label>
              <span>{caseData.caseNumber}</span>
            </div>
            <div className="detail-item">
              <label>{t.caseType}</label>
              <span>{t[caseData.type] || caseData.type}</span>
            </div>
            <div className="detail-item">
              <label>{t.caseStatus}</label>
              {getStatusBadge(caseData.status, t)}
            </div>
            <div className="detail-item">
              <label>{t.casePriority}</label>
              <span>{t[caseData.priority] || caseData.priority}</span>
            </div>
            <div className="detail-item">
              <label>{t.court}</label>
              <span>{caseData.court || '-'}</span>
            </div>
            <div className="detail-item">
              <label>{t.judge}</label>
              <span>{caseData.judge || '-'}</span>
            </div>
            <div className="detail-item">
              <label>{t.filingDate}</label>
              <span>
                {caseData.filingDate
                  ? format(new Date(caseData.filingDate), 'dd/MM/yyyy', { locale: arLocale })
                  : '-'
                }
              </span>
            </div>
            <div className="detail-item">
              <label>{t.nextHearing}</label>
              <span>
                {caseData.nextHearingDate
                  ? format(new Date(caseData.nextHearingDate), 'dd/MM/yyyy', { locale: arLocale })
                  : '-'
                }
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">{isArabic ? 'الأطراف' : 'Parties'}</h3>
          <div className="details-grid">
            <div className="detail-item">
              <label>{t.clientName}</label>
              <span>{caseData.clientName || '-'}</span>
            </div>
            <div className="detail-item">
              <label>{t.clientPhone}</label>
              <span>{caseData.clientPhone || '-'}</span>
            </div>
            <div className="detail-item">
              <label>{t.clientEmail}</label>
              <span>{caseData.clientEmail || '-'}</span>
            </div>
            <div className="detail-item">
              <label>{t.opposingParty}</label>
              <span>{caseData.opposingParty || '-'}</span>
            </div>
            <div className="detail-item">
              <label>{t.opposingLawyer}</label>
              <span>{caseData.opposingLawyer || '-'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3 className="card-title">{isArabic ? 'الفريق' : 'Team'}</h3>
        <div className="details-grid">
          <div className="detail-item">
            <label>{isArabic ? 'المحامي المسؤول' : 'Assigned Lawyer'}</label>
            <span>{caseData.assignedLawyer?.fullName || '-'}</span>
          </div>
          <div className="detail-item">
            <label>{isArabic ? 'مندوب المحاكم' : 'Court Agent'}</label>
            <span>{caseData.courtAgent?.fullName || '-'}</span>
          </div>
        </div>
      </div>

      <CaseFeeAgreementSection caseId={id} />

      {caseData.description && (
        <div className="card">
          <h3 className="card-title">{t.description}</h3>
          <p>{caseData.description}</p>
        </div>
      )}

      {caseData.notes && (
        <div className="card">
          <h3 className="card-title">{t.notes}</h3>
          <p>{caseData.notes}</p>
        </div>
      )}
    </>
  );

  const renderSessions = () => {
    const sessions = caseData.sessions || [];
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">{t.sessions}</h3>
          <Link to={`/dashboard/sessions/new?caseId=${id}`} className="btn btn-primary">
            <FiPlus /> {t.addSession}
          </Link>
        </div>

        {sessions.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>{t.sessionNumber}</th>
                  <th>{t.sessionDate}</th>
                  <th>{t.sessionTime}</th>
                  <th>{t.sessionLocation}</th>
                  <th>{t.sessionStatus}</th>
                  {canManageFinancials && <th>{isArabic ? 'مصروفات الجلسة' : 'Session Expenses'}</th>}
                  <th>{t.actions}</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => {
                  const sessionEntries = (caseData.financialEntries || []).filter(e => e.sessionId === session.id);
                  const sessionTotal = sessionEntries.reduce((s, e) => s + parseFloat(e.amount), 0);
                  return (
                    <React.Fragment key={session.id}>
                      <tr onClick={() => setExpandedSession(expandedSession === session.id ? null : session.id)} style={{ cursor: 'pointer' }}>
                        <td>{session.sessionNumber}</td>
                        <td>{format(new Date(session.date), 'dd/MM/yyyy', { locale: arLocale })}</td>
                        <td>{session.time || '-'}</td>
                        <td>{session.location || '-'}</td>
                        <td>{getStatusBadge(session.status, t)}</td>
                        {canManageFinancials && (
                          <td>
                            {sessionTotal > 0 ? `${sessionTotal.toFixed(3)} د.ك` : '0'}
                            <button className="btn btn-secondary" style={{ marginInlineStart: '0.5rem', padding: '0.2rem 0.5rem' }} onClick={(e) => { e.stopPropagation(); openSessionExpense(session.id); }}>
                              <FiPlus />
                            </button>
                          </td>
                        )}
                        <td>
                          <Link to={`/dashboard/sessions/${session.id}/edit`} className="btn btn-secondary">
                            <FiEdit />
                          </Link>
                        </td>
                      </tr>
                      {expandedSession === session.id && (
                        <tr>
                          <td colSpan={canManageFinancials ? 7 : 6}>
                            <div className="session-expenses-strip">
                              <strong>{isArabic ? 'مصروفات الجلسة' : 'Session Expenses'}:</strong>
                              {sessionEntries.length > 0 ? (
                                <ul>
                                  {sessionEntries.map(e => (
                                    <li key={e.id}>
                                      {e.category} - {e.description || ''} - {parseFloat(e.amount).toFixed(3)} د.ك
                                      <FinancialStatusBadge status={e.billingStatus} />
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <span>{isArabic ? 'لا توجد مصروفات' : 'No expenses'}</span>
                              )}
                              {canManageFinancials && (
                                <button className="btn btn-secondary" onClick={() => openSessionExpense(session.id)}>
                                  <FiPlus /> {isArabic ? 'إضافة مصروف' : 'Add Expense'}
                                </button>
                              )}
                              {session.outcome && <p style={{ marginTop: '0.5rem' }}><strong>{isArabic ? 'النتيجة' : 'Outcome'}:</strong> {session.outcome}</p>}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="no-data">{t.noSessions}</p>
        )}
      </div>
    );
  };

  const renderInvoices = () => {
    const invoices = caseData.invoices || [];
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">{isArabic ? 'الفواتير والدفعات' : 'Invoices & Payments'}</h3>
          {canManageFinancials && (
            <div className="actions">
              <Link to={`/dashboard/cases/${id}/invoices/new`} className="btn btn-primary"><FiPlus /> {isArabic ? 'إنشاء فاتورة' : 'Create Invoice'}</Link>
              <Link to={`/dashboard/cases/${id}/payments/new`} className="btn btn-secondary"><FiPlus /> {isArabic ? 'تسجيل دفعة' : 'Record Payment'}</Link>
            </div>
          )}
        </div>

        {invoices.length > 0 ? (
          invoices.map(invoice => (
            <div key={invoice.id} className="card" style={{ marginBottom: '0.75rem', padding: '1rem' }}>
              <div className="card-header">
                <h4 style={{ margin: 0 }}>
                  {invoice.invoiceNumber} <FinancialStatusBadge status={invoice.status} />
                </h4>
                <Link to={`/dashboard/invoices/${invoice.id}`} className="btn btn-secondary">{isArabic ? 'عرض' : 'View'}</Link>
              </div>
              <div className="details-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
                <div className="detail-item"><label>{isArabic ? 'الإجمالي' : 'Total'}</label><span>{parseFloat(invoice.totalAmount || 0).toFixed(3)} د.ك</span></div>
                <div className="detail-item"><label>{isArabic ? 'المدفوع' : 'Paid'}</label><span>{parseFloat(invoice.paidAmount || 0).toFixed(3)} د.ك</span></div>
                <div className="detail-item"><label>{isArabic ? 'الرصيد' : 'Balance'}</label><span>{parseFloat((invoice.totalAmount || 0) - (invoice.paidAmount || 0)).toFixed(3)} د.ك</span></div>
                <div className="detail-item"><label>{isArabic ? 'الاستحقاق' : 'Due'}</label><span>{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '-'}</span></div>
              </div>
              {invoice.lines && invoice.lines.length > 0 && (
                <div style={{ marginTop: '0.5rem' }}>
                  <strong>{isArabic ? 'البنود' : 'Line Items'}:</strong>
                  <ul style={{ margin: '0.25rem 0' }}>
                    {invoice.lines.map(line => (
                      <li key={line.id}>{line.description} - {parseFloat(line.amount).toFixed(3)} د.ك</li>
                    ))}
                  </ul>
                </div>
              )}
              {invoice.payments && invoice.payments.length > 0 && (
                <div style={{ marginTop: '0.5rem' }}>
                  <strong>{isArabic ? 'الدفعات' : 'Payments'}:</strong>
                  <ul style={{ margin: '0.25rem 0' }}>
                    {invoice.payments.map(p => (
                      <li key={p.id}>{new Date(p.paymentDate).toLocaleDateString()} - {parseFloat(p.amount).toFixed(3)} د.ك ({p.paymentMethod})</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="no-data">{isArabic ? 'لا توجد فواتير' : 'No invoices'}</p>
        )}
      </div>
    );
  };

  const renderDocuments = () => {
    const documents = caseData.legalDocuments || [];
    return (
      <div className="card">
        <h3 className="card-title">{isArabic ? 'المستندات' : 'Documents'}</h3>
        {documents.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>{isArabic ? 'العنوان' : 'Title'}</th>
                  <th>{isArabic ? 'النوع' : 'Type'}</th>
                  <th>{isArabic ? 'الحالة' : 'Status'}</th>
                  <th>{isArabic ? 'التاريخ' : 'Date'}</th>
                </tr>
              </thead>
              <tbody>
                {documents.map(doc => (
                  <tr key={doc.id}>
                    <td>{doc.title}</td>
                    <td>{doc.type || '-'}</td>
                    <td>{doc.status ? getStatusBadge(doc.status, t) : '-'}</td>
                    <td>{doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="no-data">{isArabic ? 'لا توجد مستندات' : 'No documents'}</p>
        )}
      </div>
    );
  };

  const renderTransactions = () => {
    const transactions = caseData.transactions || [];
    return (
      <div className="card">
        <h3 className="card-title">{isArabic ? 'المعاملات الحكومية' : 'Government Transactions'}</h3>
        {transactions.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>{isArabic ? 'العنوان' : 'Title'}</th>
                  <th>{isArabic ? 'الجهة' : 'Entity'}</th>
                  <th>{isArabic ? 'الحالة' : 'Status'}</th>
                  <th>{isArabic ? 'تاريخ التقديم' : 'Submission Date'}</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(tr => (
                  <tr key={tr.id}>
                    <td>{tr.title}</td>
                    <td>{tr.governmentEntity || '-'}</td>
                    <td>{tr.status ? getStatusBadge(tr.status, t) : '-'}</td>
                    <td>{tr.submissionDate ? new Date(tr.submissionDate).toLocaleDateString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="no-data">{isArabic ? 'لا توجد معاملات حكومية' : 'No government transactions'}</p>
        )}
      </div>
    );
  };

  const renderNotes = () => (
    <>
      {caseData.description && (
        <div className="card">
          <h3 className="card-title">{t.description}</h3>
          <p>{caseData.description}</p>
        </div>
      )}
      {caseData.notes && (
        <div className="card">
          <h3 className="card-title">{t.notes}</h3>
          <p>{caseData.notes}</p>
        </div>
      )}
      <div className="card">
        <h3 className="card-title">{isArabic ? 'النشاط الأخير' : 'Recent Activity'}</h3>
        {(caseData.notifications || []).length > 0 ? (
          <div className="notifications-list">
            {caseData.notifications.map((notification) => (
              <div key={notification.id} className="notification-item">
                <div className="notification-content">
                  <h4>{notification.title}</h4>
                  <p>{notification.message}</p>
                </div>
                <span className="notification-date">
                  {format(new Date(notification.createdAt), 'dd/MM/yyyy HH:mm', { locale: arLocale })}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-data">{isArabic ? 'لا يوجد نشاط' : 'No activity'}</p>
        )}
      </div>
    </>
  );

  return (
    <div className="case-details">
      <div className="card-header">
        <h2 className="card-title">{caseData.title}</h2>
        <div className="actions">
          <Link to={`/dashboard/cases/${id}/edit`} className="btn btn-primary">
            <FiEdit /> {t.editCase}
          </Link>
          <Link to="/dashboard/cases" className="btn btn-secondary">
            <FiArrowRight /> {t.backToCases}
          </Link>
        </div>
      </div>

      <div className="case-tabs filter-tabs">
        {tabs.map(tab => (
          <button key={tab.key} className={`filter-tab ${activeTab === tab.key ? 'active' : ''}`} onClick={() => setActiveTab(tab.key)}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && <CaseOverview caseData={caseData} onNavigate={setActiveTab} />}
      {activeTab === 'details' && renderDetails()}
      {activeTab === 'sessions' && renderSessions()}
      {activeTab === 'financials' && canManageFinancials && (
        <CaseFinancials caseId={id} sessions={caseData.sessions || []} onChange={fetchCaseDetails} />
      )}
      {activeTab === 'invoices' && canManageFinancials && renderInvoices()}
      {activeTab === 'documents' && renderDocuments()}
      {activeTab === 'transactions' && renderTransactions()}
      {activeTab === 'timeline' && <CaseTimeline caseId={id} />}
      {activeTab === 'notes' && renderNotes()}

      {showSessionForm && (
        <FinancialEntryForm
          caseId={id}
          sessions={caseData.sessions || []}
          initialType="session_expense"
          initialSessionId={sessionFormSession}
          onClose={() => setShowSessionForm(false)}
          onSaved={fetchCaseDetails}
        />
      )}
    </div>
  );
};

export default CaseDetails;
