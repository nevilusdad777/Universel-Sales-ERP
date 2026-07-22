const express = require('express');
const router = express.Router();
const { getInvoices, createInvoice } = require('../controllers/invoiceController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/', getInvoices);
router.post('/', createInvoice);

module.exports = router;
