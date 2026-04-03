const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Activity = sequelize.define('Activity', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  start_date: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  end_date: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  point_expire_date: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  checkin_enabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  voting_enabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  voting_start: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  voting_end: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  daily_vote_limit: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 3,
  },
}, {
  tableName: 'activities',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Activity;
