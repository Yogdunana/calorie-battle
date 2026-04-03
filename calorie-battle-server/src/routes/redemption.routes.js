const express = require('express');
const router = express.Router();
const redemptionController = require('../controllers/redemption.controller');
const { auth } = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const auditLogger = require('../middleware/auditLogger');

// GET /api/v1/redemption/items
router.get('/items', auth, rbac('user', 'reviewer', 'admin'), redemptionController.getItems);

// POST /api/v1/redemption/redeem
router.post('/redeem', auth, rbac('user', 'reviewer', 'admin'), auditLogger('redeem_item'), redemptionController.redeem);

// GET /api/v1/redemption/mine
router.get('/mine', auth, rbac('user', 'reviewer', 'admin'), redemptionController.getMyRedemptions);

module.exports = router;
