// Lokasi: routes/jobRoutes.js
const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');

// --- PERBAIKAN DI SINI ---
// Pakai { authenticateToken } karena di file middleware pakai exports.authenticateToken
const { authenticateToken } = require('../middleware/authMiddleware'); 
const upload = require('../config/multerConfig');
// -------------------------

// URL: /api/jobs
router.get('/', jobController.getAllJobs);

// Perhatikan: sekarang kita pakai variabel 'authenticateToken'
router.get('/history/my-applications', authenticateToken, jobController.getRiwayatLamaran);
router.get('/history/detail/:applicationId', authenticateToken, jobController.getDetailLamaran);

router.post('/', jobController.createJob);
router.get('/:id', jobController.getJobDetail);

router.post('/:id/apply', 
    authenticateToken,          // <-- Ubah di sini juga
    upload.fields([
        { name: 'cv', maxCount: 1 }, 
        { name: 'recommendation_letter', maxCount: 1 },
        { name: 'portfolio', maxCount: 1 }
    ]), 
    jobController.applyJob
);

module.exports = router;