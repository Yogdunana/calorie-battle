const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PointLog = sequelize.define('PointLog', {
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
  change_type: {
    // ENUM('earn', 'redeem', 'expire', 'admin_adjust')
    type: DataTypes.STRING,
    allowNull: false,
  },
  change_amount: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  balance_after: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  source_type: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  source_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  remark: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  operator_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  tableName: 'point_logs',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = PointLog;
