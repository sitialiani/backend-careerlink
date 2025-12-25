// Lokasi: controllers/courseController.js
// Controller untuk semua fitur Kursus

const courseModel = require('../models/courseModel');
const badgeModel = require('../models/badgeModel');
const notificationHelper = require('../utils/notificationHelper');

// ======================== 1. LIST KURSUS ========================

/**
 * GET /api/courses
 * User dapat melihat daftar kursus yang tersedia
 * 
 * Query params:
 * - location_type: 'Online' atau 'Offline'
 * - provider_name: filter berdasarkan provider
 * - search: search berdasarkan title
 */
exports.getAllCourses = async (req, res) => {
    try {
        const filters = {
            location_type: req.query.location_type || null,
            provider_name: req.query.provider_name || null,
            search: req.query.search || null
        };

        const courses = await courseModel.getAllCourses(filters);

        console.log(`📚 Ambil daftar kursus: ${courses.length} kursus ditemukan`);

        res.status(200).json({
            success: true,
            message: 'Daftar kursus berhasil diambil',
            count: courses.length,
            data: courses
        });
    } catch (error) {
        console.error('❌ Error getAllCourses:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil daftar kursus',
            error: error.message
        });
    }
};

/**
 * GET /api/courses/:courseId
 * Ambil detail satu kursus
 */
exports.getCourseById = async (req, res) => {
    try {
        const { courseId } = req.params;

        const course = await courseModel.getCourseById(courseId);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Kursus tidak ditemukan'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Detail kursus berhasil diambil',
            data: course
        });
    } catch (error) {
        console.error('❌ Error getCourseById:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil detail kursus',
            error: error.message
        });
    }
};

/**
 * GET /api/courses/recommended
 * Ambil kursus yang direkomendasikan (upcoming courses)
 */
exports.getRecommendedCourses = async (req, res) => {
    try {
        const limit = req.query.limit || 5;
        const courses = await courseModel.getRecommendedCourses(limit);

        res.status(200).json({
            success: true,
            message: 'Kursus rekomendasi berhasil diambil',
            count: courses.length,
            data: courses
        });
    } catch (error) {
        console.error('❌ Error getRecommendedCourses:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil kursus rekomendasi',
            error: error.message
        });
    }
};

// ======================== 2. PENDAFTARAN KURSUS (ENROLLMENT) ========================

/**
 * GET /api/courses/my-courses
 * User melihat kursus yang sudah diikuti
 */
exports.getMyEnrolledCourses = async (req, res) => {
    try {
        const userId = req.user.id; // dari auth middleware

        const enrolledCourses = await courseModel.getUserEnrolledCourses(userId);

        console.log(`👤 User ${userId}: ${enrolledCourses.length} kursus diikuti`);

        res.status(200).json({
            success: true,
            message: 'Daftar kursus yang diikuti berhasil diambil',
            count: enrolledCourses.length,
            data: enrolledCourses
        });
    } catch (error) {
        console.error('❌ Error getMyEnrolledCourses:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil daftar kursus yang diikuti',
            error: error.message
        });
    }
};

/**
 * POST /api/courses/:courseId/enroll
 * User mendaftar ke kursus skill
 * 
 * Fitur:
 * - Validasi kuota
 * - Cek duplikasi
 * - Kirim notifikasi reminder
 */
exports.enrollCourse = async (req, res) => {
    try {
        const userId = req.user.id;
        const { courseId } = req.params;

        // Cek apakah sudah terdaftar
        const existingEnrollment = await courseModel.checkUserEnrollment(userId, courseId);
        if (existingEnrollment) {
            return res.status(400).json({
                success: false,
                message: 'Anda sudah terdaftar di kursus ini'
            });
        }

        // Lakukan enrollment
        const enrollmentId = await courseModel.enrollUserToCourse(userId, courseId);

        // Ambil detail course untuk notifikasi
        const course = await courseModel.getCourseById(courseId);

        console.log(`✅ User ${userId} terdaftar di kursus: ${course.title}`);

        // Kirim notifikasi reminder
        const notificationMessage = `Selamat! Anda sudah terdaftar di kursus "${course.title}". Jangan lupa ikuti jadwalnya!`;
        await notificationHelper.sendNotification(
            userId,
            'Pendaftaran Kursus Sukses',
            notificationMessage,
            'course_enrolled'
        );

        // Jadwalkan reminder notification untuk 1 jam sebelum kursus dimulai
        if (course.date_start) {
            const reminderTime = new Date(course.date_start.getTime() - 60 * 60 * 1000); // 1 jam sebelum
            scheduleReminderNotification(userId, courseId, course.title, reminderTime);
        }

        res.status(201).json({
            success: true,
            message: 'Pendaftaran kursus berhasil',
            enrollmentId: enrollmentId,
            data: {
                course_id: courseId,
                course_title: course.title,
                enrolled_at: new Date()
            }
        });
    } catch (error) {
        console.error('❌ Error enrollCourse:', error);

        if (error.message.includes('sudah terdaftar')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        if (error.message.includes('Kuota')) {
            return res.status(400).json({
                success: false,
                message: 'Kuota kursus sudah penuh. Silakan coba kursus lain.'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Gagal mendaftar kursus',
            error: error.message
        });
    }
};

/**
 * DELETE /api/courses/:courseId/unenroll
 * User batalkan pendaftaran kursus
 */
exports.unenrollCourse = async (req, res) => {
    try {
        const userId = req.user.id;
        const { courseId } = req.params;

        // Cek apakah terdaftar
        const enrollment = await courseModel.checkUserEnrollment(userId, courseId);
        if (!enrollment) {
            return res.status(404).json({
                success: false,
                message: 'Anda tidak terdaftar di kursus ini'
            });
        }

        await courseModel.cancelEnrollment(userId, courseId);

        const course = await courseModel.getCourseById(courseId);

        console.log(`❌ User ${userId} membatalkan kursus: ${course.title}`);

        // Kirim notifikasi pembatalan
        await notificationHelper.sendNotification(
            userId,
            'Pembatalan Kursus',
            `Anda telah membatalkan pendaftaran kursus "${course.title}"`,
            'course_cancelled'
        );

        res.status(200).json({
            success: true,
            message: 'Pembatalan pendaftaran kursus berhasil',
            data: {
                course_id: courseId,
                course_title: course.title
            }
        });
    } catch (error) {
        console.error('❌ Error unenrollCourse:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal membatalkan pendaftaran kursus',
            error: error.message
        });
    }
};

// ======================== 3. STATISTIK KURSUS ========================

/**
 * GET /api/courses/stats
 * User melihat statistik kursus yang sudah diikuti
 * 
 * Return:
 * - total_courses: total kursus yang diikuti
 * - completed_courses: kursus yang sudah selesai
 * - active_courses: kursus yang sedang berjalan
 * - cancelled_courses: kursus yang dibatalkan
 */
exports.getCourseStats = async (req, res) => {
    try {
        const userId = req.user.id;

        const stats = await courseModel.getCourseStats(userId);

        res.status(200).json({
            success: true,
            message: 'Statistik kursus berhasil diambil',
            data: stats
        });
    } catch (error) {
        console.error('❌ Error getCourseStats:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil statistik kursus',
            error: error.message
        });
    }
};

/**
 * GET /api/courses/recap
 * User melihat rekap lengkap kursus dengan badge yang diperoleh
 */
exports.getCourseRecap = async (req, res) => {
    try {
        const userId = req.user.id;

        const recap = await courseModel.getCourseRecap(userId);

        res.status(200).json({
            success: true,
            message: 'Rekap kursus berhasil diambil',
            count: recap.length,
            data: recap
        });
    } catch (error) {
        console.error('❌ Error getCourseRecap:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil rekap kursus',
            error: error.message
        });
    }
};

// ======================== 4. BADGE & QR CODE ========================

/**
 * GET /api/badges
 * User melihat semua badge yang diperoleh
 */
exports.getUserBadges = async (req, res) => {
    try {
        const userId = req.user.id;

        const badges = await badgeModel.getUserBadgesDetailed(userId);

        res.status(200).json({
            success: true,
            message: 'Daftar badge berhasil diambil',
            count: badges.length,
            data: badges
        });
    } catch (error) {
        console.error('❌ Error getUserBadges:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil daftar badge',
            error: error.message
        });
    }
};

/**
 * POST /api/badges/scan-qr
 * User scan QR Code (berisi course_id) untuk mendapatkan badge
 * 
 * Body:
 * {
 *   "course_id": 5
 * }
 */
exports.scanQRCodeBadge = async (req, res) => {
    try {
        const userId = req.user.id;
        const { course_id } = req.body;

        // Validasi input
        if (!course_id) {
            return res.status(400).json({
                success: false,
                message: 'course_id wajib diisi (dari QR token)'
            });
        }

        // 1. Validasi course exist
        const course = await courseModel.getCourseById(course_id);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Kursus tidak ditemukan. QR Code invalid atau kadaluarsa.'
            });
        }

        // 2. Cari badge untuk course ini
        const [badges] = await badgeModel.getBadgeByQRToken(String(course_id));
        if (!badges || badges.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Badge untuk kursus ini tidak ditemukan'
            });
        }

        const badgeData = badges[0];

        // 3. Validasi user sudah menyelesaikan course
        const [enrollment] = await courseModel.checkUserCourseCompletion(userId, course_id);
        if (!enrollment || enrollment.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Anda harus menyelesaikan kursus ini terlebih dahulu sebelum dapat badge'
            });
        }

        // 4. Cek apakah user sudah memiliki badge ini
        const [existingBadge] = await badgeModel.checkUserHasBadge(userId, badgeData.id);
        if (existingBadge && existingBadge.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Anda sudah memiliki badge dari kursus ini'
            });
        }

        // 5. Assign badge ke user
        await badgeModel.assignBadgeToUser(userId, badgeData.id);

        console.log(`🏆 User ${userId} mendapat badge: ${badgeData.title} (Course: ${course.title})`);

        // Kirim notifikasi achievement
        await notificationHelper.sendNotification(
            userId,
            '🏆 Pencapaian Baru!',
            `Selamat! Anda mendapatkan badge "${badgeData.title}" dari kursus "${course.title}"`,
            'badge_earned'
        );

        res.status(200).json({
            success: true,
            message: 'Badge berhasil diperoleh!',
            data: {
                badge_id: badgeData.id,
                badge_title: badgeData.title,
                course_id: course_id,
                course_title: course.title,
                obtained_at: new Date()
            }
        });
    } catch (error) {
        console.error('❌ Error scanQRCodeBadge:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal memproses scan badge',
            error: error.message
        });
    }
};

/**
 * GET /api/badges/stats
 * Ambil statistik badge user
 */
exports.getBadgeStats = async (req, res) => {
    try {
        const userId = req.user.id;

        const stats = await badgeModel.getBadgeStats(userId);

        res.status(200).json({
            success: true,
            message: 'Statistik badge berhasil diambil',
            data: stats
        });
    } catch (error) {
        console.error('❌ Error getBadgeStats:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil statistik badge',
            error: error.message
        });
    }
};

// ======================== 5. ADMIN - KELOLA KURSUS ========================

/**
 * POST /api/courses
 * Admin/Instructor buat kursus baru
 * 
 * Body:
 * {
 *   "title": "...",
 *   "description": "...",
 *   "provider_name": "...",
 *   "location_type": "Online|Offline|Hybrid",
 *   "location_detail": "...",
 *   "date_start": "YYYY-MM-DD",
 *   "date_end": "YYYY-MM-DD",
 *   "quota": number,
 *   "image_url": "..." (optional)
 * }
 */
exports.createCourse = async (req, res) => {
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
        } = req.body;

        // Validasi input wajib
        if (!title || !description || !provider_name || !location_type || !date_start || !date_end || !quota) {
            return res.status(400).json({
                success: false,
                message: 'Data kursus tidak lengkap. Wajib: title, description, provider_name, location_type, date_start, date_end, quota'
            });
        }

        // Buat kursus baru
        const courseId = await courseModel.createCourse({
            title,
            description,
            provider_name,
            location_type,
            location_detail,
            date_start,
            date_end,
            quota,
            image_url
        });

        console.log(`✅ Kursus baru dibuat: ${title} (ID: ${courseId})`);

        // ✨ OTOMATIS BUAT BADGE UNTUK COURSE INI
        // QR Token = courseId (simple & meaningful)
        const qrToken = String(courseId);
        const badgeTitle = `${title} Completion Badge`;
        
        try {
            await badgeModel.createBadge(null, {
                course_id: courseId,
                title: badgeTitle,
                issuer: provider_name,
                qr_token: qrToken,
                is_external: 0
            });
            console.log(`🏆 Badge otomatis dibuat untuk course ${courseId} - QR Token (Course ID) = ${qrToken}`);
        } catch (badgeError) {
            console.error('⚠️ Warning: Gagal membuat badge otomatis:', badgeError);
            // Jangan stop flow create course jika badge gagal
        }

        // Kirim notifikasi ke semua user (kursus baru tersedia)
        const notificationMessage = `Kursus baru tersedia: "${title}". Daftar sekarang!`;
        await notificationHelper.sendNotification(
            null, // null = broadcast ke semua user
            '📢 Kursus Baru',
            notificationMessage,
            'new_course_available'
        );

        res.status(201).json({
            success: true,
            message: 'Kursus berhasil dibuat (Badge otomatis dibuat)',
            courseId: courseId,
            data: {
                title,
                provider_name,
                location_type,
                quota,
                qr_token: qrToken,
                badge_title: badgeTitle,
                note: `Scan QR berisi course_id ${courseId} untuk dapat badge`,
                created_at: new Date()
            }
        });
    } catch (error) {
        console.error('❌ Error createCourse:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal membuat kursus',
            error: error.message
        });
    }
};

/**
 * PUT /api/courses/:courseId
 * Admin/Instructor update kursus
 */
exports.updateCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        const updateData = req.body;

        // Cek apakah kursus ada
        const course = await courseModel.getCourseById(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Kursus tidak ditemukan'
            });
        }

        // Update kursus
        await courseModel.updateCourse(courseId, updateData);

        console.log(`✏️ Kursus ${courseId} diperbarui`);

        res.status(200).json({
            success: true,
            message: 'Kursus berhasil diperbarui',
            courseId: courseId,
            data: updateData
        });
    } catch (error) {
        console.error('❌ Error updateCourse:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal memperbarui kursus',
            error: error.message
        });
    }
};

/**
 * DELETE /api/courses/:courseId
 * Admin/Instructor hapus kursus
 */
exports.deleteCourse = async (req, res) => {
    try {
        const { courseId } = req.params;

        // Cek apakah kursus ada
        const course = await courseModel.getCourseById(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Kursus tidak ditemukan'
            });
        }

        // Hapus kursus
        await courseModel.deleteCourse(courseId);

        console.log(`🗑️ Kursus ${courseId} dihapus`);

        // Kirim notifikasi ke user yang terdaftar
        const enrolledUsers = await courseModel.getEnrolledUsersByCourse(courseId);
        const notificationMessage = `Kursus "${course.title}" dibatalkan oleh admin.`;
        for (const user of enrolledUsers) {
            await notificationHelper.sendNotification(
                user.user_id,
                '❌ Kursus Dibatalkan',
                notificationMessage,
                'course_deleted'
            );
        }

        res.status(200).json({
            success: true,
            message: 'Kursus berhasil dihapus',
            courseId: courseId,
            course_title: course.title
        });
    } catch (error) {
        console.error('❌ Error deleteCourse:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal menghapus kursus',
            error: error.message
        });
    }
};

/**
 * GET /api/courses/admin/list
 * Admin lihat semua kursus yang dia buat
 */
exports.getAdminCourses = async (req, res) => {
    try {
        // Ambil semua kursus (tanpa filter admin karena tidak ada created_by field)
        const courses = await courseModel.getAllCourses({});

        // Hitung enrollment untuk masing-masing kursus
        const coursesWithStats = await Promise.all(
            courses.map(async (course) => {
                const enrollmentCount = await courseModel.getEnrollmentCountByCourse(course.id);
                return {
                    ...course,
                    enrollment_count: enrollmentCount
                };
            })
        );

        console.log(`📊 Admin view: ${coursesWithStats.length} kursus`);

        res.status(200).json({
            success: true,
            message: 'Daftar kursus admin berhasil diambil',
            count: coursesWithStats.length,
            data: coursesWithStats
        });
    } catch (error) {
        console.error('❌ Error getAdminCourses:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil daftar kursus admin',
            error: error.message
        });
    }
};

// ======================== HELPER FUNCTIONS ========================

/**
 * Generate random string
 */
function generateRandomString(length) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * Schedule reminder notification untuk kursus
 * Akan mengirim notifikasi 1 jam sebelum kursus dimulai
 */
function scheduleReminderNotification(userId, courseId, courseTitle, reminderTime) {
    const now = new Date();
    const delayMs = reminderTime.getTime() - now.getTime();

    if (delayMs > 0) {
        setTimeout(async () => {
            try {
                await notificationHelper.sendNotification(
                    userId,
                    '⏰ Pengingat Kursus',
                    `Kursus "${courseTitle}" dimulai dalam 1 jam! Bersiaplah.`,
                    'course_reminder'
                );
                console.log(`⏰ Reminder notification dikirim untuk user ${userId}`);
            } catch (error) {
                console.error('❌ Error sending reminder notification:', error);
            }
        }, delayMs);
    }
}
