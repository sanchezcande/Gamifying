const express = require('express');
const isGymOwner = require('../middleware/isGymOwner');
const {
  getCurrentCompetition,
  getCompetitionHistory,
  closeCompetition
} = require('../controllers/competition.controller');

const router = express.Router();

router.get('/:gymId', getCurrentCompetition);
router.get('/:gymId/history', getCompetitionHistory);
router.post('/:gymId/close', isGymOwner, closeCompetition);

module.exports = router;
