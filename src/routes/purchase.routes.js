const express = require('express');
const { createPurchase, getUserPurchases } = require('../controllers/purchase.controller');

const router = express.Router();

router.post('/', createPurchase);
router.get('/user/:userId', getUserPurchases);

module.exports = router;
