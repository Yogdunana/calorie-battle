const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WeightRecord = sequelize.define('WeightRecord', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  record_type: {
    // ENUM('initial', 'final')
    type: DataTypes.STRING,
    allowNull: false,
  },
  screenshot_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  weight: {
    // DECIMAL(5, 1)
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  body_fat: {
    // DECIMAL(4, 1)
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  status: {
    // ENUM('pending', 'approved', 'rejected')
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'pending',
  },
  reject_reason: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  reviewed_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  reviewed_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'weight_records',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = WeightRecord;
