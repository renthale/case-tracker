const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Invoice = sequelize.define('Invoice', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  invoiceNumber: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false
  },
  clientId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Clients', key: 'id' }
  },
  caseId: {
    type: DataTypes.INTEGER,
    references: { model: 'Cases', key: 'id' }
  },
  type: {
    type: DataTypes.ENUM('consultation', 'case_fees', 'court_fees', 'document_fees', 'other'),
    defaultValue: 'case_fees'
  },
  status: {
    type: DataTypes.ENUM('pending', 'paid', 'overdue', 'cancelled'),
    defaultValue: 'pending'
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 3),
    allowNull: false,
    defaultValue: 0
  },
  paidAmount: {
    type: DataTypes.DECIMAL(10, 3),
    defaultValue: 0
  },
  taxRate: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0
  },
  taxAmount: {
    type: DataTypes.DECIMAL(10, 3),
    defaultValue: 0
  },
  discount: {
    type: DataTypes.DECIMAL(10, 3),
    defaultValue: 0
  },
  notes: {
    type: DataTypes.TEXT
  },
  dueDate: {
    type: DataTypes.DATEONLY
  },
  issuedDate: {
    type: DataTypes.DATEONLY,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: true
});

module.exports = Invoice;
