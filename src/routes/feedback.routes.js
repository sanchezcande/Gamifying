const express = require('express');
const { createFeedback, getFeedback } = require('../controllers/feedback.controller');

const router = express.Router();

router.post('/', createFeedback);
router.get('/:gymId', getFeedback);

module.exports = router;
