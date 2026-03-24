const express = require('express');
const { challenge, history, leaderboard, battlesRemaining } = require('../controllers/battle.controller');

const router = express.Router();

router.post('/challenge/:defenderId', challenge);
router.get('/history/:userId', history);
router.get('/leaderboard/:gymId', leaderboard);
router.get('/remaining', battlesRemaining);

module.exports = router;
