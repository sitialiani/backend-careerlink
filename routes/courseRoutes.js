// Lokasi: routes/courseRoutes.js
// Routes untuk semua fitur Kursus

const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { authenticateToken } = require('../middleware/authMiddleware');

// ======================== 1. LIST KURSUS ========================

// GET /api/courses
// Melihat daftar kursus dengan filter optional
// Query: ?location_type=Online&provider_name=Udemy&search=Python
router.get('/', courseController.getAllCourses);

// POST /api/courses
// Admin/Instructor membuat kursus baru
router.post('/', courseController.createCourse);

// GET /api/courses/recommended
// Melihat kursus yang direkomendasikan
router.get('/recommended', courseController.getRecommendedCourses);

// GET /api/courses/admin/list
// Admin lihat semua kursus dengan statistik enrollment
router.get('/admin/list', courseController.getAdminCourses);

// GET /api/courses/:courseId
// Melihat detail satu kursus
router.get('/:courseId', courseController.getCourseById);

// PUT /api/courses/:courseId
// Admin/Instructor update kursus
router.put('/:courseId', courseController.updateCourse);

// DELETE /api/courses/:courseId
// Admin/Instructor hapus kursus
router.delete('/:courseId', courseController.deleteCourse);

// ======================== 2. PENDAFTARAN KURSUS (Memerlukan Auth) ========================

// GET /api/courses/my-courses
// Melihat kursus yang sudah diikuti user
router.get('/enrolled/list', authenticateToken, courseController.getMyEnrolledCourses);

// POST /api/courses/:courseId/enroll
// Mendaftar ke kursus
router.post('/:courseId/enroll', authenticateToken, courseController.enrollCourse);

// DELETE /api/courses/:courseId/unenroll
// Batalkan pendaftaran kursus
router.delete('/:courseId/unenroll', authenticateToken, courseController.unenrollCourse);

// ======================== 3. STATISTIK KURSUS (Memerlukan Auth) ========================

// GET /api/courses/stats
// Melihat statistik kursus user
router.get('/stats/overview', authenticateToken, courseController.getCourseStats);

// GET /api/courses/recap
// Melihat rekap lengkap kursus
router.get('/recap/all', authenticateToken, courseController.getCourseRecap);

// ======================== 4. BADGE & QR CODE (Memerlukan Auth) ========================

// GET /api/badges
// Melihat badge yang sudah diperoleh
router.get('/badges/list', authenticateToken, courseController.getUserBadges);

// POST /api/badges/scan-qr
// Scan QR Code untuk mendapatkan badge
router.post('/badges/scan-qr', authenticateToken, courseController.scanQRCodeBadge);

// GET /api/badges/stats
// Melihat statistik badge
router.get('/badges/stats', authenticateToken, courseController.getBadgeStats);

module.exports = router;
