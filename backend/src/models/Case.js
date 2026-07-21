const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Case = sequelize.define('Case', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  caseNumber: {
    type: DataTypes.STRING(50),
    allowNull: true,
    unique: true
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  type: {
    type: DataTypes.ENUM('civil', 'criminal', 'commercial', 'administrative', 'family', 'labor', 'other'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('active', 'pending', 'closed', 'won', 'lost', 'settled', 'appeal'),
    defaultValue: 'active'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    defaultValue: 'medium'
  },
  court: {
    type: DataTypes.STRING(100)
  },
  judge: {
    type: DataTypes.STRING(100)
  },
  opposingParty: {
    type: DataTypes.STRING(200)
  },
  opposingLawyer: {
    type: DataTypes.STRING(200)
  },
  clientName: {
    type: DataTypes.STRING(200)
  },
  clientPhone: {
    type: DataTypes.STRING(20)
  },
  clientEmail: {
    type: DataTypes.STRING(100)
  },
  filingDate: {
    type: DataTypes.DATEONLY
  },
  nextHearingDate: {
    type: DataTypes.DATE
  },
  closingDate: {
    type: DataTypes.DATEONLY
  },
  notes: {
    type: DataTypes.TEXT
  },
  documents: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  }
}, {
  timestamps: true
});

module.exports = Case;
