// Lokasi: models/courseModel.js
// Model untuk Course dan Course Enrollment

const db = require('../config/database');

// ======================== COURSES ========================

/**
 * Ambil semua daftar kursus yang tersedia
 * GET /api/courses
 */
exports.getAllCourses = async (filters = {}) => {
    try {
        let query = 'SELECT * FROM courses WHERE 1=1';
        const params = [];

        // Filter berdasarkan location_type (Online/Offline)
        if (filters.location_type) {
            query += ' AND location_type = ?';
            params.push(filters.location_type);
        }

        // Filter berdasarkan provider_name
        if (filters.provider_name) {
            query += ' AND provider_name LIKE ?';
            params.push(`%${filters.provider_name}%`);
        }

        // Search berdasarkan title
        if (filters.search) {
            query += ' AND (title LIKE ? OR description LIKE ?)';
            params.push(`%${filters.search}%`, `%${filters.search}%`);
        }

        query += ' ORDER BY created_at DESC';

        const [courses] = await db.query(query, params);
        return courses;
    } catch (error) {
        throw error;
    }
};

/**
 * Ambil detail satu kursus
 * GET /api/courses/:courseId
 */
exports.getCourseById = async (courseId) => {
    try {
        const [courses] = await db.query('SELECT * FROM courses WHERE id = ?', [courseId]);
        return courses[0] || null;
    } catch (error) {
        throw error;
    }
};

/**
 * Ambil kursus yang direkomendasikan
 * Bisa berdasarkan recent courses atau popular courses
 */
exports.getRecommendedCourses = async (limit = 5) => {
    try {
        const [courses] = await db.query(
            'SELECT * FROM courses WHERE date_start >= NOW() ORDER BY created_at DESC LIMIT ?',
            [limit]
        );
        return courses;
    } catch (error) {
        throw error;
    }
};

// ======================== COURSE ENROLLMENTS ========================

/**
 * Ambil semua kursus yang sudah diikuti user
 * GET /api/courses/user/:userId
 */
exports.getUserEnrolledCourses = async (userId) => {
    try {
        const [enrollments] = await db.query(
            `SELECT c.*, ce.user_id, ce.status, ce.registered_at 
             FROM enrollments ce
             JOIN courses c ON ce.course_id = c.id
             WHERE ce.user_id = ?
             ORDER BY ce.registered_at DESC`,
            [userId]
        );
        return enrollments;
    } catch (error) {
        throw error;
    }
};

/**
 * Daftar user ke kursus (enrollment)
 * POST /api/courses/:courseId/enroll
 */
exports.enrollUserToCourse = async (userId, courseId) => {
    try {
        // Cek apakah user sudah terdaftar di kursus ini
        const [existing] = await db.query(
            'SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?',
            [userId, courseId]
        );

        if (existing.length > 0) {
            throw new Error('User sudah terdaftar di kursus ini');
        }

        // Cek kuota kursus
        const [course] = await db.query('SELECT quota FROM courses WHERE id = ?', [courseId]);
        if (!course[0]) {
            throw new Error('Kursus tidak ditemukan');
        }

        // Hitung peserta yang sudah terdaftar
        const [enrollment_count] = await db.query(
            'SELECT COUNT(*) as count FROM enrollments WHERE course_id = ? AND status != "Cancelled"',
            [courseId]
        );

        if (enrollment_count[0].count >= course[0].quota) {
            throw new Error('Kuota kursus sudah penuh');
        }

        // Insert enrollment
        const [result] = await db.query(
            'INSERT INTO enrollments (user_id, course_id, status, registered_at) VALUES (?, ?, ?, NOW())',
            [userId, courseId, 'Active']
        );

        return result.insertId;
    } catch (error) {
        throw error;
    }
};

/**
 * Batalkan pendaftaran kursus
 * DELETE /api/courses/:courseId/unenroll
 */
exports.cancelEnrollment = async (userId, courseId) => {
    try {
        const [result] = await db.query(
            'UPDATE enrollments SET status = ? WHERE user_id = ? AND course_id = ?',
            ['Cancelled', userId, courseId]
        );

        if (result.affectedRows === 0) {
            throw new Error('Enrollment tidak ditemukan');
        }

        return result.affectedRows;
    } catch (error) {
        throw error;
    }
};

/**
 * Cek apakah user sudah mendaftar di kursus
 */
exports.checkUserEnrollment = async (userId, courseId) => {
    try {
        const [enrollment] = await db.query(
            'SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?',
            [userId, courseId]
        );

        return enrollment.length > 0 ? enrollment[0] : null;
    } catch (error) {
        throw error;
    }
};

// ======================== COURSE STATISTICS ========================

/**
 * Ambil statistik kursus user
 * GET /api/courses/stats/:userId
 */
exports.getCourseStats = async (userId) => {
    try {
        const [stats] = await db.query(
            `SELECT 
                COUNT(*) as total_courses,
                SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed_courses,
                SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active_courses,
                SUM(CASE WHEN status = 'Cancelled' THEN 1 ELSE 0 END) as cancelled_courses
             FROM enrollments 
             WHERE user_id = ?`,
            [userId]
        );

        return stats[0] || {
            total_courses: 0,
            completed_courses: 0,
            active_courses: 0,
            cancelled_courses: 0
        };
    } catch (error) {
        throw error;
    }
};

/**
 * Ambil rekap kursus lengkap dengan detail kategori/skills
 * GET /api/courses/recap/:userId
 */
exports.getCourseRecap = async (userId) => {
    try {
        const [recap] = await db.query(
            `SELECT 
                c.id,
                c.title,
                c.provider_name,
                c.image_url,
                ce.status,
                ce.registered_at,
                ce.completion_date,
                GROUP_CONCAT(DISTINCT ub.title) as badges_earned
             FROM enrollments ce
             JOIN courses c ON ce.course_id = c.id
             LEFT JOIN user_badges ub ON ce.course_id = ub.course_id AND ce.user_id = ub.user_id
             WHERE ce.user_id = ?
             GROUP BY ce.id, c.id, c.title, c.provider_name, c.image_url, ce.status, ce.registered_at, ce.completion_date
             ORDER BY ce.registered_at DESC`,
            [userId]
        );

        return recap;
    } catch (error) {
        throw error;
    }
};

// ======================== ENROLLMENT MANAGEMENT ========================

/**
 * Update status enrollment (Admin)
 */
exports.updateEnrollmentStatus = async (enrollmentId, status) => {
    try {
        const [result] = await db.query(
            'UPDATE enrollments SET status = ? WHERE id = ?',
            [status, enrollmentId]
        );

        return result.affectedRows;
    } catch (error) {
        throw error;
    }
};

/**
 * Buat kursus baru
 * POST /api/courses
 */
exports.createCourse = async (courseData) => {
    try {
        const {
            title,
            description,
            provider_name,
            location_type,
            location_detail,
            date_start,
            date_end,
            quota,
            image_url
        } = courseData;

        const [result] = await db.query(
            `INSERT INTO courses 
            (title, description, provider_name, location_type, location_detail, date_start, date_end, quota, image_url, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [title, description, provider_name, location_type, location_detail, date_start, date_end, quota, image_url || null]
        );

        return result.insertId;
    } catch (error) {
        throw error;
    }
};

/**
 * Update kursus
 * PUT /api/courses/:courseId
 */
exports.updateCourse = async (courseId, updateData) => {
    try {
        const allowedFields = ['title', 'description', 'provider_name', 'location_type', 'location_detail', 'date_start', 'date_end', 'quota', 'price', 'image_url'];
        
        let query = 'UPDATE courses SET ';
        const values = [];
        const fields = [];

        // Build dynamic query
        for (const [key, value] of Object.entries(updateData)) {
            if (allowedFields.includes(key)) {
                fields.push(`${key} = ?`);
                values.push(value);
            }
        }

        if (fields.length === 0) {
            throw new Error('Tidak ada field yang valid untuk diupdate');
        }

        query += fields.join(', ') + ' WHERE id = ?';
        values.push(courseId);

        const [result] = await db.query(query, values);
        return result.affectedRows;
    } catch (error) {
        throw error;
    }
};

/**
 * Hapus kursus
 * DELETE /api/courses/:courseId
 */
exports.deleteCourse = async (courseId) => {
    try {
        // Hapus enrollments dulu
        await db.query('DELETE FROM enrollments WHERE course_id = ?', [courseId]);

        // Hapus course
        const [result] = await db.query('DELETE FROM courses WHERE id = ?', [courseId]);

        return result.affectedRows;
    } catch (error) {
        throw error;
    }
};

/**
 * Ambil user yang terdaftar di kursus tertentu
 */
exports.getEnrolledUsersByCourse = async (courseId) => {
    try {
        const [users] = await db.query(
            'SELECT DISTINCT user_id FROM enrollments WHERE course_id = ?',
            [courseId]
        );
        return users;
    } catch (error) {
        throw error;
    }
};

/**
 * Hitung jumlah enrollment untuk kursus
 */
exports.getEnrollmentCountByCourse = async (courseId) => {
    try {
        const [result] = await db.query(
            'SELECT COUNT(*) as count FROM enrollments WHERE course_id = ? AND status = "Active"',
            [courseId]
        );
        return result[0]?.count || 0;
    } catch (error) {
        throw error;
    }
};

/**
 * Cek apakah user sudah menyelesaikan course
 */
exports.checkUserCourseCompletion = async (userId, courseId) => {
    try {
        return await db.query(
            'SELECT * FROM enrollments WHERE user_id = ? AND course_id = ? AND status = "Completed"',
            [userId, courseId]
        );
    } catch (error) {
        throw error;
    }
};
