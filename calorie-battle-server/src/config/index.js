const path = require('path');

module.exports = {
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: (process.env.NODE_ENV || 'development') === 'development',
  isProd: process.env.NODE_ENV === 'production',

  db: {
    storage: process.env.DB_STORAGE || path.join(__dirname, '../../data/calorie_battle.db'),
    dialect: 'sqlite',
    dialectModule: require('better-sqlite3'),
    logging: false,
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
};
