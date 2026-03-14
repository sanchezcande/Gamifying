const express = require('express');
const avatarCreated = require('../middleware/avatarCreated');
const { createGym, getGym, getGymMembers } = require('../controllers/gym.controller');

const router = express.Router();

router.post('/', createGym);
router.get('/:gymId', getGym);
router.get('/:gymId/members', avatarCreated, getGymMembers);

module.exports = router;
