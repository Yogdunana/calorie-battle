const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const checkinRoutes = require('./checkin.routes');
const reviewRoutes = require('./review.routes');
const pointsRoutes = require('./points.routes');
const rankingRoutes = require('./ranking.routes');
const redemptionRoutes = require('./redemption.routes');
const weightPlanRoutes = require('./weightPlan.routes');
const photoRoutes = require('./photo.routes');
const adminRoutes = require('./admin.routes');
const mailRoutes = require('./mail.routes');

router.use('/auth', authRoutes);
router.use('/checkin', checkinRoutes);
router.use('/review', reviewRoutes);
router.use('/points', pointsRoutes);
router.use('/ranking', rankingRoutes);
router.use('/redemption', redemptionRoutes);
router.use('/weight-plan', weightPlanRoutes);
router.use('/photo', photoRoutes);
router.use('/admin', adminRoutes);
router.use('/mail', mailRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({ code: 200, message: 'OK', data: { timestamp: new Date().toISOString() } });
});

module.exports = router;
