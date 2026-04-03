const { Activity } = require('../models');

const seedActivity = async () => {
  const existing = await Activity.findOne({ where: { id: 1 } });
  if (existing) {
    console.log('[Seeder] Activity config already exists, skipping.');
    return;
  }

  await Activity.create({
    id: 1,
    name: '卡路里大作战',
    description: '校园健身活动 - 卡路里大作战，通过运动打卡赢取积分和奖品',
    start_date: '2026-03-30',
    end_date: '2026-04-30',
    point_expire_date: '2026-05-07',
    checkin_enabled: true,
    voting_enabled: false,
    daily_vote_limit: 3,
  });

  console.log('[Seeder] Default activity config created.');
};

module.exports = seedActivity;
