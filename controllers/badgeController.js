const db = require('../config/database');


exports.getMyBadges = async (req, res) => {
    try {
        const userId = req.user.id;
        const [rows] = await db.query(
            'SELECT * FROM user_badges WHERE user_id = ? ORDER BY obtained_at DESC',
            [userId]
        );
        
        
        res.status(200).json({
            success: true,
            data: rows
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


exports.scanBadge = async (req, res) => {
    try {
        const userId = req.user.id;
        const { course_id } = req.body;

        
        
        
        
        const [existing] = await db.query(
            'SELECT * FROM user_badges WHERE user_id = ? AND course_id = ?',
            [userId, course_id]
        );

        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Anda sudah punya badge ini!' });
        }

        
        const [course] = await db.query('SELECT title, image_url, provider_name FROM courses WHERE id = ?', [course_id]);
        if (course.length === 0) return res.status(404).json({ success: false, message: 'Kursus tidak valid' });

        
        await db.query(
            'INSERT INTO user_badges (user_id, course_id, title, image_url, issuer, obtained_at) VALUES (?, ?, ?, ?, ?, NOW())',
            [userId, course_id, `${course[0].title} Expert`, course[0].image_url, course[0].provider_name]
        );

        res.status(200).json({ success: true, message: 'Badge berhasil diklaim!' });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.uploadBadge = async (req, res) => {
    try {
        const userId = req.user.id;

        
        if (!req.file) {
            return res.status(400).json({ success: false, message: "File tidak terdeteksi oleh server" });
        }

        
        const imageUrl = `/uploads/${req.file.filename}`; 

        
        await db.query(
            `INSERT INTO user_badges (user_id, title, image_url, issuer, obtained_at) 
             VALUES (?, ?, ?, ?, NOW())`,
            [userId, 'Sertifikat Koleksi', imageUrl, 'User Upload']
        );

        res.status(200).json({ 
            success: true, 
            message: "Badge berhasil disimpan ke database!" 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};