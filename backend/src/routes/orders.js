const express = require('express');
const router = express.Router();
const { getOrders, getOrderById, createOrder, cancelOrder } = require('../controllers/orderController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/', getOrders);
router.get('/:id', getOrderById);
router.post('/', createOrder);
router.patch('/:id/cancel', cancelOrder);

module.exports = router;
