const express = require('express');
const { xpLeaderboard, bodybuildingLeaderboard } = require('../controllers/leaderboard.controller');

const router = express.Router();

router.get('/:gymId', xpLeaderboard);
router.get('/:gymId/bodybuilding', bodybuildingLeaderboard);

module.exports = router;
