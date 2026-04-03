const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SensitiveWord = sequelize.define('SensitiveWord', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  word: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'general',
  },
}, {
  tableName: 'sensitive_words',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = SensitiveWord;
