const express = require('express');
const { challenge, pendingChallenges, respondToChallenge, declineChallenge, history, leaderboard, battlesRemaining, battleVideo } = require('../controllers/battle.controller');

const router = express.Router();

router.post('/challenge/:defenderId', challenge);
router.get('/pending', pendingChallenges);
router.post('/:battleId/respond', respondToChallenge);
router.post('/:battleId/decline', declineChallenge);
router.get('/history/:userId', history);
router.get('/leaderboard/:gymId', leaderboard);
router.get('/remaining', battlesRemaining);
router.get('/:battleId/video', battleVideo);

module.exports = router;
