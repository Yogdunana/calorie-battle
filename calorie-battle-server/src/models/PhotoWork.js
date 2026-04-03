const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PhotoWork = sequelize.define('PhotoWork', {
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
  title: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  image_url: {
    type: DataTypes.STRING(500),
    allowNull: false,
  },
  vote_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  status: {
    // ENUM('pending', 'approved', 'rejected')
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'pending',
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
  tableName: 'photo_works',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = PhotoWork;
