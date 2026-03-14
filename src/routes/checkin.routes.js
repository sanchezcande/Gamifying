const express = require('express');
const { createCheckin, createQrCheckin, getUserCheckins } = require('../controllers/checkin.controller');

const router = express.Router();

router.post('/', createCheckin);
router.post('/qr', createQrCheckin);
router.get('/user/:userId', getUserCheckins);

module.exports = router;
