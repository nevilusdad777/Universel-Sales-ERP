const express = require('express');
const router = express.Router();
const { getInvoices, createInvoice, generateInvoicePDF } = require('../controllers/invoiceController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/', getInvoices);
router.get('/:id/pdf', generateInvoicePDF);
router.post('/', createInvoice);

module.exports = router;
