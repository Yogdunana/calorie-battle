const {
  User, Checkin, Task, Activity, RedemptionItem, Redemption,
  PhotoWork, Vote, AuditLog, SystemConfig, SensitiveWord, Announcement,
  WeightRecord, PointLog, sequelize,
} = require('../models');
const { success, error } = require('../utils/response');
const { getPagination, getPagingData } = require('../utils/pagination');
const pointsService = require('../services/points.service');
const exportService = require('../services/export.service');
const { hashPassword } = require('../utils/password');
const { Op } = require('sequelize');
const dayjs = require('dayjs');

// ========== Dashboard ==========
const getDashboard = async (req, res, next) => {
  try {
    const today = dayjs().startOf('day').toDate();

    const pendingCount = await Checkin.count({ where: { status: 'pending' } });
    const approvedCount = await Checkin.count({ where: { status: 'approved' } });
    const totalCount = await Checkin.count();
    const todaySubmissions = await Checkin.count({
      where: { created_at: { [Op.gte]: today } },
    });

    const approvalRate = totalCount > 0 ? Math.round((approvedCount / totalCount) * 100) : 0;

    // Activity breakdown by task category
    const breakdown = await Checkin.findAll({
      attributes: [
        [sequelize.col('task.category'), 'category'],
        [sequelize.fn('COUNT', sequelize.col('checkins.id')), 'count'],
      ],
      include: [
        {
          model: Task,
          as: 'task',
          attributes: [],
        },
      ],
      where: { status: 'approved' },
      group: ['task.category'],
      raw: true,
    });

    const totalUsers = await User.count({ where: { role: 'user', status: 'active' } });
    const totalPointsIssued = await User.sum('total_earned', { where: { role: 'user' } }) || 0;

    return success(res, {
      pendingCount,
      approvedCount,
      totalCount,
      todaySubmissions,
      approvalRate,
      activityBreakdown: breakdown,
      totalUsers,
      totalPointsIssued,
    }, '获取仪表盘数据成功');
  } catch (err) {
    next(err);
  }
};

// ========== All Reviews ==========
const getAllReviews = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10, status, task_id, category, user_id, reviewed_by, start_date, end_date } = req.query;
    const { limit, offset, page: p, pageSize: ps } = getPagination(page, pageSize);

    const where = {};
    if (status) where.status = status;
    if (user_id) where.user_id = user_id;
    if (reviewed_by) where.reviewed_by = reviewed_by;
    if (start_date && end_date) {
      where.created_at = { [Op.between]: [start_date, end_date] };
    }

    const taskInclude = {
      model: Task,
      as: 'task',
      attributes: ['id', 'name', 'category', 'points'],
      required: false,
    };
    if (category) taskInclude.where = { category };
    if (task_id) taskInclude.where = { ...taskInclude.where, id: task_id };

    const result = await Checkin.findAndCountAll({
      where,
      include: [
        taskInclude,
        { model: User, as: 'user', attributes: ['id', 'account', 'username'] },
        { model: User, as: 'reviewer', attributes: ['id', 'username'] },
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    const data = getPagingData(result, p, ps);
    return success(res, data, '获取审核列表成功');
  } catch (err) {
    next(err);
  }
};

// ========== Override Review ==========
const overrideReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { new_status, reason } = req.body;
    const adminId = req.user.id;

    if (!['approved', 'rejected'].includes(new_status)) {
      return error(res, 400, '无效的状态');
    }

    const checkin = await Checkin.findByPk(id, {
      include: [{ model: Task, as: 'task' }],
    });

    if (!checkin) {
      return error(res, 404, '打卡记录不存在');
    }

    const t = await sequelize.transaction();

    try {
      if (new_status === 'approved' && checkin.status === 'rejected') {
        // Re-award points
        const result = await pointsService.awardPoints(
          checkin.user_id,
          checkin.id,
          checkin.task_id,
          t
        );

        await checkin.update(
          {
            status: 'approved',
            reviewed_by: adminId,
            reviewed_at: new Date(),
            points_awarded: result ? result.points : 0,
            reject_reason: null,
          },
          { transaction: t }
        );
      } else if (new_status === 'rejected' && checkin.status === 'approved') {
        // Revoke points
        if (checkin.points_awarded && checkin.points_awarded > 0) {
          await pointsService.adjustPoints(
            checkin.user_id,
            -checkin.points_awarded,
            `审核结果修正: 撤回打卡积分 (打卡ID: ${id})`,
            adminId,
            t
          );
        }

        await checkin.update(
          {
            status: 'rejected',
            reviewed_by: adminId,
            reviewed_at: new Date(),
            points_awarded: 0,
            reject_reason: reason || '管理员修正审核结果',
          },
          { transaction: t }
        );
      } else {
        await checkin.update(
          {
            status: new_status,
            reviewed_by: adminId,
            reviewed_at: new Date(),
            reject_reason: new_status === 'rejected' ? (reason || '管理员修正') : null,
          },
          { transaction: t }
        );
      }

      await t.commit();

      req.auditLog = {
        action: 'override_review',
        targetType: 'checkin',
        targetId: id,
        detail: { new_status, reason },
      };

      return success(res, null, '审核结果已修正');
    } catch (err) {
      await t.rollback();
      throw err;
    }
  } catch (err) {
    next(err);
  }
};

// ========== Manage Reviewers ==========
const manageReviewers = {
  list: async (req, res, next) => {
    try {
      const reviewers = await User.findAll({
        where: { role: 'reviewer' },
        attributes: ['id', 'account', 'username', 'status', 'created_at'],
        order: [['created_at', 'DESC']],
      });
      return success(res, reviewers, '获取审核员列表成功');
    } catch (err) {
      next(err);
    }
  },

  create: async (req, res, next) => {
    try {
      const { account, username, password } = req.body;

      if (!account || !username || !password) {
        return error(res, 400, '账号、用户名和密码不能为空');
      }

      const existing = await User.findOne({ where: { account } });
      if (existing) {
        return error(res, 400, '该账号已存在');
      }

      const password_hash = await hashPassword(password);
      const reviewer = await User.create({
        account,
        username,
        password_hash,
        role: 'reviewer',
        status: 'active',
      });

      return success(res, { id: reviewer.id }, '审核员创建成功');
    } catch (err) {
      next(err);
    }
  },

  update: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { username, password, status } = req.body;

      const reviewer = await User.findByPk(id);
      if (!reviewer || reviewer.role !== 'reviewer') {
        return error(res, 404, '审核员不存在');
      }

      const updateData = {};
      if (username) updateData.username = username;
      if (password) updateData.password_hash = await hashPassword(password);
      if (status) updateData.status = status;

      await reviewer.update(updateData);
      return success(res, null, '审核员更新成功');
    } catch (err) {
      next(err);
    }
  },

  delete: async (req, res, next) => {
    try {
      const { id } = req.params;
      const reviewer = await User.findByPk(id);
      if (!reviewer || reviewer.role !== 'reviewer') {
        return error(res, 404, '审核员不存在');
      }

      await reviewer.destroy();
      return success(res, null, '审核员删除成功');
    } catch (err) {
      next(err);
    }
  },
};

// ========== Manage Tasks ==========
const manageTasks = {
  list: async (req, res, next) => {
    try {
      const tasks = await Task.findAll({
        order: [['sort_order', 'ASC'], ['id', 'ASC']],
      });
      return success(res, tasks, '获取任务列表成功');
    } catch (err) {
      next(err);
    }
  },

  create: async (req, res, next) => {
    try {
      const { category, name, description, points, submit_rules, required_fields, start_time, end_time, is_active, sort_order } = req.body;

      if (!category || !name) {
        return error(res, 400, '分类和名称不能为空');
      }

      const task = await Task.create({
        category,
        name,
        description: description || null,
        points: points || 0,
        submit_rules: submit_rules || null,
        required_fields: required_fields || null,
        start_time: start_time || null,
        end_time: end_time || null,
        is_active: is_active !== undefined ? is_active : true,
        sort_order: sort_order || 0,
      });

      return success(res, { id: task.id }, '任务创建成功');
    } catch (err) {
      next(err);
    }
  },

  update: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { category, name, description, points, submit_rules, required_fields, start_time, end_time, is_active, sort_order } = req.body;

      const task = await Task.findByPk(id);
      if (!task) {
        return error(res, 404, '任务不存在');
      }

      const updateData = {};
      if (category !== undefined) updateData.category = category;
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (points !== undefined) updateData.points = points;
      if (submit_rules !== undefined) updateData.submit_rules = submit_rules;
      if (required_fields !== undefined) updateData.required_fields = required_fields;
      if (start_time !== undefined) updateData.start_time = start_time;
      if (end_time !== undefined) updateData.end_time = end_time;
      if (is_active !== undefined) updateData.is_active = is_active;
      if (sort_order !== undefined) updateData.sort_order = sort_order;

      await task.update(updateData);
      return success(res, null, '任务更新成功');
    } catch (err) {
      next(err);
    }
  },

  delete: async (req, res, next) => {
    try {
      const { id } = req.params;
      const task = await Task.findByPk(id);
      if (!task) {
        return error(res, 404, '任务不存在');
      }

      await task.destroy();
      return success(res, null, '任务删除成功');
    } catch (err) {
      next(err);
    }
  },
};

// ========== Manage Activities ==========
const manageActivities = {
  get: async (req, res, next) => {
    try {
      const activity = await Activity.findOne({ where: { id: 1 } });
      if (!activity) {
        return success(res, null, '暂无活动配置');
      }
      return success(res, activity, '获取活动配置成功');
    } catch (err) {
      next(err);
    }
  },

  update: async (req, res, next) => {
    try {
      const { name, description, start_date, end_date, point_expire_date, checkin_enabled, voting_enabled, voting_start, voting_end, daily_vote_limit } = req.body;

      let activity = await Activity.findOne({ where: { id: 1 } });

      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (start_date !== undefined) updateData.start_date = start_date;
      if (end_date !== undefined) updateData.end_date = end_date;
      if (point_expire_date !== undefined) updateData.point_expire_date = point_expire_date;
      if (checkin_enabled !== undefined) updateData.checkin_enabled = checkin_enabled;
      if (voting_enabled !== undefined) updateData.voting_enabled = voting_enabled;
      if (voting_start !== undefined) updateData.voting_start = voting_start;
      if (voting_end !== undefined) updateData.voting_end = voting_end;
      if (daily_vote_limit !== undefined) updateData.daily_vote_limit = daily_vote_limit;

      if (activity) {
        await activity.update(updateData);
      } else {
        activity = await Activity.create({
          id: 1,
          ...updateData,
        });
      }

      return success(res, activity, '活动配置更新成功');
    } catch (err) {
      next(err);
    }
  },
};

// ========== Manage Redemption Items ==========
const manageRedemptionItems = {
  list: async (req, res, next) => {
    try {
      const items = await RedemptionItem.findAll({
        order: [['sort_order', 'ASC'], ['id', 'ASC']],
      });
      return success(res, items, '获取兑换商品列表成功');
    } catch (err) {
      next(err);
    }
  },

  create: async (req, res, next) => {
    try {
      const { name, description, points_required, stock, rules, redeem_location, is_active, sort_order } = req.body;

      if (!name) {
        return error(res, 400, '商品名称不能为空');
      }

      const item = await RedemptionItem.create({
        name,
        description: description || null,
        points_required: points_required || 0,
        stock: stock || 0,
        rules: rules || null,
        redeem_location: redeem_location || null,
        is_active: is_active !== undefined ? is_active : true,
        sort_order: sort_order || 0,
      });

      return success(res, { id: item.id }, '商品创建成功');
    } catch (err) {
      next(err);
    }
  },

  update: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { name, description, points_required, stock, rules, redeem_location, is_active, sort_order } = req.body;

      const item = await RedemptionItem.findByPk(id);
      if (!item) {
        return error(res, 404, '商品不存在');
      }

      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (points_required !== undefined) updateData.points_required = points_required;
      if (stock !== undefined) updateData.stock = stock;
      if (rules !== undefined) updateData.rules = rules;
      if (redeem_location !== undefined) updateData.redeem_location = redeem_location;
      if (is_active !== undefined) updateData.is_active = is_active;
      if (sort_order !== undefined) updateData.sort_order = sort_order;

      await item.update(updateData);
      return success(res, null, '商品更新成功');
    } catch (err) {
      next(err);
    }
  },

  delete: async (req, res, next) => {
    try {
      const { id } = req.params;
      const item = await RedemptionItem.findByPk(id);
      if (!item) {
        return error(res, 404, '商品不存在');
      }

      await item.destroy();
      return success(res, null, '商品删除成功');
    } catch (err) {
      next(err);
    }
  },
};

// ========== Redeem Code ==========
const redeemCode = async (req, res, next) => {
  try {
    const { code } = req.body;
    const adminId = req.user.id;

    if (!code) {
      return error(res, 400, '请输入兑换码');
    }

    const redemption = await Redemption.findOne({
      where: { code: code.toUpperCase() },
      include: [
        { model: User, as: 'user', attributes: ['id', 'account', 'username'] },
        { model: RedemptionItem, as: 'item', attributes: ['id', 'name'] },
      ],
    });

    if (!redemption) {
      return error(res, 404, '兑换码不存在');
    }

    if (redemption.status === 'redeemed') {
      return error(res, 400, '该兑换码已被使用');
    }

    if (redemption.status === 'expired') {
      return error(res, 400, '该兑换码已过期');
    }

    await redemption.update({
      status: 'redeemed',
      redeemed_at: new Date(),
      redeemed_by: adminId,
    });

    req.auditLog = {
      action: 'redeem_code',
      targetType: 'redemption',
      targetId: redemption.id,
      detail: { code, user: redemption.user?.username, item: redemption.item?.name },
    };

    return success(res, {
      user: redemption.user,
      item: redemption.item,
    }, '兑换码核销成功');
  } catch (err) {
    next(err);
  }
};

// ========== Manage Photos ==========
const managePhotos = {
  list: async (req, res, next) => {
    try {
      const { page = 1, pageSize = 10, status } = req.query;
      const { limit, offset, page: p, pageSize: ps } = getPagination(page, pageSize);

      const where = {};
      if (status) where.status = status;

      const result = await PhotoWork.findAndCountAll({
        where,
        include: [
          { model: User, as: 'user', attributes: ['id', 'account', 'username'] },
        ],
        order: [['created_at', 'DESC']],
        limit,
        offset,
      });

      const data = getPagingData(result, p, ps);
      return success(res, data, '获取作品列表成功');
    } catch (err) {
      next(err);
    }
  },

  review: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { action, reject_reason } = req.body;
      const adminId = req.user.id;

      if (!['approve', 'reject'].includes(action)) {
        return error(res, 400, '操作类型无效');
      }

      const photo = await PhotoWork.findByPk(id);
      if (!photo) {
        return error(res, 404, '作品不存在');
      }

      if (photo.status !== 'pending') {
        return error(res, 400, '该作品已审核');
      }

      const updateData = {
        status: action === 'approve' ? 'approved' : 'rejected',
        reviewed_by: adminId,
        reviewed_at: new Date(),
      };

      if (action === 'reject') {
        updateData.reject_reason = reject_reason || '管理员驳回';
      }

      await photo.update(updateData);

      req.auditLog = {
        action: `${action}_photo`,
        targetType: 'photo_work',
        targetId: id,
      };

      return success(res, null, action === 'approve' ? '作品审核通过' : '作品已驳回');
    } catch (err) {
      next(err);
    }
  },
};

// ========== Audit Logs ==========
const getAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10, action, operator_id, target_type, start_date, end_date } = req.query;
    const { limit, offset, page: p, pageSize: ps } = getPagination(page, pageSize);

    const where = {};
    if (action) where.action = action;
    if (operator_id) where.operator_id = operator_id;
    if (target_type) where.target_type = target_type;
    if (start_date && end_date) {
      where.created_at = { [Op.between]: [start_date, end_date] };
    }

    const result = await AuditLog.findAndCountAll({
      where,
      include: [
        { model: User, as: 'operator', attributes: ['id', 'account', 'username'] },
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    const data = getPagingData(result, p, ps);
    return success(res, data, '获取审计日志成功');
  } catch (err) {
    next(err);
  }
};

// ========== System Configs ==========
const manageConfigs = {
  get: async (req, res, next) => {
    try {
      const configs = await SystemConfig.findAll({
        order: [['id', 'ASC']],
      });
      return success(res, configs, '获取系统配置成功');
    } catch (err) {
      next(err);
    }
  },

  update: async (req, res, next) => {
    try {
      const { configs } = req.body;
      const adminId = req.user.id;

      if (!configs || !Array.isArray(configs)) {
        return error(res, 400, '请提供配置列表');
      }

      for (const config of configs) {
        const { config_key, config_value } = config;
        if (!config_key) continue;

        await SystemConfig.upsert({
          config_key,
          config_value: config_value || '',
          updated_by: adminId,
        });
      }

      return success(res, null, '系统配置更新成功');
    } catch (err) {
      next(err);
    }
  },
};

// ========== Sensitive Words ==========
const manageSensitiveWords = {
  list: async (req, res, next) => {
    try {
      const words = await SensitiveWord.findAll({
        order: [['created_at', 'DESC']],
      });
      return success(res, words, '获取敏感词列表成功');
    } catch (err) {
      next(err);
    }
  },

  create: async (req, res, next) => {
    try {
      const { word, category } = req.body;

      if (!word) {
        return error(res, 400, '请输入敏感词');
      }

      const created = await SensitiveWord.create({
        word,
        category: category || 'general',
      });

      return success(res, { id: created.id }, '敏感词添加成功');
    } catch (err) {
      next(err);
    }
  },

  delete: async (req, res, next) => {
    try {
      const { id } = req.params;
      const word = await SensitiveWord.findByPk(id);
      if (!word) {
        return error(res, 404, '敏感词不存在');
      }

      await word.destroy();
      return success(res, null, '敏感词删除成功');
    } catch (err) {
      next(err);
    }
  },
};

// ========== Announcements ==========
const manageAnnouncements = {
  list: async (req, res, next) => {
    try {
      const { type, is_active } = req.query;
      const where = {};
      if (type) where.type = type;
      if (is_active !== undefined) where.is_active = is_active === 'true';

      const announcements = await Announcement.findAll({
        where,
        order: [['sort_order', 'ASC'], ['id', 'DESC']],
      });
      return success(res, announcements, '获取公告列表成功');
    } catch (err) {
      next(err);
    }
  },

  create: async (req, res, next) => {
    try {
      const { type, title, content, image_url, link_url, sort_order, is_active, start_time, end_time } = req.body;

      if (!type || !title) {
        return error(res, 400, '类型和标题不能为空');
      }

      const announcement = await Announcement.create({
        type,
        title,
        content: content || null,
        image_url: image_url || null,
        link_url: link_url || null,
        sort_order: sort_order || 0,
        is_active: is_active !== undefined ? is_active : true,
        start_time: start_time || null,
        end_time: end_time || null,
      });

      return success(res, { id: announcement.id }, '公告创建成功');
    } catch (err) {
      next(err);
    }
  },

  update: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { type, title, content, image_url, link_url, sort_order, is_active, start_time, end_time } = req.body;

      const announcement = await Announcement.findByPk(id);
      if (!announcement) {
        return error(res, 404, '公告不存在');
      }

      const updateData = {};
      if (type !== undefined) updateData.type = type;
      if (title !== undefined) updateData.title = title;
      if (content !== undefined) updateData.content = content;
      if (image_url !== undefined) updateData.image_url = image_url;
      if (link_url !== undefined) updateData.link_url = link_url;
      if (sort_order !== undefined) updateData.sort_order = sort_order;
      if (is_active !== undefined) updateData.is_active = is_active;
      if (start_time !== undefined) updateData.start_time = start_time;
      if (end_time !== undefined) updateData.end_time = end_time;

      await announcement.update(updateData);
      return success(res, null, '公告更新成功');
    } catch (err) {
      next(err);
    }
  },

  delete: async (req, res, next) => {
    try {
      const { id } = req.params;
      const announcement = await Announcement.findByPk(id);
      if (!announcement) {
        return error(res, 404, '公告不存在');
      }

      await announcement.destroy();
      return success(res, null, '公告删除成功');
    } catch (err) {
      next(err);
    }
  },
};

// ========== Export Data ==========
const exportData = async (req, res, next) => {
  try {
    const { type, ...filters } = req.query;

    if (!type) {
      return error(res, 400, '请指定导出类型');
    }

    let buffer;
    let filename;

    switch (type) {
      case 'checkins':
        buffer = await exportService.exportCheckins(filters);
        filename = '打卡记录.xlsx';
        break;
      case 'points':
        buffer = await exportService.exportPoints(filters);
        filename = '积分记录.xlsx';
        break;
      case 'redemptions':
        buffer = await exportService.exportRedemptions(filters);
        filename = '兑换记录.xlsx';
        break;
      case 'reviews':
        buffer = await exportService.exportReviews(filters);
        filename = '审核记录.xlsx';
        break;
      default:
        return error(res, 400, '不支持的导出类型');
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
};

// ========== Adjust User Points ==========
const adjustUserPoints = async (req, res, next) => {
  try {
    const { user_id, amount, remark } = req.body;
    const adminId = req.user.id;

    if (!user_id || amount === undefined || amount === null) {
      return error(res, 400, '用户ID和调整数量不能为空');
    }

    if (typeof amount !== 'number' || amount === 0) {
      return error(res, 400, '调整数量必须为非零数字');
    }

    const user = await User.findByPk(user_id);
    if (!user) {
      return error(res, 404, '用户不存在');
    }

    const t = await sequelize.transaction();

    try {
      const result = await pointsService.adjustPoints(
        user_id,
        amount,
        remark || (amount > 0 ? '管理员增加积分' : '管理员扣减积分'),
        adminId,
        t
      );

      await t.commit();

      req.auditLog = {
        action: 'adjust_points',
        targetType: 'user',
        targetId: user_id,
        detail: { amount, remark, balanceAfter: result.balance },
      };

      return success(res, { balance: result.balance }, '积分调整成功');
    } catch (err) {
      await t.rollback();
      if (err.message === '积分不足') {
        return error(res, 400, '用户积分不足，无法扣减');
      }
      throw err;
    }
  } catch (err) {
    next(err);
  }
};

// ========== Manage Users ==========
const manageUsers = {
  list: async (req, res, next) => {
    try {
      const { page = 1, pageSize = 10, role, status, keyword } = req.query;
      const { limit, offset, page: p, pageSize: ps } = getPagination(page, pageSize);

      const where = {};
      if (role) where.role = role;
      if (status) where.status = status;
      if (keyword) {
        where[Op.or] = [
          { account: { [Op.like]: `%${keyword}%` } },
          { username: { [Op.like]: `%${keyword}%` } },
        ];
      }

      const result = await User.findAndCountAll({
        where,
        attributes: ['id', 'account', 'username', 'role', 'status', 'avatar', 'total_points', 'total_earned', 'total_used', 'login_fail_count', 'locked_until', 'created_at'],
        order: [['created_at', 'DESC']],
        limit,
        offset,
      });

      const data = getPagingData(result, p, ps);
      return success(res, data, '获取用户列表成功');
    } catch (err) {
      next(err);
    }
  },

  updateStatus: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['active', 'locked', 'disabled'].includes(status)) {
        return error(res, 400, '无效的状态');
      }

      const user = await User.findByPk(id);
      if (!user) {
        return error(res, 404, '用户不存在');
      }

      if (user.role === 'admin') {
        return error(res, 400, '不能修改管理员账号状态');
      }

      await user.update({ status });

      req.auditLog = {
        action: 'update_user_status',
        targetType: 'user',
        targetId: id,
        detail: { status },
      };

      return success(res, null, '用户状态更新成功');
    } catch (err) {
      next(err);
    }
  },
};

module.exports = {
  getDashboard,
  getAllReviews,
  overrideReview,
  manageReviewers,
  manageTasks,
  manageActivities,
  manageRedemptionItems,
  redeemCode,
  managePhotos,
  getAuditLogs,
  manageConfigs,
  manageSensitiveWords,
  manageAnnouncements,
  exportData,
  adjustUserPoints,
  manageUsers,
};
