const db = require('../config/database'); 
const jwt = require('jsonwebtoken'); 
const notifHelper = require('../utils/notificationHelper');


exports.getAllJobs = async (req, res) => {
    try {
        const { type, search } = req.query;
        let userId = null;

        
        
        
        const authHeader = req.headers['authorization'];
        if (authHeader) {
            const token = authHeader.split(' ')[1];
            try {
                
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'YOUR_SECRET_KEY'); 
                userId = decoded.id;
            } catch (err) {
                
            }
        }
        
        let query = 'SELECT * FROM jobs WHERE is_active = 1';
        let params = [];

        
        if (userId) {
            query += ' AND id NOT IN (SELECT job_id FROM applications WHERE user_id = ?)';
            params.push(userId);
        }

        
        if (type) {
            query += ' AND job_type = ?';
            params.push(type);
        }

        
        if (search) {
            query += ' AND (title LIKE ? OR company_name LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        query += ' ORDER BY created_at DESC'; 

        const [jobs] = await db.query(query, params);

        res.status(200).json(jobs);
    } catch (error) {
        console.error("❌ Error getAllJobs:", error);
        res.status(500).json({ message: 'Error mengambil data lowongan' });
    }
};


exports.getJobDetail = async (req, res) => {
    try {
        const { id } = req.params; 

        const [jobs] = await db.query('SELECT * FROM jobs WHERE id = ?', [id]);

        if (jobs.length === 0) {
            return res.status(404).json({ message: 'Lowongan tidak ditemukan' });
        }

        res.status(200).json(jobs[0]);
    } catch (error) {
        console.error("❌ Error getJobDetail:", error);
        res.status(500).json({ message: 'Error mengambil detail lowongan' });
    }
};


exports.createJob = async (req, res) => {
    try {
        const { 
            title, company_name, logo_url, location, 
            job_type, duration, salary_range, description, requirements 
        } = req.body;

        
        const [result] = await db.query(
            `INSERT INTO jobs (title, company_name, logo_url, location, job_type, duration, salary_range, description, requirements) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [title, company_name, logo_url, location, job_type, duration, salary_range, description, requirements]
        );

        
        if (result.affectedRows > 0) {
            const notifTitle = "Halo Pencari Kerja CareerLink!";
            const notifBody = `Lowongan ${title} baru saja ditambahkan, ayo lamar sekarang!`;

            const newJobId = result.insertId;
            notifHelper.broadcastToAllUsers(notifTitle, notifBody, result.insertId);
            
            console.log(`[NOTIF] Broadcast dikirim untuk lowongan: ${title}`);
        }
        

        res.status(201).json({ 
            message: 'Lowongan berhasil dibuat!',
            jobId: result.insertId 
        });
    } catch (error) {
        console.error("❌ Error createJob:", error);
        res.status(500).json({ message: 'Gagal membuat lowongan' });
    }
};


exports.applyJob = async (req, res) => {
    try {
        const { id } = req.params; 
        const userId = req.user.id; 

        console.log(`\n📥 [APPLY] User ${userId} melamar Job ${id}`);
        
        
        if (!req.files || !req.files['cv']) {
            return res.status(400).json({ message: 'Wajib upload CV (PDF)!' });
        }
        const cvUrl = req.files['cv'][0].path.replace(/\\/g, "/"); 

        if (!req.files['recommendation_letter']) {
            return res.status(400).json({ message: 'Wajib upload Surat Rekomendasi (PDF)!' });
        }
        const recommendationUrl = req.files['recommendation_letter'][0].path.replace(/\\/g, "/");

        let portfolioUrl = null;
        if (req.files['portfolio']) {
            portfolioUrl = req.files['portfolio'][0].path.replace(/\\/g, "/");
        }

        
        let { 
            full_name, date_of_birth, gender, education, major, phone_number, about_me 
        } = req.body;

        if (!full_name || !phone_number) {
             return res.status(400).json({ message: 'Nama dan Nomor HP wajib diisi!' });
        }

        
        if (date_of_birth && date_of_birth.includes('/')) {
            const parts = date_of_birth.split('/'); 
            if (parts.length === 3) {
                date_of_birth = `${parts[2]}-${parts[1]}-${parts[0]}`; 
            }
        }

        
        const [existing] = await db.query(
            'SELECT * FROM applications WHERE user_id = ? AND job_id = ?',
            [userId, id]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: 'Kamu sudah melamar di lowongan ini sebelumnya!' });
        }

        
        await db.query(
            `INSERT INTO applications 
            (user_id, job_id, cv_url, portfolio_url, recommendation_letter_url, status,
             full_name, date_of_birth, gender, education, major, phone_number, about_me, applied_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [
                userId, id, cvUrl, 
                portfolioUrl, 
                recommendationUrl, 
                'Pending', 
                full_name, date_of_birth, gender, education, major, phone_number, about_me
            ]
        );

        console.log("✅ Sukses menyimpan lamaran!");
        res.status(201).json({ message: 'Lamaran berhasil dikirim! Semoga sukses.' });

    } catch (error) {
        console.error("❌ Error applyJob:", error);
        res.status(500).json({ message: 'Gagal mengirim lamaran: ' + error.message });
    }
};


exports.getRiwayatLamaran = async (req, res) => {
    try {
        const userId = req.user.id; 

        const query = `
            SELECT 
                a.id as application_id, a.status, a.applied_at,
                j.id as job_id, j.title, j.company_name, j.logo_url, j.location
            FROM applications a
            JOIN jobs j ON a.job_id = j.id
            WHERE a.user_id = ?
            ORDER BY a.applied_at DESC
        `;

        const [rows] = await db.query(query, [userId]);
        res.status(200).json(rows);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal mengambil riwayat' });
    }
};


exports.getDetailLamaran = async (req, res) => {
    try {
        const userId = req.user.id;
        const { applicationId } = req.params;

        const query = `
            SELECT 
                a.*, 
                j.title as job_title, j.company_name, j.logo_url, j.location
            FROM applications a
            JOIN jobs j ON a.job_id = j.id
            WHERE a.id = ? AND a.user_id = ?
        `;

        const [rows] = await db.query(query, [applicationId, userId]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Lamaran tidak ditemukan atau bukan milikmu.' });
        }

        res.status(200).json(rows[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal mengambil detail lamaran' });
    }
};