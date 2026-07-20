const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Session = sequelize.define('Session', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  caseId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Cases',
      key: 'id'
    }
  },
  sessionNumber: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  time: {
    type: DataTypes.TIME
  },
  location: {
    type: DataTypes.STRING(200)
  },
  status: {
    type: DataTypes.ENUM('scheduled', 'completed', 'postponed', 'cancelled'),
    defaultValue: 'scheduled'
  },
  outcome: {
    type: DataTypes.TEXT
  },
  nextSessionDate: {
    type: DataTypes.DATE
  },
  notes: {
    type: DataTypes.TEXT
  },
  documents: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  remindersSent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  timestamps: true
});

module.exports = Session;
