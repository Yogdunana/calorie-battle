const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Vote = sequelize.define('Vote', {
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
  photo_work_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'photo_works',
      key: 'id',
    },
  },
}, {
  tableName: 'votes',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'photo_work_id'],
      name: 'votes_user_photo_unique',
    },
    {
      fields: ['user_id'],
      name: 'votes_user_id_idx',
    },
    {
      fields: ['created_at'],
      name: 'votes_created_at_idx',
    },
  ],
});

module.exports = Vote;
