const express = require('express');
const router = express.Router();
const pointsController = require('../controllers/points.controller');
const { auth } = require('../middleware/auth');
const rbac = require('../middleware/rbac');

// GET /api/v1/points/summary
router.get('/summary', auth, rbac('user', 'reviewer', 'admin'), pointsController.getSummary);

// GET /api/v1/points/logs
router.get('/logs', auth, rbac('user', 'reviewer', 'admin'), pointsController.getLogs);

module.exports = router;
