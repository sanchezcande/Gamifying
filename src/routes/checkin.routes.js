const express = require('express');
const { createCheckin, getUserCheckins } = require('../controllers/checkin.controller');

const router = express.Router();

router.post('/', createCheckin);
router.get('/user/:userId', getUserCheckins);

module.exports = router;
