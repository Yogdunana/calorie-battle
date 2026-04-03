const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Checkin = sequelize.define('Checkin', {
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
  task_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tasks',
      key: 'id',
    },
  },
  submit_data: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  images: {
    type: DataTypes.JSON,
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
  points_awarded: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  tableName: 'checkins',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Checkin;
