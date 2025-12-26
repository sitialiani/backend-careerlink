const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { authenticateToken } = require('../middleware/authMiddleware');


router.get('/', authenticateToken, courseController.getCourses);
router.get('/recommended', authenticateToken, courseController.getRecommendedCourses);


router.get('/stats', authenticateToken, courseController.getUserStats); 


router.get('/enrolled/list', authenticateToken, courseController.getMyEnrolledCourses);


router.get('/:courseId', authenticateToken, courseController.getCourseDetail);


router.post('/enroll/:courseId', authenticateToken, courseController.enrollCourse);

module.exports = router;