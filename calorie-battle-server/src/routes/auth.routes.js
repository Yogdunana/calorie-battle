const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { auth } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

// POST /api/v1/auth/register
router.post('/register', authLimiter, authController.register);

// POST /api/v1/auth/login
router.post('/login', authLimiter, authController.login);

// POST /api/v1/auth/refresh
router.post('/refresh', authController.refresh);

// POST /api/v1/auth/reset-password
router.post('/reset-password', authLimiter, authController.resetPassword);

// PUT /api/v1/auth/password
router.put('/password', auth, authController.changePassword);

// PUT /api/v1/auth/profile
router.put('/profile', auth, authController.updateProfile);

module.exports = router;
