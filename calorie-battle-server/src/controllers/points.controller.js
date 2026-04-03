const { User, PointLog } = require('../models');
const { success, error } = require('../utils/response');
const { getPagination, getPagingData } = require('../utils/pagination');

const getSummary = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'total_points', 'total_earned', 'total_used', 'first_earned_at'],
    });

    if (!user) {
      return error(res, 404, '用户不存在');
    }

    return success(res, {
      total_points: user.total_points,
      total_earned: user.total_earned,
      total_used: user.total_used,
      first_earned_at: user.first_earned_at,
    }, '获取积分概览成功');
  } catch (err) {
    next(err);
  }
};

const getLogs = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10, change_type } = req.query;
    const { limit, offset, page: p, pageSize: ps } = getPagination(page, pageSize);

    const where = { user_id: req.user.id };
    if (change_type) where.change_type = change_type;

    const result = await PointLog.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    const data = getPagingData(result, p, ps);

    return success(res, data, '获取积分记录成功');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSummary,
  getLogs,
};
