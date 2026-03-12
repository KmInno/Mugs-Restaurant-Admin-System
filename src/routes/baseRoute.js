const baseController = require('../controllers/baseController');
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const productionController = require('../controllers/productionController');
const summaryController = require('../controllers/summaryController');
const requireRole = require('../middleware/roleMiddleware');

router.get('/dashboard', authMiddleware, baseController.buildDashboard);
router.get('/signup', baseController.buildSignup);

router.get('/production', authMiddleware, productionController.showProductionPage);
router.post('/production', authMiddleware, productionController.addProductionEntry);

// Summary/Reports page - Admin only
router.get('/summary', authMiddleware, requireRole(['admin']), summaryController.buildSummaryPage);

module.exports = router;