const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

if (!authenticateToken) {
    console.error("CRITICAL ERROR: authenticateToken gagal di-load! Cek path file middleware.");
    process.exit(1);
}

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/update-fcm', authenticateToken, authController.updateFcmToken);

module.exports = router;