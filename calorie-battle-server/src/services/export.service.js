const ExcelJS = require('exceljs');
const { Checkin, PointLog, Redemption, User, Task, RedemptionItem } = require('../models');
const sequelize = require('../config/database');
const dayjs = require('dayjs');

const exportCheckins = async (filters = {}) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('打卡记录');

  sheet.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: '用户账号', key: 'account', width: 15 },
    { header: '用户名', key: 'username', width: 15 },
    { header: '任务名称', key: 'task_name', width: 20 },
    { header: '任务分类', key: 'category', width: 15 },
    { header: '状态', key: 'status', width: 10 },
    { header: '获得积分', key: 'points_awarded', width: 10 },
    { header: '提交时间', key: 'created_at', width: 20 },
    { header: '审核时间', key: 'reviewed_at', width: 20 },
    { header: '驳回原因', key: 'reject_reason', width: 25 },
  ];

  const where = {};
  if (filters.status) where.status = filters.status;
  if (filters.task_id) where.task_id = filters.task_id;
  if (filters.start_date && filters.end_date) {
    where.created_at = {
      [sequelize.Op.between]: [filters.start_date, filters.end_date],
    };
  }

  const checkins = await Checkin.findAll({
    where,
    include: [
      { model: User, as: 'user', attributes: ['account', 'username'] },
      { model: Task, as: 'task', attributes: ['name', 'category'] },
    ],
    order: [['created_at', 'DESC']],
  });

  const statusMap = { pending: '待审核', approved: '已通过', rejected: '已驳回' };

  checkins.forEach((c) => {
    sheet.addRow({
      id: c.id,
      account: c.user ? c.user.account : '',
      username: c.user ? c.user.username : '',
      task_name: c.task ? c.task.name : '',
      category: c.task ? c.task.category : '',
      status: statusMap[c.status] || c.status,
      points_awarded: c.points_awarded || 0,
      created_at: dayjs(c.created_at).format('YYYY-MM-DD HH:mm:ss'),
      reviewed_at: c.reviewed_at ? dayjs(c.reviewed_at).format('YYYY-MM-DD HH:mm:ss') : '',
      reject_reason: c.reject_reason || '',
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

const exportPoints = async (filters = {}) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('积分记录');

  sheet.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: '用户账号', key: 'account', width: 15 },
    { header: '用户名', key: 'username', width: 15 },
    { header: '变动类型', key: 'change_type', width: 12 },
    { header: '变动数量', key: 'change_amount', width: 10 },
    { header: '变动后余额', key: 'balance_after', width: 12 },
    { header: '来源类型', key: 'source_type', width: 12 },
    { header: '备注', key: 'remark', width: 25 },
    { header: '时间', key: 'created_at', width: 20 },
  ];

  const where = {};
  if (filters.user_id) where.user_id = filters.user_id;
  if (filters.change_type) where.change_type = filters.change_type;
  if (filters.start_date && filters.end_date) {
    where.created_at = {
      [sequelize.Op.between]: [filters.start_date, filters.end_date],
    };
  }

  const logs = await PointLog.findAll({
    where,
    include: [
      { model: User, as: 'user', attributes: ['account', 'username'] },
    ],
    order: [['created_at', 'DESC']],
  });

  const typeMap = { earn: '获得', redeem: '兑换', expire: '过期', admin_adjust: '管理员调整' };

  logs.forEach((log) => {
    sheet.addRow({
      id: log.id,
      account: log.user ? log.user.account : '',
      username: log.user ? log.user.username : '',
      change_type: typeMap[log.change_type] || log.change_type,
      change_amount: log.change_amount,
      balance_after: log.balance_after,
      source_type: log.source_type || '',
      remark: log.remark || '',
      created_at: dayjs(log.created_at).format('YYYY-MM-DD HH:mm:ss'),
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

const exportRedemptions = async (filters = {}) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('兑换记录');

  sheet.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: '用户账号', key: 'account', width: 15 },
    { header: '用户名', key: 'username', width: 15 },
    { header: '商品名称', key: 'item_name', width: 20 },
    { header: '兑换码', key: 'code', width: 25 },
    { header: '消耗积分', key: 'points_cost', width: 10 },
    { header: '状态', key: 'status', width: 10 },
    { header: '兑换时间', key: 'redeemed_at', width: 20 },
    { header: '创建时间', key: 'created_at', width: 20 },
  ];

  const where = {};
  if (filters.status) where.status = filters.status;
  if (filters.item_id) where.item_id = filters.item_id;
  if (filters.start_date && filters.end_date) {
    where.created_at = {
      [sequelize.Op.between]: [filters.start_date, filters.end_date],
    };
  }

  const redemptions = await Redemption.findAll({
    where,
    include: [
      { model: User, as: 'user', attributes: ['account', 'username'] },
      { model: RedemptionItem, as: 'item', attributes: ['name'] },
    ],
    order: [['created_at', 'DESC']],
  });

  const statusMap = { pending: '待兑换', redeemed: '已兑换', expired: '已过期' };

  redemptions.forEach((r) => {
    sheet.addRow({
      id: r.id,
      account: r.user ? r.user.account : '',
      username: r.user ? r.user.username : '',
      item_name: r.item ? r.item.name : '',
      code: r.code,
      points_cost: r.points_cost,
      status: statusMap[r.status] || r.status,
      redeemed_at: r.redeemed_at ? dayjs(r.redeemed_at).format('YYYY-MM-DD HH:mm:ss') : '',
      created_at: dayjs(r.created_at).format('YYYY-MM-DD HH:mm:ss'),
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

const exportReviews = async (filters = {}) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('审核记录');

  sheet.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: '用户账号', key: 'account', width: 15 },
    { header: '用户名', key: 'username', width: 15 },
    { header: '任务名称', key: 'task_name', width: 20 },
    { header: '状态', key: 'status', width: 10 },
    { header: '获得积分', key: 'points_awarded', width: 10 },
    { header: '审核人', key: 'reviewer_name', width: 15 },
    { header: '审核时间', key: 'reviewed_at', width: 20 },
    { header: '提交时间', key: 'created_at', width: 20 },
    { header: '驳回原因', key: 'reject_reason', width: 25 },
  ];

  const where = {};
  if (filters.status) where.status = filters.status;
  if (filters.task_id) where.task_id = filters.task_id;
  if (filters.reviewed_by) where.reviewed_by = filters.reviewed_by;
  if (filters.start_date && filters.end_date) {
    where.created_at = {
      [sequelize.Op.between]: [filters.start_date, filters.end_date],
    };
  }

  const checkins = await Checkin.findAll({
    where,
    include: [
      { model: User, as: 'user', attributes: ['account', 'username'] },
      { model: Task, as: 'task', attributes: ['name'] },
      { model: User, as: 'reviewer', attributes: ['username'] },
    ],
    order: [['created_at', 'DESC']],
  });

  const statusMap = { pending: '待审核', approved: '已通过', rejected: '已驳回' };

  checkins.forEach((c) => {
    sheet.addRow({
      id: c.id,
      account: c.user ? c.user.account : '',
      username: c.user ? c.user.username : '',
      task_name: c.task ? c.task.name : '',
      status: statusMap[c.status] || c.status,
      points_awarded: c.points_awarded || 0,
      reviewer_name: c.reviewer ? c.reviewer.username : '',
      reviewed_at: c.reviewed_at ? dayjs(c.reviewed_at).format('YYYY-MM-DD HH:mm:ss') : '',
      created_at: dayjs(c.created_at).format('YYYY-MM-DD HH:mm:ss'),
      reject_reason: c.reject_reason || '',
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

module.exports = {
  exportCheckins,
  exportPoints,
  exportRedemptions,
  exportReviews,
};
