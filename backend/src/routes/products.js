const express = require('express');
const router = express.Router();
const { getProducts, getProductById, createProduct, updateProduct, deleteProduct } = require('../controllers/productController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/', getProducts);
router.get('/:id', getProductById);
// Only Admin and Manager can modify products
router.post('/', authorize('SUPER_ADMIN', 'MANAGER'), createProduct);
router.put('/:id', authorize('SUPER_ADMIN', 'MANAGER'), updateProduct);
router.delete('/:id', authorize('SUPER_ADMIN', 'MANAGER'), deleteProduct);

module.exports = router;
