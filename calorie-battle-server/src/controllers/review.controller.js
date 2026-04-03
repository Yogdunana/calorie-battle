const { Checkin, Task, User, sequelize } = require('../models');
const { success, error } = require('../utils/response');
const { getPagination, getPagingData } = require('../utils/pagination');
const pointsService = require('../services/points.service');

const getPendingReviews = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10, task_id, category } = req.query;
    const { limit, offset, page: p, pageSize: ps } = getPagination(page, pageSize);

    const where = { status: 'pending' };

    // Exclude weight plan type tasks
    const taskWhere = { is_active: true };
    if (category) taskWhere.category = category;
    if (task_id) taskWhere.id = task_id;

    const result = await Checkin.findAndCountAll({
      where,
      include: [
        {
          model: Task,
          as: 'task',
          where: taskWhere,
          attributes: ['id', 'name', 'category', 'points'],
          required: true,
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'account', 'username'],
        },
      ],
      order: [['created_at', 'ASC']],
      limit,
      offset,
    });

    const data = getPagingData(result, p, ps);

    return success(res, data, '获取待审核列表成功');
  } catch (err) {
    next(err);
  }
};

const approveReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const reviewerId = req.user.id;

    const checkin = await Checkin.findByPk(id, {
      include: [{ model: Task, as: 'task' }],
    });

    if (!checkin) {
      return error(res, 404, '打卡记录不存在');
    }

    if (checkin.status !== 'pending') {
      return error(res, 400, '该记录已审核');
    }

    const t = await sequelize.transaction();

    try {
      let pointsAwarded = 0;

      // Auto-award points
      const result = await pointsService.awardPoints(
        checkin.user_id,
        checkin.id,
        checkin.task_id,
        t
      );

      if (result) {
        pointsAwarded = result.points;
      }

      await checkin.update(
        {
          status: 'approved',
          reviewed_by: reviewerId,
          reviewed_at: new Date(),
          points_awarded: pointsAwarded,
        },
        { transaction: t }
      );

      await t.commit();

      req.auditLog = {
        action: 'approve_checkin',
        targetType: 'checkin',
        targetId: id,
        detail: { pointsAwarded },
      };

      return success(res, { pointsAwarded }, '审核通过');
    } catch (err) {
      await t.rollback();
      throw err;
    }
  } catch (err) {
    next(err);
  }
};

const rejectReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reject_reason } = req.body;
    const reviewerId = req.user.id;

    if (!reject_reason) {
      return error(res, 400, '请填写驳回原因');
    }

    const checkin = await Checkin.findByPk(id);
    if (!checkin) {
      return error(res, 404, '打卡记录不存在');
    }

    if (checkin.status !== 'pending') {
      return error(res, 400, '该记录已审核');
    }

    await checkin.update({
      status: 'rejected',
      reject_reason,
      reviewed_by: reviewerId,
      reviewed_at: new Date(),
    });

    req.auditLog = {
      action: 'reject_checkin',
      targetType: 'checkin',
      targetId: id,
      detail: { reject_reason },
    };

    return success(res, null, '已驳回');
  } catch (err) {
    next(err);
  }
};

const batchReview = async (req, res, next) => {
  try {
    const { ids, action, reject_reason } = req.body;
    const reviewerId = req.user.id;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return error(res, 400, '请选择要操作的记录');
    }

    if (!['approve', 'reject'].includes(action)) {
      return error(res, 400, '操作类型无效');
    }

    if (action === 'reject' && !reject_reason) {
      return error(res, 400, '请填写驳回原因');
    }

    const t = await sequelize.transaction();

    try {
      const checkins = await Checkin.findAll({
        where: {
          id: ids,
          status: 'pending',
        },
        include: [{ model: Task, as: 'task' }],
        transaction: t,
      });

      let approvedCount = 0;
      let rejectedCount = 0;

      for (const checkin of checkins) {
        if (action === 'approve') {
          let pointsAwarded = 0;
          const result = await pointsService.awardPoints(
            checkin.user_id,
            checkin.id,
            checkin.task_id,
            t
          );
          if (result) {
            pointsAwarded = result.points;
          }

          await checkin.update(
            {
              status: 'approved',
              reviewed_by: reviewerId,
              reviewed_at: new Date(),
              points_awarded: pointsAwarded,
            },
            { transaction: t }
          );
          approvedCount++;
        } else {
          await checkin.update(
            {
              status: 'rejected',
              reject_reason,
              reviewed_by: reviewerId,
              reviewed_at: new Date(),
            },
            { transaction: t }
          );
          rejectedCount++;
        }
      }

      await t.commit();

      req.auditLog = {
        action: 'batch_review',
        targetType: 'checkin',
        detail: { ids, action, approvedCount, rejectedCount },
      };

      return success(res, { approvedCount, rejectedCount }, '批量审核完成');
    } catch (err) {
      await t.rollback();
      throw err;
    }
  } catch (err) {
    next(err);
  }
};

const getReviewHistory = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10, status } = req.query;
    const { limit, offset, page: p, pageSize: ps } = getPagination(page, pageSize);

    const where = { reviewed_by: req.user.id };
    if (status) where.status = status;

    const result = await Checkin.findAndCountAll({
      where,
      include: [
        { model: Task, as: 'task', attributes: ['id', 'name', 'category', 'points'] },
        { model: User, as: 'user', attributes: ['id', 'account', 'username'] },
      ],
      order: [['reviewed_at', 'DESC']],
      limit,
      offset,
    });

    const data = getPagingData(result, p, ps);

    return success(res, data, '获取审核历史成功');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getPendingReviews,
  approveReview,
  rejectReview,
  batchReview,
  getReviewHistory,
};
