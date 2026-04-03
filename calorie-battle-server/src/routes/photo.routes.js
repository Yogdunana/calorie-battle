const express = require('express');
const router = express.Router();
const photoController = require('../controllers/photo.controller');
const { auth } = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const upload = require('../config/upload');
const auditLogger = require('../middleware/auditLogger');

// POST /api/v1/photo/ - user submits photo work
router.post('/', auth, rbac('user', 'reviewer', 'admin'), upload.single('image'), auditLogger('submit_photo'), photoController.submit);

// GET /api/v1/photo/ - list approved photos
router.get('/', auth, photoController.getApprovedPhotos);

// POST /api/v1/photo/:id/vote - vote for a photo
router.post('/:id/vote', auth, rbac('user', 'reviewer', 'admin'), auditLogger('vote_photo'), photoController.vote);

// GET /api/v1/photo/my-votes - user's voting history
router.get('/my-votes', auth, rbac('user', 'reviewer', 'admin'), photoController.getMyVotes);

module.exports = router;
