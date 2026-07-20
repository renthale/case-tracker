const User = require('./User');
const Case = require('./Case');
const Session = require('./Session');
const Notification = require('./Notification');

// Case belongs to User (assigned lawyer)
Case.belongsTo(User, { as: 'assignedLawyer', foreignKey: 'assignedLawyerId' });
User.hasMany(Case, { as: 'cases', foreignKey: 'assignedLawyerId' });

// Session belongs to Case
Session.belongsTo(Case, { foreignKey: 'caseId' });
Case.hasMany(Session, { as: 'sessions', foreignKey: 'caseId' });

// Notification belongs to User
Notification.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Notification, { as: 'notifications', foreignKey: 'userId' });

// Notification belongs to Case (optional)
Notification.belongsTo(Case, { foreignKey: 'caseId' });
Case.hasMany(Notification, { as: 'notifications', foreignKey: 'caseId' });

// Notification belongs to Session (optional)
Notification.belongsTo(Session, { foreignKey: 'sessionId' });
Session.hasMany(Notification, { as: 'notifications', foreignKey: 'sessionId' });

module.exports = {
  User,
  Case,
  Session,
  Notification
};
