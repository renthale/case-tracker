const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  invoiceId: {
    type: DataTypes.INTEGER,
    references: { model: 'Invoices', key: 'id' }
  },
  caseId: {
    type: DataTypes.INTEGER,
    references: { model: 'Cases', key: 'id' }
  },
  clientId: {
    type: DataTypes.INTEGER,
    references: { model: 'Clients', key: 'id' }
  },
  amount: {
    type: DataTypes.DECIMAL(10, 3),
    allowNull: false
  },
  paymentDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  paymentMethod: {
    type: DataTypes.ENUM('cash', 'bank_transfer', 'check', 'credit_card', 'knet', 'other'),
    defaultValue: 'cash'
  },
  referenceNumber: {
    type: DataTypes.STRING(100)
  },
  notes: {
    type: DataTypes.TEXT
  }
}, {
  timestamps: true
});

module.exports = Payment;
