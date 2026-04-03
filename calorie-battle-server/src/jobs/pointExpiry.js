const { User, Activity, sequelize } = require('../models');
const pointsService = require('../services/points.service');

const expireAllPoints = async () => {
  try {
    console.log('[PointExpiry] Starting point expiry job...');

    const activity = await Activity.findOne({ where: { id: 1 } });
    if (!activity || !activity.point_expire_date) {
      console.log('[PointExpiry] No activity or expire date configured, skipping.');
      return;
    }

    const now = new Date();
    const expireDate = new Date(activity.point_expire_date);

    if (now < expireDate) {
      console.log(`[PointExpiry] Not yet expired (expire date: ${expireDate}), skipping.`);
      return;
    }

    const t = await sequelize.transaction();

    try {
      const users = await User.findAll({
        where: {
          role: 'user',
          status: 'active',
          total_points: { [sequelize.Op.gt]: 0 },
        },
        transaction: t,
      });

      let expiredCount = 0;
      let totalExpired = 0;

      for (const user of users) {
        const result = await pointsService.expirePoints(user.id, t);
        if (result) {
          expiredCount++;
          totalExpired += result.expiredPoints;
        }
      }

      await t.commit();

      console.log(`[PointExpiry] Completed. Expired points for ${expiredCount} users, total: ${totalExpired} points.`);
    } catch (err) {
      await t.rollback();
      console.error('[PointExpiry] Error during point expiry:', err);
    }
  } catch (err) {
    console.error('[PointExpiry] Job error:', err);
  }
};

module.exports = expireAllPoints;
