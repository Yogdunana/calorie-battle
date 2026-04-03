const path = require('path');

// Auto-detect database dialect from environment
const useMysql = !!process.env.DB_HOST;

module.exports = {
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: (process.env.NODE_ENV || 'development') === 'development',
  isProd: process.env.NODE_ENV === 'production',

  db: useMysql ? {
    // MySQL (production / CI)
    dialect: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    name: process.env.DB_NAME || 'calorie_battle',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
  } : {
    // SQLite (local development)
    dialect: 'sqlite',
    storage: process.env.DB_STORAGE || path.join(__dirname, '../../data/calorie_battle.db'),
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'calorie-battle-jwt-secret-key-2026',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'calorie-battle-refresh-secret-key-2026',
    expiresIn: process.env.JWT_EXPIRES_IN || '2h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  upload: {
    dir: process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads'),
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 10485760,
  },

  smtp: {
    host: process.env.SMTP_HOST || 'smtp.feishu.cn',
    port: parseInt(process.env.SMTP_PORT, 10) || 465,
    secure: true,
    user: process.env.SMTP_USER || 'noreply@yogdunana.com',
    pass: process.env.SMTP_PASS || '',
    from: `"卡路里大作战" <${process.env.SMTP_USER || 'noreply@yogdunana.com'}>`,
  },
};
