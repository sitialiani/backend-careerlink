const admin = require('../config/firebase');
const db = require('../config/database');

// ============================================
// GENERIC NOTIFICATIONS
// ============================================

/**
 * Fungsi 1: Kirim notifikasi ke SATU user (Personal)
 */
exports.sendNotificationToUser = async (userId, title, message) => {
    try {
        // 1. Ambil Token HP User dari Database
        const [rows] = await db.query('SELECT fcm_token FROM users WHERE id = ?', [userId]);
        
        if (rows.length === 0 || !rows[0].fcm_token) {
            console.log(`User ${userId} tidak punya token FCM.`);
            return;
        }

        const token = rows[0].fcm_token;

        // 2. Kirim via Firebase
        const payload = {
            notification: {
                title: title,
                body: message
            },
            token: token
        };

        await admin.messaging().send(payload);
        console.log(`Notifikasi dikirim ke user ${userId}`);

    } catch (error) {
        console.error("Gagal kirim FCM:", error);
    }
};

/**
 * Fungsi 2: Kirim notifikasi ke MULTIPLE users (Broadcast)
 * 
 * @param {string} title - Judul notifikasi
 * @param {string} message - Isi notifikasi
 * @param {Array|number|null} tokensOrJobId - Array FCM tokens, jobId (lama), atau null
 * @param {Object} dataPayload - Data payload untuk Android handling (optional)
 * 
 * BACKWARD COMPATIBLE dengan kode lama yang kirim jobId sebagai parameter ke-3
 */
exports.broadcastToAllUsers = async (title, message, tokensOrJobId, dataPayload = {}) => {
    try {
        let tokens = [];
        let payload = dataPayload;

        // Jika parameter ke-3 adalah array tokens (format baru)
        if (Array.isArray(tokensOrJobId) && tokensOrJobId.length > 0) {
            tokens = tokensOrJobId;
        } else {
            // Jika parameter ke-3 adalah jobId (format lama) atau null, ambil semua tokens
            // 🔥 RESTORE: Jika ada jobId, tambahkan ke data payload
            if (typeof tokensOrJobId === 'number') {
                payload = {
                    type: "job_detail",
                    jobId: String(tokensOrJobId),
                    ...payload
                };
            }

            const [rows] = await db.query('SELECT fcm_token FROM users WHERE fcm_token IS NOT NULL AND fcm_token != ""');

            if (rows.length === 0) {
                console.log("Tidak ada user yang memiliki token FCM.");
                return;
            }

            tokens = rows.map(row => row.fcm_token);
        }

        // Siapkan Payload dengan data jika ada
        // 🔥 INI BAGIAN PENTINGNYA 🔥
        // Data ini tidak tampil di layar, tapi dibaca oleh kodingan Android saat diklik
        const messagePayload = {
            notification: {
                title: title,
                body: message
            },
            tokens: tokens
        };

        // Tambahkan data payload jika ada (untuk Android handling)
        if (Object.keys(payload).length > 0) {
            messagePayload.data = payload;
        }

        const response = await admin.messaging().sendEachForMulticast(messagePayload);
        
        console.log(`[BROADCAST] Sukses kirim notif ke ${response.successCount} user.`);

    } catch (error) {
        console.error("Gagal broadcast notifikasi:", error);
    }
};

/**
 * Fungsi 3: Kirim notifikasi dengan data (untuk handling di Android)
 */
exports.sendNotification = async (userId, title, message, type, dataPayload = {}) => {
    try {
        const [rows] = await db.query('SELECT fcm_token FROM users WHERE id = ?', [userId]);
        
        if (rows.length === 0 || !rows[0].fcm_token) {
            console.log(`User ${userId} tidak punya token FCM.`);
            return false;
        }

        const token = rows[0].fcm_token;
        const payload = {
            notification: {
                title: title,
                body: message
            },
            data: {
                type: type,
                ...dataPayload
            },
            token: token
        };

        await admin.messaging().send(payload);
        console.log(`Notifikasi ${type} dikirim ke user ${userId}`);
        return true;

    } catch (error) {
        console.error(`Gagal kirim notifikasi ${type}:`, error);
        return false;
    }
};

// ============================================
// COURSE-SPECIFIC NOTIFICATIONS
// ============================================

/**
 * Kirim notifikasi enrollment ke kursus
 */
exports.sendEnrollmentNotification = async (userId, courseName, courseId) => {
    try {
        const message = `Selamat! Anda sudah terdaftar di kursus "${courseName}". Jangan lupa ikuti jadwalnya!`;
        
        return await exports.sendNotification(
            userId,
            'Pendaftaran Kursus Sukses ✅',
            message,
            'course_enrolled',
            {
                courseId: String(courseId),
                action: 'view_course'
            }
        );
    } catch (error) {
        console.error('❌ Error sending enrollment notification:', error);
        return false;
    }
};

/**
 * Kirim notifikasi reminder 1 jam sebelum kursus dimulai
 */
exports.sendCourseReminderNotification = async (userId, courseName, startTime) => {
    try {
        const startDate = new Date(startTime).toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const startHour = new Date(startTime).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit'
        });

        const message = `Pengingat: Kursus "${courseName}" dimulai hari ${startDate} pukul ${startHour}. Bersiaplah!`;
        
        return await exports.sendNotification(
            userId,
            '⏰ Pengingat Kursus',
            message,
            'course_reminder'
        );
    } catch (error) {
        console.error('❌ Error sending reminder notification:', error);
        return false;
    }
};

/**
 * Kirim notifikasi pembatalan enrollment
 */
exports.sendCancellationNotification = async (userId, courseName) => {
    try {
        const message = `Anda telah membatalkan pendaftaran kursus "${courseName}". Tempat kursus Anda sekarang tersedia untuk pengguna lain.`;
        
        return await exports.sendNotification(
            userId,
            'Pembatalan Kursus',
            message,
            'course_cancelled'
        );
    } catch (error) {
        console.error('❌ Error sending cancellation notification:', error);
        return false;
    }
};

/**
 * Kirim notifikasi ketika user mendapat badge
 */
exports.sendBadgeEarnedNotification = async (userId, badgeTitle, courseName) => {
    try {
        const message = `Selamat! Anda mendapatkan badge "${badgeTitle}" dari kursus "${courseName}". Pencapaian luar biasa! 🎉`;
        
        return await exports.sendNotification(
            userId,
            '🏆 Pencapaian Baru!',
            message,
            'badge_earned'
        );
    } catch (error) {
        console.error('❌ Error sending badge notification:', error);
        return false;
    }
};

/**
 * Kirim notifikasi course completion
 */
exports.sendCourseCompletionNotification = async (userId, courseName, courseId) => {
    try {
        const message = `Selamat! Anda telah menyelesaikan kursus "${courseName}". Upload sertifikat dan scan QR code untuk mendapatkan badge!`;
        
        return await exports.sendNotification(
            userId,
            '✅ Kursus Selesai!',
            message,
            'course_completed',
            {
                courseId: String(courseId),
                action: 'scan_badge'
            }
        );
    } catch (error) {
        console.error('❌ Error sending completion notification:', error);
        return false;
    }
};

/**
 * Kirim broadcast notifikasi untuk kursus baru
 * (untuk semua users atau filtered users)
 */
exports.broadcastNewCourseNotification = async (courseName, courseId, targetUsers = null) => {
    try {
        let query = 'SELECT fcm_token FROM users WHERE fcm_token IS NOT NULL AND fcm_token != ""';
        let params = [];

        // Jika ada target users tertentu
        if (targetUsers && targetUsers.length > 0) {
            const placeholders = targetUsers.map(() => '?').join(',');
            query += ` AND id IN (${placeholders})`;
            params = targetUsers;
        }

        const [users] = await db.query(query, params);

        if (users.length === 0) {
            console.log('No users to notify');
            return true;
        }

        const message = `Kursus baru: "${courseName}" sekarang tersedia! Daftar sekarang dan tingkatkan skill Anda.`;
        const tokens = users.map(u => u.fcm_token);
        
        // Kirim ke multiple tokens
        await exports.broadcastToAllUsers(
            'Kursus Baru Tersedia 📚',
            message,
            tokens
        );

        console.log(`📚 New course broadcast notification sent to ${users.length} users`);
        return true;
    } catch (error) {
        console.error('❌ Error sending broadcast notification:', error);
        return false;
    }
};

/**
 * Kirim notifikasi ketika quota kursus tinggal sedikit
 */
exports.sendLowQuotaNotification = async (userId, courseName, remainingQuota) => {
    try {
        const message = `Perhatian! Kuota untuk kursus "${courseName}" tinggal ${remainingQuota} tempat. Segera daftar sebelum penuh!`;
        
        return await exports.sendNotification(
            userId,
            '⚠️ Kuota Terbatas',
            message,
            'low_quota'
        );
    } catch (error) {
        console.error('❌ Error sending low quota notification:', error);
        return false;
    }
};

/**
 * Cek dan kirim reminder notifications untuk semua kursus yang akan dimulai dalam 1 jam
 * CALL THIS FUNCTION EVERY HOUR (bisa di-run dengan Node-Cron atau Background Job)
 */
exports.checkAndSendUpcomingCourseReminders = async () => {
    try {
        const now = new Date();
        const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

        // Ambil semua courses yang akan dimulai dalam 1 jam ke depan
        const [upcomingCourses] = await db.query(
            `SELECT c.id, c.title, c.date_start 
             FROM courses c
             WHERE c.date_start BETWEEN ? AND ?`,
            [now, oneHourLater]
        );

        if (upcomingCourses.length === 0) {
            console.log('No upcoming courses found');
            return;
        }

        // Untuk setiap course, cari users yang sudah terdaftar
        for (const course of upcomingCourses) {
            const [enrolledUsers] = await db.query(
                `SELECT u.id, u.fcm_token 
                 FROM enrollments e
                 JOIN users u ON e.user_id = u.id
                 WHERE e.course_id = ? AND e.status = 'Active'`,
                [course.id]
            );

            // Kirim notifikasi ke semua users
            for (const user of enrolledUsers) {
                if (user.fcm_token) {
                    await exports.sendCourseReminderNotification(
                        user.id,
                        course.title,
                        course.date_start
                    );
                }
            }
        }

        console.log(`✅ Checked and sent ${upcomingCourses.length} course reminders`);
    } catch (error) {
        console.error('❌ Error checking upcoming course reminders:', error);
    }
};

/**
 * Helper untuk schedule reminder menggunakan setTimeout
 * (Untuk prod lebih baik menggunakan node-cron atau background job service)
 */
exports.scheduleReminderNotification = (userId, courseName, reminderTime) => {
    const now = new Date();
    const delayMs = reminderTime.getTime() - now.getTime();

    if (delayMs > 0) {
        setTimeout(async () => {
            await exports.sendCourseReminderNotification(userId, courseName, reminderTime);
        }, delayMs);

        console.log(`⏰ Reminder scheduled for user ${userId} in ${Math.round(delayMs / 1000 / 60)} minutes`);
    } else {
        console.warn(`⚠️ Reminder time has already passed for user ${userId}`);
    }
};