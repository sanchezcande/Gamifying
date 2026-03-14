const express = require('express');
const { challenge, history, leaderboard } = require('../controllers/battle.controller');

const router = express.Router();

router.post('/challenge/:defenderId', challenge);
router.get('/history/:userId', history);
router.get('/leaderboard/:gymId', leaderboard);

module.exports = router;
