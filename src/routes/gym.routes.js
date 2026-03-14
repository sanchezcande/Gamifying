const express = require('express');
const avatarCreated = require('../middleware/avatarCreated');
const isGymOwner = require('../middleware/isGymOwner');
const { createGym, getGym, getGymMembers, getGymQrData, regenerateGymSecrets } = require('../controllers/gym.controller');

const router = express.Router();

router.post('/', createGym);
router.get('/:gymId', getGym);
router.get('/:gymId/members', avatarCreated, getGymMembers);
router.get('/:gymId/qr-code', isGymOwner, getGymQrData);
router.post('/:gymId/regenerate-secrets', isGymOwner, regenerateGymSecrets);

module.exports = router;
