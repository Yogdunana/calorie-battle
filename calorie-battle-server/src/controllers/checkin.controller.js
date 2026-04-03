const { Checkin, Task, Activity } = require('../models');
const { success, error, paginate } = require('../utils/response');
const { getPagination, getPagingData } = require('../utils/pagination');

const getTasks = async (req, res, next) => {
  try {
    // Check if checkin is enabled in activity
    const activity = await Activity.findOne({ where: { id: 1 } });
    if (activity && !activity.checkin_enabled) {
      return error(res, 400, '当前活动暂未开启打卡功能');
    }

    const tasks = await Task.findAll({
      where: { is_active: true },
      order: [['sort_order', 'ASC'], ['id', 'ASC']],
    });

    return success(res, tasks, '获取任务列表成功');
  } catch (err) {
    next(err);
  }
};

const submitCheckin = async (req, res, next) => {
  try {
    const { task_id, submit_data } = req.body;
    const userId = req.user.id;

    if (!task_id) {
      return error(res, 400, '请选择打卡任务');
    }

    const task = await Task.findByPk(task_id);
    if (!task) {
      return error(res, 400, '任务不存在');
    }

    if (!task.is_active) {
      return error(res, 400, '该任务已停用');
    }

    // Collect uploaded image paths
    const images = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        images.push(`/uploads/checkin/${file.filename}`);
      });
    }

    const checkin = await Checkin.create({
      user_id: userId,
      task_id,
      submit_data: submit_data || null,
      images: images.length > 0 ? images : null,
      status: 'pending',
    });

    req.auditLog = {
      action: 'submit_checkin',
      targetType: 'checkin',
      targetId: checkin.id,
    };

    return success(res, { id: checkin.id }, '打卡提交成功，等待审核');
  } catch (err) {
    next(err);
  }
};

const getMyCheckins = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10, status, task_id } = req.query;
    const { limit, offset, page: p, pageSize: ps } = getPagination(page, pageSize);

    const where = { user_id: req.user.id };
    if (status) where.status = status;
    if (task_id) where.task_id = task_id;

    const result = await Checkin.findAndCountAll({
      where,
      include: [
        { model: Task, as: 'task', attributes: ['id', 'name', 'category', 'points'] },
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    const data = getPagingData(result, p, ps);

    return success(res, data, '获取打卡记录成功');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getTasks,
  submitCheckin,
  getMyCheckins,
};
