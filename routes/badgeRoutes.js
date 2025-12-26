const express = require('express');
const router = express.Router();
const badgeController = require('../controllers/badgeController');
const { authenticateToken } = require('../middleware/authMiddleware');
const upload = require('../config/multerConfig'); 

router.get('/list', authenticateToken, badgeController.getMyBadges);
router.post('/scan-qr', authenticateToken, badgeController.scanBadge);
router.post('/upload', authenticateToken, upload.single('file'), badgeController.uploadBadge);

module.exports = router;