const { Redemption, RedemptionItem, User, sequelize } = require('../models');
const { success, error } = require('../utils/response');
const { getPagination, getPagingData } = require('../utils/pagination');
const pointsService = require('../services/points.service');
const { v4: uuidv4 } = require('uuid');

const getItems = async (req, res, next) => {
  try {
    const items = await RedemptionItem.findAll({
      where: { is_active: true },
      order: [['sort_order', 'ASC'], ['id', 'ASC']],
    });

    return success(res, items, '获取兑换商品列表成功');
  } catch (err) {
    next(err);
  }
};

const redeem = async (req, res, next) => {
  try {
    const { item_id } = req.body;
    const userId = req.user.id;

    if (!item_id) {
      return error(res, 400, '请选择兑换商品');
    }

    const item = await RedemptionItem.findByPk(item_id);
    if (!item) {
      return error(res, 404, '商品不存在');
    }

    if (!item.is_active) {
      return error(res, 400, '该商品已下架');
    }

    if (item.stock <= 0) {
      return error(res, 400, '该商品库存不足');
    }

    if (item.points_required <= 0) {
      return error(res, 400, '该商品需要管理员分配，不支持直接兑换');
    }

    const t = await sequelize.transaction();

    try {
      // Deduct points
      await pointsService.deductPoints(userId, item.points_required, 'redemption', item_id, t);

      // Deduct stock
      await item.decrement('stock', { by: 1, transaction: t });

      // Generate unique code
      const code = uuidv4().replace(/-/g, '').substring(0, 16).toUpperCase();

      // Create redemption record
      const redemption = await Redemption.create(
        {
          user_id: userId,
          item_id,
          code,
          points_cost: item.points_required,
          status: 'pending',
        },
        { transaction: t }
      );

      await t.commit();

      req.auditLog = {
        action: 'redeem_item',
        targetType: 'redemption',
        targetId: redemption.id,
        detail: { item_id, code, points_cost: item.points_required },
      };

      return success(res, { code, points_cost: item.points_required }, '兑换成功');
    } catch (err) {
      await t.rollback();
      if (err.message === '积分不足') {
        return error(res, 400, '积分不足，无法兑换');
      }
      throw err;
    }
  } catch (err) {
    next(err);
  }
};

const getMyRedemptions = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10, status } = req.query;
    const { limit, offset, page: p, pageSize: ps } = getPagination(page, pageSize);

    const where = { user_id: req.user.id };
    if (status) where.status = status;

    const result = await Redemption.findAndCountAll({
      where,
      include: [
        { model: RedemptionItem, as: 'item', attributes: ['id', 'name', 'description', 'redeem_location'] },
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    const data = getPagingData(result, p, ps);

    return success(res, data, '获取兑换记录成功');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getItems,
  redeem,
  getMyRedemptions,
};
