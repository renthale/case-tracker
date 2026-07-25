const AuditLog = require('../models/AuditLog');

const logAction = async (userId, action, entityType, entityId, options = {}) => {
  try {
    await AuditLog.create({
      userId,
      action,
      entityType,
      entityId,
      entityName: options.entityName || null,
      oldValues: options.oldValues || null,
      newValues: options.newValues || null,
      ipAddress: options.ipAddress || null,
      userAgent: options.userAgent || null,
      notes: options.notes || null
    });
  } catch (error) {
    console.error('Audit log error:', error);
  }
};

const auditLog = (entityType) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = async function (body) {
      try {
        if (res.statusCode >= 400) {
          return originalJson(body);
        }

        const action = getAction(req.method);
        const userId = req.user?.id;
        if (!userId) return originalJson(body);

        const entityId = req.params?.id || body?.id || body?.case?.id || body?.session?.id || body?.document?.id || body?.invoice?.id;
        const entityName = body?.message || body?.title || null;

        let oldValues = null;
        let newValues = null;

        if (action === 'UPDATE' && req._oldValues) {
          oldValues = req._oldValues;
          newValues = req.body;
        } else if (action === 'CREATE') {
          newValues = req.body;
        }

        await logAction(userId, action, entityType, entityId, {
          entityName,
          oldValues,
          newValues,
          ipAddress: req.ip || req.connection?.remoteAddress,
          userAgent: req.get('user-agent')
        });
      } catch (error) {
        console.error('Audit middleware error:', error);
      }

      return originalJson(body);
    };

    next();
  };
};

const getAction = (method) => {
  switch (method) {
    case 'POST': return 'CREATE';
    case 'PUT':
    case 'PATCH': return 'UPDATE';
    case 'DELETE': return 'DELETE';
    default: return 'READ';
  }
};

const captureOldValues = (model) => {
  return async (req, res, next) => {
    if (req.method === 'PUT' || req.method === 'PATCH') {
      try {
        const record = await model.findByPk(req.params.id);
        if (record) {
          req._oldValues = record.toJSON();
        }
      } catch (error) {
        // Ignore errors
      }
    }
    next();
  };
};

module.exports = { auditLog, logAction, captureOldValues };
