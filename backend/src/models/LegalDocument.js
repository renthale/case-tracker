const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LegalDocument = sequelize.define('LegalDocument', {
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
  title: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('contract', 'petition', 'judgment', 'evidence', 'correspondence', 'memo', 'other'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('draft', 'under_review', 'approved', 'archived'),
    defaultValue: 'draft'
  },
  content: {
    type: DataTypes.TEXT
  },
  fileUrl: {
    type: DataTypes.STRING(500)
  },
  uploadedBy: {
    type: DataTypes.INTEGER,
    references: { model: 'Users', key: 'id' }
  },
  reviewDate: {
    type: DataTypes.DATEONLY
  },
  approvedBy: {
    type: DataTypes.INTEGER,
    references: { model: 'Users', key: 'id' }
  },
  approvalDate: {
    type: DataTypes.DATEONLY
  },
  notes: {
    type: DataTypes.TEXT
  }
}, {
  timestamps: true
});

module.exports = LegalDocument;
