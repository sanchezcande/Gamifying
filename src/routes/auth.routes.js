const express = require('express');
const auth = require('../middleware/auth');
const { register, login, me, createAvatar, updateProfilePhoto } = require('../controllers/auth.controller');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', auth, me);
router.post('/create-avatar', auth, createAvatar);
router.put('/profile-photo', auth, updateProfilePhoto);

module.exports = router;
