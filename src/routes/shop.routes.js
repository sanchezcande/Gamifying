const express = require('express');
const { getShop, buyItem, getInventory } = require('../controllers/shop.controller');

const router = express.Router();

router.get('/', getShop);
router.post('/buy/:itemId', buyItem);
router.get('/inventory/:userId', getInventory);

module.exports = router;
