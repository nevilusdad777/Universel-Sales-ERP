const express = require('express');
const router = express.Router();
const { getQuotations, getQuotationById, createQuotation, updateQuotation, deleteQuotation, approveQuotation } = require('../controllers/quotationController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/', getQuotations);
router.get('/:id', getQuotationById);
router.post('/', createQuotation);
router.put('/:id', updateQuotation);
router.delete('/:id', deleteQuotation);
router.post('/:id/approve', approveQuotation);

module.exports = router;
