const express = require('express');
const { getAvatarRenderMetrics, getAvatarRenderJobs } = require('../controllers/admin.controller');

const router = express.Router();

router.get('/avatar-renders/metrics', getAvatarRenderMetrics);
router.get('/avatar-renders/jobs', getAvatarRenderJobs);

module.exports = router;
