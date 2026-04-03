const { verifyAccessToken, verifyRefreshToken } = require('../utils/jwt');
const { User } = require('../models');
const { error } = require('../utils/response');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return error(res, 401, '未提供认证令牌');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'account', 'username', 'role', 'status'],
    });

    if (!user) {
      return error(res, 401, '用户不存在');
    }

    if (user.status === 'locked') {
      return error(res, 401, '账号已被锁定，请稍后再试');
    }

    if (user.status === 'disabled') {
      return error(res, 401, '账号已被禁用');
    }

    req.user = {
      id: user.id,
      role: user.role,
      account: user.account,
      username: user.username,
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return error(res, 401, '令牌已过期，请重新登录');
    }
    if (err.name === 'JsonWebTokenError') {
      return error(res, 401, '无效的令牌');
    }
    next(err);
  }
};

const authOptional = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'account', 'username', 'role', 'status'],
    });

    if (user && user.status === 'active') {
      req.user = {
        id: user.id,
        role: user.role,
        account: user.account,
        username: user.username,
      };
    }
  } catch (err) {
    // Ignore errors for optional auth
  }
  next();
};

module.exports = {
  auth,
  authOptional,
};
