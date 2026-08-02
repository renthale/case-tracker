const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const InvoiceLine = sequelize.define('InvoiceLine', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  invoiceId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Invoices', key: 'id' }
  },
  description: {
    type: DataTypes.STRING(300),
    allowNull: false
  },
  quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  unitPrice: {
    type: DataTypes.DECIMAL(10, 3),
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(10, 3),
    allowNull: false
  },
  sourceType: {
    type: DataTypes.STRING(20)
  },
  sourceId: {
    type: DataTypes.INTEGER
  }
}, {
  timestamps: true
});

module.exports = InvoiceLine;
