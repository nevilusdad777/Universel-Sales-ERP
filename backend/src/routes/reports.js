const express = require('express');
const router = express.Router();
const { getSalesReport, getCustomerReport, getOutstandingReport, getInventoryReport } = require('../controllers/reportController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.use(protect);
router.use(authorize('SUPER_ADMIN', 'MANAGER'));

router.get('/sales',       getSalesReport);
router.get('/customers',   getCustomerReport);
router.get('/customer',    getCustomerReport);
router.get('/outstanding', getOutstandingReport);
router.get('/inventory',   getInventoryReport);

module.exports = router;
