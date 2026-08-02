const User = require('./User');
const Case = require('./Case');
const Session = require('./Session');
const Notification = require('./Notification');
const Client = require('./Client');
const Invoice = require('./Invoice');
const Payment = require('./Payment');
const LegalDocument = require('./LegalDocument');
const Transaction = require('./Transaction');
const AuditLog = require('./AuditLog');
const TimeEntry = require('./TimeEntry');
const ClientPortalUser = require('./ClientPortalUser');
const FinancialEntry = require('./FinancialEntry');
const CaseFeeAgreement = require('./CaseFeeAgreement');
const InvoiceLine = require('./InvoiceLine');

// Case belongs to User (assigned lawyer)
Case.belongsTo(User, { as: 'assignedLawyer', foreignKey: 'assignedLawyerId' });
User.hasMany(Case, { as: 'cases', foreignKey: 'assignedLawyerId' });

// Case belongs to User (court agent)
Case.belongsTo(User, { as: 'courtAgent', foreignKey: 'courtAgentId' });
User.hasMany(Case, { as: 'courtAgentCases', foreignKey: 'courtAgentId' });

// Case belongs to User (last editor)
Case.belongsTo(User, { as: 'lastEditor', foreignKey: 'lastEditedBy' });

// Case belongs to Client
Case.belongsTo(Client, { as: 'client', foreignKey: 'clientId' });
Client.hasMany(Case, { as: 'cases', foreignKey: 'clientId' });

// Session belongs to Case
Session.belongsTo(Case, { foreignKey: 'caseId' });
Case.hasMany(Session, { as: 'sessions', foreignKey: 'caseId' });

// Notification belongs to User
Notification.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Notification, { as: 'notifications', foreignKey: 'userId' });

// Notification belongs to Case (optional)
Notification.belongsTo(Case, { foreignKey: 'caseId' });
Case.hasMany(Notification, { as: 'notifications', foreignKey: 'caseId' });

// Notification belongs to Session (optional)
Notification.belongsTo(Session, { foreignKey: 'sessionId' });
Session.hasMany(Notification, { as: 'notifications', foreignKey: 'sessionId' });

// Invoice belongs to Client
Invoice.belongsTo(Client, { as: 'client', foreignKey: 'clientId' });
Client.hasMany(Invoice, { as: 'invoices', foreignKey: 'clientId' });

// Invoice belongs to Case
Invoice.belongsTo(Case, { as: 'case', foreignKey: 'caseId' });
Case.hasMany(Invoice, { as: 'invoices', foreignKey: 'caseId' });

// Payment belongs to Invoice
Payment.belongsTo(Invoice, { as: 'invoice', foreignKey: 'invoiceId' });
Invoice.hasMany(Payment, { as: 'payments', foreignKey: 'invoiceId' });

// Payment belongs to Case (optional, for case-level payments)
Payment.belongsTo(Case, { as: 'case', foreignKey: 'caseId' });
Case.hasMany(Payment, { as: 'payments', foreignKey: 'caseId' });

// Payment belongs to Client
Payment.belongsTo(Client, { as: 'client', foreignKey: 'clientId' });
Client.hasMany(Payment, { as: 'payments', foreignKey: 'clientId' });

// InvoiceLine belongs to Invoice
InvoiceLine.belongsTo(Invoice, { as: 'invoice', foreignKey: 'invoiceId' });
Invoice.hasMany(InvoiceLine, { as: 'lines', foreignKey: 'invoiceId' });

// CaseFeeAgreement belongs to Case (one-to-one)
CaseFeeAgreement.belongsTo(Case, { as: 'case', foreignKey: 'caseId' });
Case.hasOne(CaseFeeAgreement, { as: 'feeAgreement', foreignKey: 'caseId' });

// FinancialEntry belongs to Case
FinancialEntry.belongsTo(Case, { as: 'case', foreignKey: 'caseId' });
Case.hasMany(FinancialEntry, { as: 'financialEntries', foreignKey: 'caseId' });

// FinancialEntry belongs to Session (optional)
FinancialEntry.belongsTo(Session, { as: 'session', foreignKey: 'sessionId' });
Session.hasMany(FinancialEntry, { as: 'financialEntries', foreignKey: 'sessionId' });

// FinancialEntry belongs to Client
FinancialEntry.belongsTo(Client, { as: 'client', foreignKey: 'clientId' });
Client.hasMany(FinancialEntry, { as: 'financialEntries', foreignKey: 'clientId' });

// LegalDocument belongs to Case
LegalDocument.belongsTo(Case, { as: 'case', foreignKey: 'caseId' });
Case.hasMany(LegalDocument, { as: 'legalDocuments', foreignKey: 'caseId' });

// LegalDocument belongs to User (uploader)
LegalDocument.belongsTo(User, { as: 'uploader', foreignKey: 'uploadedBy' });
User.hasMany(LegalDocument, { as: 'uploadedDocuments', foreignKey: 'uploadedBy' });

// Transaction belongs to Case
Transaction.belongsTo(Case, { as: 'case', foreignKey: 'caseId' });
Case.hasMany(Transaction, { as: 'transactions', foreignKey: 'caseId' });

// Transaction belongs to Client
Transaction.belongsTo(Client, { as: 'client', foreignKey: 'clientId' });
Client.hasMany(Transaction, { as: 'transactions', foreignKey: 'clientId' });

// Transaction belongs to Invoice
Transaction.belongsTo(Invoice, { as: 'invoice', foreignKey: 'invoiceId' });
Invoice.hasMany(Transaction, { as: 'transactions', foreignKey: 'invoiceId' });

// Transaction belongs to User (creator)
Transaction.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });
User.hasMany(Transaction, { as: 'createdTransactions', foreignKey: 'createdBy' });

// AuditLog belongs to User
AuditLog.belongsTo(User, { as: 'user', foreignKey: 'userId' });
User.hasMany(AuditLog, { as: 'auditLogs', foreignKey: 'userId' });

// TimeEntry belongs to Case
TimeEntry.belongsTo(Case, { as: 'case', foreignKey: 'caseId' });
Case.hasMany(TimeEntry, { as: 'timeEntries', foreignKey: 'caseId' });

// TimeEntry belongs to User
TimeEntry.belongsTo(User, { as: 'user', foreignKey: 'userId' });
User.hasMany(TimeEntry, { as: 'timeEntries', foreignKey: 'userId' });

// ClientPortalUser belongs to Client
ClientPortalUser.belongsTo(Client, { as: 'client', foreignKey: 'clientId' });
Client.hasOne(ClientPortalUser, { as: 'portalUser', foreignKey: 'clientId' });

module.exports = {
  User,
  Case,
  Session,
  Notification,
  Client,
  Invoice,
  Payment,
  LegalDocument,
  Transaction,
  AuditLog,
  TimeEntry,
  ClientPortalUser,
  FinancialEntry,
  CaseFeeAgreement,
  InvoiceLine
};
