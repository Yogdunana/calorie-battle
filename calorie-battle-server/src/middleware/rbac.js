const { error } = require('../utils/response');

const rbac = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return error(res, 401, '未认证');
    }

    // Admin has access to everything
    if (req.user.role === 'admin') {
      return next();
    }

    if (roles.includes(req.user.role)) {
      return next();
    }

    return error(res, 403, '权限不足，无法访问该资源');
  };
};

module.exports = rbac;
