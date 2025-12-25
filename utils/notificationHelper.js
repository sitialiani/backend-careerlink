const admin = require('../config/firebase');
const db = require('../config/database');

// Fungsi 1: Kirim ke SATU user (Personal)
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

// Fungsi 2: Kirim ke SEMUA user (Broadcast)
exports.broadcastToAllUsers = async (title, message, jobId) => {
    try {
        const [rows] = await db.query('SELECT fcm_token FROM users WHERE fcm_token IS NOT NULL AND fcm_token != ""');

        if (rows.length === 0) {
            console.log("Tidak ada user yang memiliki token FCM.");
            return;
        }

        const tokens = rows.map(row => row.fcm_token);

        // Siapkan Payload
        const messagePayload = {
            notification: {
                title: title,
                body: message
            },
            // 🔥 INI BAGIAN PENTINGNYA 🔥
            // Data ini tidak tampil di layar, tapi dibaca oleh kodingan Android saat diklik
            data: {
                type: "job_detail",         // Penanda tipe notifikasi
                jobId: String(jobId)        // Firebase mewajibkan data harus berupa STRING
            },
            tokens: tokens
        };

        const response = await admin.messaging().sendEachForMulticast(messagePayload);
        
        console.log(`[BROADCAST] Sukses kirim notif Job ID ${jobId} ke ${response.successCount} user.`);

    } catch (error) {
        console.error("Gagal broadcast notifikasi:", error);
    }
};