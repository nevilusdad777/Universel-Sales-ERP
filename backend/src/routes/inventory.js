const express = require('express');
const router = express.Router();
const { getTransactions, getLowStockProducts } = require('../controllers/inventoryController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/transactions', getTransactions);
router.get('/low-stock', getLowStockProducts);

module.exports = router;
