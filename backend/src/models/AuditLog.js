const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Users', key: 'id' }
  },
  action: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: 'CREATE, UPDATE, DELETE, LOGIN, LOGOUT'
  },
  entityType: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'Case, Session, Invoice, Payment, User, Client, etc.'
  },
  entityId: {
    type: DataTypes.INTEGER
  },
  entityName: {
    type: DataTypes.STRING(200),
    comment: 'Human-readable name/title of the entity'
  },
  oldValues: {
    type: DataTypes.JSONB,
    comment: 'Changed fields before update'
  },
  newValues: {
    type: DataTypes.JSONB,
    comment: 'Changed fields after update'
  },
  ipAddress: {
    type: DataTypes.STRING(45)
  },
  userAgent: {
    type: DataTypes.TEXT
  },
  notes: {
    type: DataTypes.TEXT
  }
}, {
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['entityType', 'entityId'] },
    { fields: ['action'] },
    { fields: ['createdAt'] }
  ]
});

module.exports = AuditLog;
