const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const { auth } = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const auditLogger = require('../middleware/auditLogger');

// GET /api/v1/review/pending
router.get('/pending', auth, rbac('reviewer', 'admin'), reviewController.getPendingReviews);

// POST /api/v1/review/:id/approve
router.post('/:id/approve', auth, rbac('reviewer', 'admin'), auditLogger('approve_checkin'), reviewController.approveReview);

// POST /api/v1/review/:id/reject
router.post('/:id/reject', auth, rbac('reviewer', 'admin'), auditLogger('reject_checkin'), reviewController.rejectReview);

// POST /api/v1/review/batch
router.post('/batch', auth, rbac('reviewer', 'admin'), auditLogger('batch_review'), reviewController.batchReview);

// GET /api/v1/review/history
router.get('/history', auth, rbac('reviewer', 'admin'), reviewController.getReviewHistory);

module.exports = router;
