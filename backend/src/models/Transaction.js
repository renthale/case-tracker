const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Transaction = sequelize.define('Transaction', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  // Legacy fields (keep for DB compatibility)
  type: {
    type: DataTypes.STRING(50),
    defaultValue: 'government_transaction'
  },
  amount: {
    type: DataTypes.DECIMAL(10, 3),
    defaultValue: 0
  },
  caseId: {
    type: DataTypes.INTEGER,
    references: { model: 'Cases', key: 'id' }
  },
  clientId: {
    type: DataTypes.INTEGER,
    references: { model: 'Clients', key: 'id' }
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  governmentEntity: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  entityType: {
    type: DataTypes.STRING(50),
    defaultValue: 'other'
  },
  status: {
    type: DataTypes.STRING(30),
    defaultValue: 'submitted'
  },
  submissionDate: {
    type: DataTypes.DATEONLY,
    defaultValue: DataTypes.NOW
  },
  expectedDate: {
    type: DataTypes.DATEONLY
  },
  completionDate: {
    type: DataTypes.DATEONLY
  },
  notes: {
    type: DataTypes.TEXT
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Users', key: 'id' }
  }
}, {
  timestamps: true
});

module.exports = Transaction;
