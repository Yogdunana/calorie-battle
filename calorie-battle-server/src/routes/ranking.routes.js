const express = require('express');
const router = express.Router();
const rankingController = require('../controllers/ranking.controller');
const { auth } = require('../middleware/auth');

// GET /api/v1/ranking/
router.get('/', auth, rankingController.getRanking);

module.exports = router;
