const express = require('express');
const router = express.Router();
const checkinController = require('../controllers/checkin.controller');
const { auth } = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const upload = require('../config/upload');
const auditLogger = require('../middleware/auditLogger');

// GET /api/v1/checkin/tasks
router.get('/tasks', auth, rbac('user', 'reviewer', 'admin'), checkinController.getTasks);

// POST /api/v1/checkin/checkins
router.post('/checkins', auth, rbac('user', 'reviewer', 'admin'), upload.array('images', 5), auditLogger('submit_checkin'), checkinController.submitCheckin);

// GET /api/v1/checkin/checkins/mine
router.get('/checkins/mine', auth, rbac('user', 'reviewer', 'admin'), checkinController.getMyCheckins);

module.exports = router;
