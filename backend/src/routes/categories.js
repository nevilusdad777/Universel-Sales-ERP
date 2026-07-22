const express = require('express');
const router = express.Router();
const { getCategories, createCategory } = require('../controllers/categoryController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.use(protect);
router.get('/', getCategories);
router.post('/', authorize('SUPER_ADMIN', 'MANAGER'), createCategory);

module.exports = router;
