const { RedemptionItem } = require('../models');

const seedItems = async () => {
  const count = await RedemptionItem.count();
  if (count > 0) {
    console.log('[Seeder] Redemption items already exist, skipping.');
    return;
  }

  const items = [
    {
      name: '沙拉',
      description: '健康沙拉一份',
      points_required: 5,
      stock: 50,
      rules: '每人每天限兑换1次',
      redeem_location: '食堂一楼',
      is_active: true,
      sort_order: 1,
    },
    {
      name: '三明治',
      description: '健康三明治一份',
      points_required: 5,
      stock: 50,
      rules: '每人每天限兑换1次',
      redeem_location: '食堂一楼',
      is_active: true,
      sort_order: 2,
    },
    {
      name: '无绳跳绳',
      description: '40元档（轻盈计划1-3kg奖励）',
      points_required: 0,
      stock: 0,
      rules: '轻盈计划减重1-3kg奖励，由管理员分配',
      redeem_location: '活动中心',
      is_active: true,
      sort_order: 3,
    },
    {
      name: '运动水杯',
      description: '80元档（轻盈计划3-6kg奖励）',
      points_required: 0,
      stock: 0,
      rules: '轻盈计划减重3-6kg奖励，由管理员分配',
      redeem_location: '活动中心',
      is_active: true,
      sort_order: 4,
    },
    {
      name: '筋膜枪',
      description: '130元档（轻盈计划6kg+奖励）',
      points_required: 0,
      stock: 0,
      rules: '轻盈计划减重6kg以上奖励，由管理员分配',
      redeem_location: '活动中心',
      is_active: true,
      sort_order: 5,
    },
  ];

  await RedemptionItem.bulkCreate(items);
  console.log(`[Seeder] ${items.length} default redemption items created.`);
};

module.exports = seedItems;
