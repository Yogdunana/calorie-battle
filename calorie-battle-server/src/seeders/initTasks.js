const { Task } = require('../models');

const seedTasks = async () => {
  const count = await Task.count();
  if (count > 0) {
    console.log('[Seeder] Tasks already exist, skipping.');
    return;
  }

  const tasks = [
    {
      category: '跑步',
      name: '跑步打卡',
      description: '完成跑步运动并提交打卡记录',
      points: 2,
      submit_rules: { image_required: true, description: '请上传跑步截图或运动轨迹截图' },
      required_fields: ['images'],
      is_active: true,
      sort_order: 1,
    },
    {
      category: '趣味运动',
      name: '摸高挑战',
      description: '完成摸高挑战并提交打卡记录',
      points: 1,
      submit_rules: { image_required: true, description: '请上传摸高挑战照片' },
      required_fields: ['images'],
      is_active: true,
      sort_order: 2,
    },
    {
      category: '趣味运动',
      name: '跳绳300个',
      description: '完成300个跳绳并提交打卡记录',
      points: 1,
      submit_rules: { image_required: true, description: '请上传跳绳打卡照片' },
      required_fields: ['images'],
      is_active: true,
      sort_order: 3,
    },
    {
      category: '趣味运动',
      name: '毽子踢10下',
      description: '完成踢毽子10下并提交打卡记录',
      points: 1,
      submit_rules: { image_required: true, description: '请上传踢毽子打卡照片' },
      required_fields: ['images'],
      is_active: true,
      sort_order: 4,
    },
    {
      category: '趣味运动',
      name: '呼啦圈20圈',
      description: '完成呼啦圈20圈并提交打卡记录',
      points: 1,
      submit_rules: { image_required: true, description: '请上传呼啦圈打卡照片' },
      required_fields: ['images'],
      is_active: true,
      sort_order: 5,
    },
    {
      category: '趣味运动',
      name: '投壶10中4',
      description: '完成投壶挑战（10中4）并提交打卡记录',
      points: 1,
      submit_rules: { image_required: true, description: '请上传投壶打卡照片' },
      required_fields: ['images'],
      is_active: true,
      sort_order: 6,
    },
    {
      category: '跑步',
      name: '跑跑团参与',
      description: '参与跑跑团活动并提交打卡记录',
      points: 2,
      submit_rules: { image_required: true, description: '请上传跑跑团活动照片' },
      required_fields: ['images'],
      is_active: true,
      sort_order: 7,
    },
    {
      category: '课程',
      name: '普拉提课程',
      description: '参与普拉提课程并提交打卡记录',
      points: 2,
      submit_rules: { image_required: true, description: '请上传课程参与照片' },
      required_fields: ['images'],
      is_active: true,
      sort_order: 8,
    },
    {
      category: '课程',
      name: '拳击武术课程',
      description: '参与拳击武术课程并提交打卡记录',
      points: 2,
      submit_rules: { image_required: true, description: '请上传课程参与照片' },
      required_fields: ['images'],
      is_active: true,
      sort_order: 9,
    },
    {
      category: '课程',
      name: '中医养生课堂',
      description: '参与中医养生课堂并提交打卡记录',
      points: 2,
      submit_rules: { image_required: true, description: '请上传课堂参与照片' },
      required_fields: ['images'],
      is_active: true,
      sort_order: 10,
    },
    {
      category: '轻盈计划',
      name: '轻盈计划',
      description: '参与轻盈计划体重管理，提交体重截图由管理员审核',
      points: 0,
      submit_rules: { image_required: true, description: '请上传体重秤截图，由管理员审核录入数据', special_handling: true },
      required_fields: ['images'],
      is_active: true,
      sort_order: 11,
    },
  ];

  await Task.bulkCreate(tasks);
  console.log(`[Seeder] ${tasks.length} default tasks created.`);
};

module.exports = seedTasks;
