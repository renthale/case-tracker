const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const FinancialEntry = sequelize.define('FinancialEntry', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  type: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      isIn: [['professional_fee', 'case_expense', 'session_expense']]
    }
  },
  caseId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Cases', key: 'id' }
  },
  sessionId: {
    type: DataTypes.INTEGER,
    references: { model: 'Sessions', key: 'id' }
  },
  clientId: {
    type: DataTypes.INTEGER,
    references: { model: 'Clients', key: 'id' }
  },
  category: {
    type: DataTypes.STRING(60),
    allowNull: false
  },
  description: {
    type: DataTypes.STRING(300)
  },
  amount: {
    type: DataTypes.DECIMAL(10, 3),
    allowNull: false
  },
  entryDate: {
    type: DataTypes.DATEONLY,
    defaultValue: DataTypes.NOW
  },
  billable: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  billingStatus: {
    type: DataTypes.STRING(20),
    defaultValue: 'unbilled',
    validate: {
      isIn: [['unbilled', 'invoiced', 'paid']]
    }
  },
  paidBy: {
    type: DataTypes.STRING(20),
    validate: {
      isIn: [['firm', 'client_direct']]
    }
  },
  receiptUrl: {
    type: DataTypes.STRING(500)
  },
  notes: {
    type: DataTypes.TEXT
  }
}, {
  timestamps: true
});

module.exports = FinancialEntry;
