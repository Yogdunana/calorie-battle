const { Sequelize } = require('sequelize');
const path = require('path');
const config = require('./index');

// Ensure data directory exists
const fs = require('fs');
const dbDir = path.dirname(config.db.storage);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const sequelize = new Sequelize({
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

module.exports = sequelize;
