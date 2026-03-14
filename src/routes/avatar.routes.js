const express = require('express');
const auth = require('../middleware/auth');
const avatarCreated = require('../middleware/avatarCreated');
const { getAvatar, equipItem, getFaceOptions } = require('../controllers/avatar.controller');

const router = express.Router();

router.get('/face-options', getFaceOptions);
router.get('/:userId', auth, avatarCreated, getAvatar);
router.post('/:userId/equip/:itemId', auth, avatarCreated, equipItem);

module.exports = router;
