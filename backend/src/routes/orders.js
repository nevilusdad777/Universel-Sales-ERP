const express = require('express');
const router = express.Router();
const { getOrders, getOrderById, createOrder, cancelOrder } = require('../controllers/orderController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/', getOrders);
router.get('/:id', getOrderById);
router.post('/', createOrder);
router.patch('/:id/cancel', authorize('SUPER_ADMIN', 'MANAGER'), cancelOrder);

module.exports = router;
