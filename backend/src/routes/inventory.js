const express = require('express');
const router = express.Router();
const { getTransactions, getLowStockProducts, adjustStock } = require('../controllers/inventoryController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/transactions', getTransactions);
router.get('/low-stock', getLowStockProducts);
router.post('/adjust', authorize('SUPER_ADMIN', 'MANAGER'), adjustStock);

module.exports = router;
