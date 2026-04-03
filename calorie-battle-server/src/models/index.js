const sequelize = require('../config/database');

const User = require('./User');
const Task = require('./Task');
const Checkin = require('./Checkin');
const WeightRecord = require('./WeightRecord');
const PointLog = require('./PointLog');
const RedemptionItem = require('./RedemptionItem');
const Redemption = require('./Redemption');
const PhotoWork = require('./PhotoWork');
const Vote = require('./Vote');
const AuditLog = require('./AuditLog');
const Activity = require('./Activity');
const SystemConfig = require('./SystemConfig');
const SensitiveWord = require('./SensitiveWord');
const Announcement = require('./Announcement');

// User associations
User.hasMany(Checkin, { foreignKey: 'user_id', as: 'checkins' });
User.hasMany(PointLog, { foreignKey: 'user_id', as: 'pointLogs' });
User.hasMany(Redemption, { foreignKey: 'user_id', as: 'redemptions' });
User.hasMany(WeightRecord, { foreignKey: 'user_id', as: 'weightRecords' });
User.hasMany(PhotoWork, { foreignKey: 'user_id', as: 'photoWorks' });
User.hasMany(Vote, { foreignKey: 'user_id', as: 'votes' });
User.hasMany(AuditLog, { foreignKey: 'operator_id', as: 'auditLogs' });

// Task associations
Task.hasMany(Checkin, { foreignKey: 'task_id', as: 'checkins' });

// Checkin associations
Checkin.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Checkin.belongsTo(Task, { foreignKey: 'task_id', as: 'task' });
Checkin.belongsTo(User, { foreignKey: 'reviewed_by', as: 'reviewer' });

// PointLog associations
PointLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// RedemptionItem associations
RedemptionItem.hasMany(Redemption, { foreignKey: 'item_id', as: 'redemptions' });

// Redemption associations
Redemption.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Redemption.belongsTo(RedemptionItem, { foreignKey: 'item_id', as: 'item' });
Redemption.belongsTo(User, { foreignKey: 'redeemed_by', as: 'redeemer' });

// WeightRecord associations
WeightRecord.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
WeightRecord.belongsTo(User, { foreignKey: 'reviewed_by', as: 'reviewer' });

// PhotoWork associations
PhotoWork.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
PhotoWork.hasMany(Vote, { foreignKey: 'photo_work_id', as: 'votes' });
PhotoWork.belongsTo(User, { foreignKey: 'reviewed_by', as: 'reviewer' });

// Vote associations
Vote.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Vote.belongsTo(PhotoWork, { foreignKey: 'photo_work_id', as: 'photoWork' });

// AuditLog associations
AuditLog.belongsTo(User, { foreignKey: 'operator_id', as: 'operator' });

module.exports = {
  User,
  Task,
  Checkin,
  WeightRecord,
  PointLog,
  RedemptionItem,
  Redemption,
  PhotoWork,
  Vote,
  AuditLog,
  Activity,
  SystemConfig,
  SensitiveWord,
  Announcement,
  sequelize,
};
