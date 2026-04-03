const { PhotoWork, Vote, Activity, sequelize } = require('../models');
const { success, error } = require('../utils/response');
const { getPagination, getPagingData } = require('../utils/pagination');

const submit = async (req, res, next) => {
  try {
    const { title, description } = req.body;
    const userId = req.user.id;

    if (!title) {
      return error(res, 400, '请填写作品标题');
    }

    let image_url = null;
    if (req.file) {
      image_url = `/uploads/photo/${req.file.filename}`;
    }

    if (!image_url) {
      return error(res, 400, '请上传作品图片');
    }

    const photoWork = await PhotoWork.create({
      user_id: userId,
      title,
      description: description || null,
      image_url,
      status: 'pending',
    });

    req.auditLog = {
      action: 'submit_photo',
      targetType: 'photo_work',
      targetId: photoWork.id,
    };

    return success(res, { id: photoWork.id }, '作品提交成功，等待审核');
  } catch (err) {
    next(err);
  }
};

const getApprovedPhotos = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const { limit, offset, page: p, pageSize: ps } = getPagination(page, pageSize);

    const result = await PhotoWork.findAndCountAll({
      where: { status: 'approved' },
      include: [
        {
          model: Vote,
          as: 'votes',
          attributes: ['user_id'],
          required: false,
        },
        {
          model: sequelize.models.User,
          as: 'user',
          attributes: ['id', 'username', 'avatar'],
        },
      ],
      order: [['vote_count', 'DESC'], ['created_at', 'DESC']],
      limit,
      offset,
    });

    const list = result.rows.map((photo) => {
      const item = photo.toJSON();
      item.hasVoted = false;
      if (req.user) {
        item.hasVoted = item.votes.some((v) => v.user_id === req.user.id);
      }
      delete item.votes;
      return item;
    });

    const data = {
      list,
      pagination: {
        page: p,
        pageSize: ps,
        total: result.count,
        totalPages: Math.ceil(result.count / ps),
      },
    };

    return success(res, data, '获取作品列表成功');
  } catch (err) {
    next(err);
  }
};

const vote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if voting is enabled
    const activity = await Activity.findOne({ where: { id: 1 } });
    if (!activity || !activity.voting_enabled) {
      return error(res, 400, '当前活动暂未开启投票功能');
    }

    const photoWork = await PhotoWork.findByPk(id);
    if (!photoWork) {
      return error(res, 404, '作品不存在');
    }

    if (photoWork.status !== 'approved') {
      return error(res, 400, '该作品尚未通过审核');
    }

    // Check daily vote limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dailyVoteCount = await Vote.count({
      where: {
        user_id: userId,
        created_at: {
          [sequelize.Op.gte]: today,
        },
      },
    });

    if (dailyVoteCount >= (activity.daily_vote_limit || 3)) {
      return error(res, 400, `今日投票次数已达上限（${activity.daily_vote_limit || 3}次）`);
    }

    // Check if already voted for this work today
    const existingVote = await Vote.findOne({
      where: {
        user_id: userId,
        photo_work_id: id,
        created_at: {
          [sequelize.Op.gte]: today,
        },
      },
    });

    if (existingVote) {
      return error(res, 400, '今日已为该作品投过票');
    }

    // Check not voting own work
    if (photoWork.user_id === userId) {
      return error(res, 400, '不能为自己的作品投票');
    }

    const t = await sequelize.transaction();

    try {
      await Vote.create(
        {
          user_id: userId,
          photo_work_id: id,
        },
        { transaction: t }
      );

      await photoWork.increment('vote_count', { by: 1, transaction: t });

      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }

    req.auditLog = {
      action: 'vote_photo',
      targetType: 'photo_work',
      targetId: id,
    };

    return success(res, null, '投票成功');
  } catch (err) {
    next(err);
  }
};

const getMyVotes = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const { limit, offset, page: p, pageSize: ps } = getPagination(page, pageSize);

    const result = await Vote.findAndCountAll({
      where: { user_id: req.user.id },
      include: [
        {
          model: PhotoWork,
          as: 'photoWork',
          attributes: ['id', 'title', 'image_url', 'vote_count'],
        },
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    const data = getPagingData(result, p, ps);

    return success(res, data, '获取投票记录成功');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  submit,
  getApprovedPhotos,
  vote,
  getMyVotes,
};
