const express = require('express');
const router = express.Router();
const weightPlanController = require('../controllers/weightPlan.controller');
const { auth } = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const upload = require('../config/upload');
const auditLogger = require('../middleware/auditLogger');

// POST /api/v1/weight-plan/ - user submits weight screenshot
router.post('/', auth, rbac('user', 'reviewer', 'admin'), upload.single('screenshot'), auditLogger('submit_weight'), weightPlanController.submit);

// GET /api/v1/weight-plan/mine - user's own records
router.get('/mine', auth, rbac('user', 'reviewer', 'admin'), weightPlanController.getMyRecords);

// GET /api/v1/weight-plan/pending - admin views pending records
router.get('/pending', auth, rbac('admin'), weightPlanController.getPendingRecords);

// POST /api/v1/weight-plan/:id/review - admin reviews record
router.post('/:id/review', auth, rbac('admin'), auditLogger('review_weight'), weightPlanController.reviewRecord);

module.exports = router;
