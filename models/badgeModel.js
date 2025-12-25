// Lokasi: models/badgeModel.js
// Model untuk User Badges dan QR Code handling

const db = require('../config/database');

// ======================== BADGE MANAGEMENT ========================

/**
 * Ambil semua badge user
 * GET /api/badges/:userId
 */
exports.getUserBadges = async (userId) => {
    try {
        const [badges] = await db.query(
            `SELECT * FROM user_badges 
             WHERE user_id = ? 
             ORDER BY obtained_at DESC`,
            [userId]
        );
        return badges;
    } catch (error) {
        throw error;
    }
};

/**
 * Ambil badge dengan detil course (NO IMAGE)
 * GET /api/badges/:userId/detailed
 */
exports.getUserBadgesDetailed = async (userId) => {
    try {
        const [badges] = await db.query(
            `SELECT 
                ub.id,
                ub.user_id,
                ub.course_id,
                ub.title,
                ub.issuer,
                ub.qr_token,
                ub.obtained_at,
                ub.is_external,
                c.title as course_title
             FROM user_badges ub
             LEFT JOIN courses c ON ub.course_id = c.id
             WHERE ub.user_id = ?
             ORDER BY ub.obtained_at DESC`,
            [userId]
        );
        return badges;
    } catch (error) {
        throw error;
    }
};

/**
 * Ambil satu badge detail
 * GET /api/badges/:badgeId
 */
exports.getBadgeById = async (badgeId) => {
    try {
        const [badge] = await db.query(
            'SELECT * FROM user_badges WHERE id = ?',
            [badgeId]
        );
        return badge[0] || null;
    } catch (error) {
        throw error;
    }
};

// ======================== QR CODE BADGE ENROLLMENT ========================

/**
 * Scan QR Code untuk mendapatkan badge
 * POST /api/badges/scan-qr
 * Input: { qr_token: "xxx" }
 */
exports.scanQRCodeBadge = async (userId, qrToken) => {
    try {
        // 1. Cari badge dengan qr_token ini
        const [badge] = await db.query(
            `SELECT * FROM user_badges WHERE qr_token = ?`,
            [qrToken]
        );

        if (badge.length === 0) {
            throw new Error('QR Code tidak valid atau kadaluarsa');
        }

        const badgeData = badge[0];

        // 2. Cek apakah user sudah memiliki badge ini
        const [existingBadge] = await db.query(
            'SELECT * FROM user_badges WHERE id = ? AND user_id = ?',
            [badgeData.id, userId]
        );

        if (existingBadge.length > 0) {
            throw new Error('Anda sudah memiliki badge ini');
        }

        // 3. Validasi user sudah menyelesaikan kursus (jika badge dari course)
        if (badgeData.course_id) {
            const [enrollment] = await db.query(
                'SELECT * FROM enrollments WHERE user_id = ? AND course_id = ? AND status = "Completed"',
                [userId, badgeData.course_id]
            );

            if (enrollment.length === 0) {
                throw new Error('Anda belum menyelesaikan kursus ini');
            }
        }

        // 4. Update badge dengan user_id dan obtained_at
        await db.query(
            'UPDATE user_badges SET user_id = ?, obtained_at = NOW() WHERE id = ?',
            [userId, badgeData.id]
        );

        // 5. Return badge info
        return {
            badge_id: badgeData.id,
            title: badgeData.title,
            issuer: badgeData.issuer,
            course_id: badgeData.course_id,
            obtained_at: new Date()
        };
    } catch (error) {
        throw error;
    }
};

/**
 * Membuat badge baru untuk user (tanpa image_url)
 * POST /api/badges/create
 */
exports.createBadge = async (userId, badgeData) => {
    try {
        const { course_id, title, issuer, qr_token, is_external } = badgeData;
        const qrToken = qr_token || exports.generateQRToken();

        const [result] = await db.query(
            `INSERT INTO user_badges 
             (user_id, course_id, title, issuer, qr_token, obtained_at, is_external) 
             VALUES (?, ?, ?, ?, ?, NOW(), ?)`,
            [userId, course_id || null, title, issuer, qrToken, is_external || 0]
        );

        return {
            badge_id: result.insertId,
            user_id: userId,
            course_id: course_id || null,
            title: title,
            issuer: issuer,
            qr_token: qrToken,
            obtained_at: new Date(),
            is_external: is_external || 0
        };
    } catch (error) {
        throw error;
    }
};

/**
 * Generate QR Token untuk badge (unique & random)
 */
exports.generateQRToken = () => {
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex');
};

/**
 * Verify badge ownership
 */
exports.verifyBadgeOwnership = async (userId, badgeId) => {
    try {
        const [badge] = await db.query(
            'SELECT * FROM user_badges WHERE id = ? AND user_id = ?',
            [badgeId, userId]
        );

        return badge.length > 0;
    } catch (error) {
        throw error;
    }
};

/**
 * Dapatkan statistik badge user
 */
exports.getBadgeStats = async (userId) => {
    try {
        const [stats] = await db.query(
            `SELECT 
                COUNT(*) as total_badges,
                COUNT(DISTINCT course_id) as courses_completed
             FROM user_badges
             WHERE user_id = ?`,
            [userId]
        );

        return stats[0] || { total_badges: 0, courses_completed: 0 };
    } catch (error) {
        throw error;
    }
};
/**
 * Cari badge berdasarkan qr_token (course_id)
 */
exports.getBadgeByQRToken = async (qrToken) => {
    try {
        return await db.query(
            `SELECT * FROM user_badges WHERE qr_token = ?`,
            [qrToken]
        );
    } catch (error) {
        throw error;
    }
};

/**
 * Cek apakah user sudah punya badge tertentu
 */
exports.checkUserHasBadge = async (userId, badgeId) => {
    try {
        return await db.query(
            `SELECT * FROM user_badges WHERE id = ? AND user_id = ?`,
            [badgeId, userId]
        );
    } catch (error) {
        throw error;
    }
};

/**
 * Assign badge ke user
 */
exports.assignBadgeToUser = async (userId, badgeId) => {
    try {
        const [result] = await db.query(
            `UPDATE user_badges SET user_id = ?, obtained_at = NOW() WHERE id = ?`,
            [userId, badgeId]
        );
        return result.affectedRows;
    } catch (error) {
        throw error;
    }
};