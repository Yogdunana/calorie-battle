const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  account: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  role: {
    // ENUM('user', 'reviewer', 'admin')
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'user',
  },
  avatar: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    unique: true,
  },
  status: {
    // ENUM('active', 'locked', 'disabled')
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'active',
  },
  login_fail_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  locked_until: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  total_points: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  total_earned: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  total_used: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  first_earned_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'users',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = User;
