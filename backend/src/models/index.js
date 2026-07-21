const User = require('./User');
const Case = require('./Case');
const Session = require('./Session');
const Notification = require('./Notification');
const Client = require('./Client');
const Invoice = require('./Invoice');
const Payment = require('./Payment');
const LegalDocument = require('./LegalDocument');
const Transaction = require('./Transaction');

// Case belongs to User (assigned lawyer)
Case.belongsTo(User, { as: 'assignedLawyer', foreignKey: 'assignedLawyerId' });
User.hasMany(Case, { as: 'cases', foreignKey: 'assignedLawyerId' });

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

module.exports = {
  User,
  Case,
  Session,
  Notification,
  Client,
  Invoice,
  Payment,
  LegalDocument,
  Transaction
};
