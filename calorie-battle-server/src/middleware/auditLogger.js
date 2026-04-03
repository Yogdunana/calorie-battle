const { AuditLog } = require('../models');

const auditLogger = (action) => {
  return async (req, res, next) => {
    // Store original res.json
    const originalJson = res.json.bind(res);

    res.json = function (data) {
      // Restore original
      res.json = originalJson;

      // Only log successful operations
      if (data && data.code >= 200 && data.code < 300 && req.user) {
        const auditData = req.auditLog || {};

        AuditLog.create({
          operator_id: req.user.id,
          operator_role: req.user.role,
          action: action || auditData.action || req.method,
          target_type: auditData.targetType || null,
          target_id: auditData.targetId || null,
          detail: auditData.detail || null,
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.headers['user-agent'] || null,
        }).catch(() => {
          // Silently fail audit logging
        });
      }

      return originalJson(data);
    };

    next();
  };
};

module.exports = auditLogger;
