const express = require('express');
const isGymOwner = require('../middleware/isGymOwner');
const { createPurchase, getPurchaseQr, scanPurchase, getUserPurchases } = require('../controllers/purchase.controller');

const router = express.Router();

router.post('/', createPurchase);
router.get('/my-qr', getPurchaseQr);
router.post('/scan', isGymOwner, scanPurchase);
router.get('/user/:userId', getUserPurchases);

module.exports = router;
