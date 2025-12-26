const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Pastikan nama fungsi setelah courseController. SAMA dengan di file controller
router.get('/', authenticateToken, courseController.getCourses);
router.get('/recommended', authenticateToken, courseController.getRecommendedCourses);

// Error biasanya di sini karena nama fungsi berbeda (getUserStats vs getCourseStats)
router.get('/stats', authenticateToken, courseController.getUserStats); 

// Endpoint untuk list detail (Aktif/Selesai)
router.get('/enrolled/list', authenticateToken, courseController.getMyEnrolledCourses);

// Detail kursus
router.get('/:courseId', authenticateToken, courseController.getCourseDetail);

// Daftar kursus
router.post('/enroll/:courseId', authenticateToken, courseController.enrollCourse);

module.exports = router;