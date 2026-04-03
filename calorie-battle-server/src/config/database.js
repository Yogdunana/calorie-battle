const { Sequelize } = require('sequelize');
const path = require('path');
const config = require('./index');

// Ensure data directory exists (for SQLite)
const fs = require('fs');

let sequelize;

if (config.db.dialect === 'mysql') {
  // MySQL configuration (production / CI)
  sequelize = new Sequelize(config.db.name, config.db.user, config.db.password, {
    host: config.db.host,
    port: config.db.port,
    dialect: 'mysql',
    logging: false,
    define: {
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
    timezone: '+08:00',
  });
} else {
  // SQLite configuration (development / local testing)
  const dbDir = path.dirname(config.db.storage);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: config.db.storage,
    logging: false,
    define: {
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  });
}

module.exports = sequelize;
