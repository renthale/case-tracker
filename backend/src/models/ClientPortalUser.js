const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const ClientPortalUser = sequelize.define('ClientPortalUser', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  clientId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: { model: 'Clients', key: 'id' }
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: { isEmail: true }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  lastLogin: {
    type: DataTypes.DATE
  },
  token: {
    type: DataTypes.STRING(500)
  },
  invitationToken: {
    type: DataTypes.STRING(500)
  },
  invitationTokenExpiry: {
    type: DataTypes.DATE
  },
  invitationSentAt: {
    type: DataTypes.DATE
  },
  passwordResetToken: {
    type: DataTypes.STRING(500)
  },
  passwordResetTokenExpiry: {
    type: DataTypes.DATE
  }
}, {
  timestamps: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    }
  }
});

ClientPortalUser.prototype.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

ClientPortalUser.prototype.hasValidInvitation = function () {
  return Boolean(
    this.invitationToken &&
    this.invitationTokenExpiry &&
    new Date(this.invitationTokenExpiry) > new Date() &&
    !this.password
  );
};

module.exports = ClientPortalUser;
