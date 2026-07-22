const express = require('express');
const router = express.Router();
const { getQuotations, getQuotationById, createQuotation, updateQuotation, deleteQuotation, approveQuotation } = require('../controllers/quotationController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/', getQuotations);
router.get('/:id', getQuotationById);
router.post('/', createQuotation);
router.put('/:id', updateQuotation);
router.delete('/:id', authorize('SUPER_ADMIN', 'MANAGER'), deleteQuotation);
router.post('/:id/approve', authorize('SUPER_ADMIN', 'MANAGER'), approveQuotation);

module.exports = router;
