const jwt = require('jsonwebtoken');
const User = require('../models/User');

const canManageCases = ['admin', 'partner', 'lawyer'];
const canViewAllCases = ['admin', 'partner'];
const canManageInvoices = ['admin', 'partner', 'legal_secretary'];
const canManageDocuments = ['admin', 'partner', 'lawyer', 'legal_consultant', 'trainee_lawyer'];
const canViewCourtSessions = ['admin', 'partner', 'lawyer', 'court_agent', 'trainee_lawyer'];
const canManageTransactions = ['admin', 'partner', 'transactions_agent'];
const canManageUsers = ['admin', 'partner'];

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'يرجى تسجيل الدخول للوصول' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'المستخدم غير موجود أو معطل' });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({ error: 'غير مصرح' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'ليس لديك صلاحية للوصول' });
    }
    next();
  };
};

module.exports = {
  auth,
  authorize,
  canManageCases,
  canViewAllCases,
  canManageInvoices,
  canManageDocuments,
  canViewCourtSessions,
  canManageTransactions,
  canManageUsers
};
