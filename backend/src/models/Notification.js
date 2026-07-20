const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  caseId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Cases',
      key: 'id'
    }
  },
  sessionId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Sessions',
      key: 'id'
    }
  },
  type: {
    type: DataTypes.ENUM('case_update', 'session_reminder', 'session_scheduled', 'deadline', 'general'),
    allowNull: false
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high'),
    defaultValue: 'medium'
  },
  scheduledFor: {
    type: DataTypes.DATE
  }
}, {
  timestamps: true
});

module.exports = Notification;
