const { sequelize } = require('../models');
const { User, PointLog, Task } = require('../models');

const awardPoints = async (userId, checkinId, taskId, transaction) => {
  const task = await Task.findByPk(taskId, {
    attributes: ['id', 'points', 'name'],
    transaction,
  });

  if (!task || !task.points || task.points <= 0) {
    return null;
  }

  const user = await User.findByPk(userId, { transaction });
  if (!user) {
    throw new Error('用户不存在');
  }

  const newTotal = user.total_points + task.points;
  const newEarned = user.total_earned + task.points;

  await user.update(
    {
      total_points: newTotal,
      total_earned: newEarned,
      first_earned_at: user.first_earned_at || new Date(),
    },
    { transaction }
  );

  const pointLog = await PointLog.create(
    {
      user_id: userId,
      change_type: 'earn',
      change_amount: task.points,
      balance_after: newTotal,
      source_type: 'checkin',
      source_id: checkinId,
      remark: `打卡任务: ${task.name}`,
    },
    { transaction }
  );

  return {
    points: task.points,
    balance: newTotal,
    pointLog,
  };
};

const deductPoints = async (userId, amount, sourceType, sourceId, transaction) => {
  const user = await User.findByPk(userId, { transaction });
  if (!user) {
    throw new Error('用户不存在');
  }

  if (user.total_points < amount) {
    throw new Error('积分不足');
  }

  const newTotal = user.total_points - amount;
  const newUsed = user.total_used + amount;

  await user.update(
    {
      total_points: newTotal,
      total_used: newUsed,
    },
    { transaction }
  );

  const pointLog = await PointLog.create(
    {
      user_id: userId,
      change_type: 'redeem',
      change_amount: -amount,
      balance_after: newTotal,
      source_type: sourceType,
      source_id: sourceId,
      remark: `兑换商品`,
    },
    { transaction }
  );

  return {
    points: amount,
    balance: newTotal,
    pointLog,
  };
};

const expirePoints = async (userId, transaction) => {
  const user = await User.findByPk(userId, { transaction });
  if (!user) {
    throw new Error('用户不存在');
  }

  if (user.total_points <= 0) {
    return null;
  }

  const expiredPoints = user.total_points;

  await user.update(
    {
      total_points: 0,
    },
    { transaction }
  );

  const pointLog = await PointLog.create(
    {
      user_id: userId,
      change_type: 'expire',
      change_amount: -expiredPoints,
      balance_after: 0,
      source_type: 'system',
      source_id: null,
      remark: '活动结束后积分过期',
    },
    { transaction }
  );

  return {
    expiredPoints,
    pointLog,
  };
};

const adjustPoints = async (userId, amount, remark, operatorId, transaction) => {
  const user = await User.findByPk(userId, { transaction });
  if (!user) {
    throw new Error('用户不存在');
  }

  const newTotal = user.total_points + amount;

  if (amount > 0) {
    await user.update(
      {
        total_points: newTotal,
        total_earned: user.total_earned + amount,
      },
      { transaction }
    );
  } else {
    await user.update(
      {
        total_points: newTotal,
        total_used: user.total_used + Math.abs(amount),
      },
      { transaction }
    );
  }

  const pointLog = await PointLog.create(
    {
      user_id: userId,
      change_type: 'admin_adjust',
      change_amount: amount,
      balance_after: newTotal,
      source_type: 'admin',
      source_id: null,
      remark: remark || '管理员手动调整积分',
      operator_id: operatorId,
    },
    { transaction }
  );

  return {
    points: amount,
    balance: newTotal,
    pointLog,
  };
};

module.exports = {
  awardPoints,
  deductPoints,
  expirePoints,
  adjustPoints,
};
