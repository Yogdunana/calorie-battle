const config = require('../config/index');
const { error } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  // Log error in development
  if (config.isDev) {
    console.error('Error:', err);
  }

  // Sequelize validation errors
  if (err.name === 'SequelizeValidationError') {
    const messages = err.errors.map((e) => e.message);
    return error(res, 400, messages.join('; '));
  }

  // Sequelize unique constraint error
  if (err.name === 'SequelizeUniqueConstraintError') {
    const messages = err.errors.map((e) => e.message);
    return error(res, 400, messages.join('; '));
  }

  // Sequelize foreign key error
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return error(res, 400, '关联数据错误');
  }

  // JWT errors
  if (err.name === 'TokenExpiredError') {
    return error(res, 401, '令牌已过期');
  }
  if (err.name === 'JsonWebTokenError') {
    return error(res, 401, '无效的令牌');
  }

  // Multer errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return error(res, 400, '文件大小超出限制');
    }
    return error(res, 400, `文件上传错误: ${err.message}`);
  }

  // Default to 500
  const statusCode = err.statusCode || 500;
  const message = config.isProd ? '服务器内部错误' : (err.message || '服务器内部错误');

  return error(res, statusCode, message);
};

module.exports = errorHandler;
