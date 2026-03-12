const express = require('express');
const router = express.Router();
const authController = require('../controllers/authsController');
const authMiddleware = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

// Render login and signup pages
router.get('/account/login', authController.buildLogin);
router.get('/account/signup', authMiddleware, requireRole(['admin']), authController.buildSignup);

// Process forms
router.post('/login', authController.accountLogin);
router.post('/account/signup', authMiddleware, requireRole(['admin']), authController.signup);

// Logout
router.get('/logout', authController.logout);

// Refresh token endpoint
router.get('/refresh-token', authController.refreshToken);

router.use((err, req, res, next) => {
    console.error(err.stack)
    res.status(500).send("Something broke!")
})

module.exports = router;
