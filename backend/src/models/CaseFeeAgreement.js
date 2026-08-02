const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CaseFeeAgreement = sequelize.define('CaseFeeAgreement', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  caseId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: { model: 'Cases', key: 'id' }
  },
  feeArrangement: {
    type: DataTypes.STRING(30),
    allowNull: false,
    defaultValue: 'fixed_fee',
    validate: {
      isIn: [['fixed_fee', 'per_session', 'hourly', 'monthly_retainer', 'stage_based', 'custom']]
    }
  },
  agreedAmount: {
    type: DataTypes.DECIMAL(10, 3),
    defaultValue: 0
  },
  currency: {
    type: DataTypes.STRING(10),
    defaultValue: 'KWD'
  },
  startDate: {
    type: DataTypes.DATEONLY
  },
  paymentTerms: {
    type: DataTypes.TEXT
  },
  notes: {
    type: DataTypes.TEXT
  }
}, {
  timestamps: true
});

module.exports = CaseFeeAgreement;
