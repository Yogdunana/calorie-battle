const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Redemption = sequelize.define('Redemption', {
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
  item_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'redemption_items',
      key: 'id',
    },
  },
  code: {
    type: DataTypes.STRING(32),
    allowNull: false,
    unique: true,
  },
  points_cost: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  status: {
    // ENUM('pending', 'redeemed', 'expired')
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'pending',
  },
  redeemed_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  redeemed_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  expire_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'redemptions',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Redemption;
