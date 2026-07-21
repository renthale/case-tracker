const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Transaction = sequelize.define('Transaction', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
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
    type: DataTypes.ENUM('ministry_of_justice', 'awqaf', 'general_sec', 'kuwait_municipality', 'paci', 'embassy', 'court', 'other'),
    defaultValue: 'other'
  },
  status: {
    type: DataTypes.ENUM('submitted', 'processing', 'completed', 'rejected', 'pending'),
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
