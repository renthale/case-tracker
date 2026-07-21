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
    type: DataTypes.ENUM('civil', 'criminal', 'commercial', 'administrative', 'family', 'labor', 'sharia', 'traffic', 'other'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('active', 'pending', 'closed', 'won', 'lost', 'settled', 'appeal', 'retrial', 'dismissed'),
    defaultValue: 'active'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    defaultValue: 'medium'
  },
  courtType: {
    type: DataTypes.ENUM(
      'courtOfFirstInstance', 'familyCourt', 'criminalCourt',
      'commercialCourt', 'laborCourt', 'administrativeCourt',
      'appealCourt', 'cassationCourt', 'highConstitutionalCourt'
    )
  },
  court: {
    type: DataTypes.STRING(100)
  },
  department: {
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
  opposingCivilId: {
    type: DataTypes.STRING(20)
  },
  clientName: {
    type: DataTypes.STRING(200)
  },
  clientCivilId: {
    type: DataTypes.STRING(20)
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
  verdict: {
    type: DataTypes.TEXT
  },
  verdictDate: {
    type: DataTypes.DATEONLY
  },
  appealDate: {
    type: DataTypes.DATEONLY
  },
  caseFees: {
    type: DataTypes.DECIMAL(10, 3),
    defaultValue: 0
  },
  notes: {
    type: DataTypes.TEXT
  },
  clientId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Clients',
      key: 'id'
    }
  },
  secondaryLawyerId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  documents: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  assignmentDate: {
    type: DataTypes.DATEONLY
  },
  assignmentEndDate: {
    type: DataTypes.DATEONLY
  },
  filingType: {
    type: DataTypes.STRING(20),
    defaultValue: 'new'
  },
  lastEditedBy: {
    type: DataTypes.INTEGER,
    references: { model: 'Users', key: 'id' }
  },
  lastEditedAt: {
    type: DataTypes.DATE
  }
}, {
  timestamps: true
});

module.exports = Case;
