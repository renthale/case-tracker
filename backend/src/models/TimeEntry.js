const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TimeEntry = sequelize.define('TimeEntry', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  caseId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Cases', key: 'id' }
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Users', key: 'id' }
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  hours: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    validate: { min: 0.25, max: 24 }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  billable: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  rate: {
    type: DataTypes.DECIMAL(10, 3),
    defaultValue: 0,
    comment: 'Hourly rate in KWD'
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 3),
    defaultValue: 0,
    comment: 'hours * rate'
  },
  status: {
    type: DataTypes.ENUM('draft', 'submitted', 'approved', 'billed'),
    defaultValue: 'draft'
  },
  category: {
    type: DataTypes.STRING(50),
    defaultValue: 'general',
    comment: 'consultation, court, research, drafting, meeting, travel'
  },
  notes: {
    type: DataTypes.TEXT
  }
}, {
  timestamps: true,
  hooks: {
    beforeCreate: (entry) => {
      entry.totalAmount = parseFloat(entry.hours) * parseFloat(entry.rate);
    },
    beforeUpdate: (entry) => {
      if (entry.changed('hours') || entry.changed('rate')) {
        entry.totalAmount = parseFloat(entry.hours) * parseFloat(entry.rate);
      }
    }
  }
});

module.exports = TimeEntry;
