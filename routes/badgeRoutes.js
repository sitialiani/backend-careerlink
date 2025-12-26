// Lokasi: routes/badgeRoutes.js
const express = require('express');
const router = express.Router();
const badgeController = require('../controllers/badgeController');
const { authenticateToken } = require('../middleware/authMiddleware');
const upload = require('../config/multerConfig'); 

// GET /api/badges/list
router.get('/list', authenticateToken, badgeController.getMyBadges);

// POST /api/badges/scan-qr
router.post('/scan-qr', authenticateToken, badgeController.scanBadge);

// POST /api/badges/upload (Mocking sukses dulu aja biar Android gak error)
router.post('/upload', authenticateToken, upload.single('file'), badgeController.uploadBadge);

module.exports = router;