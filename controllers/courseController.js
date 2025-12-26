const db = require('../config/database');
const admin = require('firebase-admin'); 


exports.getCourses = async (req, res) => {
    try {
        const userId = req.user.id;
        const [rows] = await db.query(`
            SELECT * FROM courses 
            WHERE id NOT IN (SELECT course_id FROM enrollments WHERE user_id = ?)
        `, [userId]);

        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


exports.getRecommendedCourses = async (req, res) => {
    try {
        let query = 'SELECT * FROM courses';
        let params = [];

        if (req.user && req.user.id) {
            query += ' WHERE id NOT IN (SELECT course_id FROM enrollments WHERE user_id = ?)';
            params.push(req.user.id);
        }
        
        query += ' LIMIT 5';

        const [rows] = await db.query(query, params);
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


exports.getCourseDetail = async (req, res) => {
    try {
        const { courseId } = req.params;
        const [rows] = await db.query('SELECT * FROM courses WHERE id = ?', [courseId]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Kursus tidak ditemukan' });
        }
        res.status(200).json({ success: true, data: rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


exports.enrollCourse = async (req, res) => {
    try {
        const { courseId } = req.params; 
        const userId = req.user.id;

        
        const [existing] = await db.query(
            'SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?',
            [userId, courseId]
        );

        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Anda sudah terdaftar di kursus ini' });
        }

        
        await db.query(
            'INSERT INTO enrollments (user_id, course_id, status, registered_at) VALUES (?, ?, ?, NOW())',
            [userId, courseId, 'Active']
        );

        
        
        
        const [userData] = await db.query('SELECT fcm_token FROM users WHERE id = ?', [userId]);
        const [courseData] = await db.query('SELECT title FROM courses WHERE id = ?', [courseId]);

        const userToken = userData[0]?.fcm_token;
        const courseTitle = courseData[0]?.title || 'Kursus Baru';

        
        if (userToken) {
            const message = {
                notification: {
                    title: "Pendaftaran Berhasil! 🎉",
                    body: `Selamat, Anda telah berhasil mendaftar pada kursus "${courseTitle}". Jangan lupa cek email!`
                },
                token: userToken,
                data: {
                    type: "enrollment_success",
                    course_id: courseId.toString()
                }
            };

            try {
                await admin.messaging().send(message);
                console.log(`✅ Notifikasi Enroll dikirim ke User ${userId}`);
            } catch (error) {
                console.error("❌ Gagal kirim notif:", error.message);
            }
        }
        

        res.status(201).json({ success: true, message: 'Pendaftaran kursus berhasil' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};


exports.getUserStats = async (req, res) => {
    try {
        const userId = req.user.id;

        const [courseStats] = await db.query(`
            SELECT 
                COUNT(CASE WHEN status = 'Active' THEN 1 END) as active_courses,
                COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed_courses
            FROM enrollments WHERE user_id = ?
        `, [userId]);

        const [badgeStats] = await db.query(`
            SELECT COUNT(*) as total_badges FROM user_badges WHERE user_id = ?
        `, [userId]);

        res.status(200).json({
            success: true,
            data: {
                activeCourses: courseStats[0].active_courses || 0,
                completedCourses: courseStats[0].completed_courses || 0,
                totalBadges: badgeStats[0].total_badges || 0
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


exports.getMyEnrolledCourses = async (req, res) => {
    try {
        const userId = req.user.id;
        const { status } = req.query; 

        let query = `
            SELECT c.*, e.status as enrollment_status, e.progress 
            FROM courses c
            JOIN enrollments e ON c.id = e.course_id
            WHERE e.user_id = ?
        `;
        
        const params = [userId];

        if (status) {
            query += " AND e.status = ?";
            params.push(status);
        }

        const [rows] = await db.query(query, params);

        res.status(200).json({
            success: true,
            data: rows
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};