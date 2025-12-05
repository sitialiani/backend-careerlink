// Lokasi: controllers/jobController.js
const db = require('../config/database');

// --- 1. AMBIL SEMUA LOWONGAN (Bisa Search) ---
exports.getAllJobs = async (req, res) => {
    try {
        const { search } = req.query; // Ambil parameter ?search=... dari URL
        
        let query = 'SELECT * FROM jobs WHERE is_active = 1';
        let params = [];

        // Kalau ada search, tambahkan filter SQL
        if (search) {
            query += ' AND (title LIKE ? OR company_name LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        query += ' ORDER BY created_at DESC'; // Urutkan dari yang terbaru

        const [jobs] = await db.query(query, params);

        res.status(200).json(jobs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error mengambil data lowongan' });
    }
};

// --- 2. AMBIL DETAIL SATU LOWONGAN ---
exports.getJobDetail = async (req, res) => {
    try {
        const { id } = req.params; // Ambil ID dari URL (cth: /jobs/1)

        const [jobs] = await db.query('SELECT * FROM jobs WHERE id = ?', [id]);

        if (jobs.length === 0) {
            return res.status(404).json({ message: 'Lowongan tidak ditemukan' });
        }

        res.status(200).json(jobs[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error mengambil detail lowongan' });
    }
};

// --- 3. TAMBAH LOWONGAN BARU (Buat Test Data / Admin) ---
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

        res.status(201).json({ 
            message: 'Lowongan berhasil dibuat!',
            jobId: result.insertId 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal membuat lowongan' });
    }
};