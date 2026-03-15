const express = require('express');
const auth = require('../middleware/auth');
const { register, login, me, createAvatar } = require('../controllers/auth.controller');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', auth, me);
router.post('/create-avatar', auth, createAvatar);

module.exports = router;
