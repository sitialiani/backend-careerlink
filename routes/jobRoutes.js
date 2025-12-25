// Lokasi: routes/jobRoutes.js
const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');

// URL: /api/jobs
router.get('/', jobController.getAllJobs);

// URL: /api/jobs/1 (Detail)
router.get('/:id', jobController.getJobDetail);

// URL: /api/jobs (POST - Buat Nambah Data)
router.post('/', jobController.createJob);

module.exports = router;