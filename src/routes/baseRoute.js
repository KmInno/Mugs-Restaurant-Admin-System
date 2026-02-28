const baseController = require('../controllers/baseController');
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const productionController = require('../controllers/productionController');

router.get('/dashboard', authMiddleware, baseController.buildDashboard);
router.get('/signup', baseController.buildSignup);

router.get('/production', authMiddleware, productionController.showProductionPage);
router.post('/production', authMiddleware, productionController.addProductionEntry);

module.exports = router;