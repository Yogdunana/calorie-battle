const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { auth } = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const auditLogger = require('../middleware/auditLogger');

// All admin routes require admin role
router.use(auth, rbac('admin'));

// Dashboard
router.get('/dashboard', adminController.getDashboard);

// Reviews
router.get('/reviews', adminController.getAllReviews);
router.post('/reviews/:id/override', auditLogger('override_review'), adminController.overrideReview);

// Reviewers CRUD
router.get('/reviewers', adminController.manageReviewers.list);
router.post('/reviewers', adminController.manageReviewers.create);
router.put('/reviewers/:id', adminController.manageReviewers.update);
router.delete('/reviewers/:id', adminController.manageReviewers.delete);

// Tasks CRUD
router.get('/tasks', adminController.manageTasks.list);
router.post('/tasks', adminController.manageTasks.create);
router.put('/tasks/:id', adminController.manageTasks.update);
router.delete('/tasks/:id', adminController.manageTasks.delete);

// Activity config
router.get('/activity', adminController.manageActivities.get);
router.put('/activity', adminController.manageActivities.update);

// Redemption items CRUD
router.get('/redemption-items', adminController.manageRedemptionItems.list);
router.post('/redemption-items', adminController.manageRedemptionItems.create);
router.put('/redemption-items/:id', adminController.manageRedemptionItems.update);
router.delete('/redemption-items/:id', adminController.manageRedemptionItems.delete);

// Redeem code
router.post('/redeem-code', auditLogger('redeem_code'), adminController.redeemCode);

// Photos management
router.get('/photos', adminController.managePhotos.list);
router.post('/photos/:id/review', auditLogger('review_photo'), adminController.managePhotos.review);

// Audit logs
router.get('/audit-logs', adminController.getAuditLogs);

// System configs
router.get('/configs', adminController.manageConfigs.get);
router.put('/configs', adminController.manageConfigs.update);

// Sensitive words CRUD
router.get('/sensitive-words', adminController.manageSensitiveWords.list);
router.post('/sensitive-words', adminController.manageSensitiveWords.create);
router.delete('/sensitive-words/:id', adminController.manageSensitiveWords.delete);

// Announcements CRUD
router.get('/announcements', adminController.manageAnnouncements.list);
router.post('/announcements', adminController.manageAnnouncements.create);
router.put('/announcements/:id', adminController.manageAnnouncements.update);
router.delete('/announcements/:id', adminController.manageAnnouncements.delete);

// Export data
router.get('/export', adminController.exportData);

// Adjust user points
router.post('/adjust-points', auditLogger('adjust_points'), adminController.adjustUserPoints);

// User management
router.get('/users', adminController.manageUsers.list);
router.put('/users/:id/status', auditLogger('update_user_status'), adminController.manageUsers.updateStatus);

module.exports = router;
