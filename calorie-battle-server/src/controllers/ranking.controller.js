const { User, sequelize } = require('../models');
const { success, error } = require('../utils/response');

const getRanking = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;

    const ranking = await User.findAll({
      attributes: [
        'id',
        'username',
        'avatar',
        'total_points',
        'total_earned',
      ],
      where: {
        status: 'active',
        role: 'user',
        total_earned: { [sequelize.Op.gt]: 0 },
      },
      order: [['total_earned', 'DESC'], ['first_earned_at', 'ASC']],
      limit: 100,
    });

    // Add rank to each item and find current user
    let currentUserRanking = null;
    const list = ranking.map((user, index) => {
      const rank = index + 1;
      const item = {
        rank,
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        total_points: user.total_points,
        total_earned: user.total_earned,
        isCurrentUser: user.id === currentUserId,
      };

      if (user.id === currentUserId) {
        currentUserRanking = item;
      }

      return item;
    });

    // If current user not in top 100, find their rank
    if (!currentUserRanking) {
      const user = await User.findByPk(currentUserId, {
        attributes: ['id', 'username', 'avatar', 'total_points', 'total_earned'],
      });

      if (user && user.total_earned > 0) {
        const rankResult = await User.count({
          where: {
            status: 'active',
            role: 'user',
            total_earned: { [sequelize.Op.gt]: user.total_earned },
          },
        });

        currentUserRanking = {
          rank: rankResult + 1,
          id: user.id,
          username: user.username,
          avatar: user.avatar,
          total_points: user.total_points,
          total_earned: user.total_earned,
          isCurrentUser: true,
        };
      }
    }

    return success(res, {
      list,
      myRanking: currentUserRanking,
    }, '获取排行榜成功');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getRanking,
};
