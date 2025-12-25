// Lokasi: controllers/authController.js
const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    try {
        const { full_name, name, email, password, role } = req.body;
        
        // [MERGE] Support untuk 'full_name' (Punyamu) DAN 'name' (Punya Temanmu)
        const finalName = full_name || name; 

        if (!finalName || !email || !password) {
            console.log("Validasi Gagal: Data tidak lengkap", req.body);
            return res.status(400).json({ message: 'Semua kolom harus diisi!' });
        }

        const [existingUser] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(400).json({ message: 'Email sudah terdaftar!' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const userRole = role || 'student';

        await db.query(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [finalName, email, hashedPassword, userRole]
        );

        console.log("Register Berhasil:", email);
        res.status(201).json({ message: 'Registrasi berhasil! Silakan login.' });

    } catch (error) {
        console.error("Error Register:", error);
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email dan password harus diisi!' });
        }

        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ message: 'Email atau password salah!' });
        }

        const user = users[0];

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Email atau password salah!' });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role }, 
            process.env.JWT_SECRET, 
            { expiresIn: '7d' }
        );

        // [MERGE] Mengirim 'name' DAN 'full_name' agar kedua Android support
        res.status(200).json({
            message: 'Login berhasil!',
            token: token,
            user: {
                id: user.id,
                name: user.name,          // Untuk Android Temanmu
                full_name: user.name,     // Untuk Android Kamu
                email: user.email,
                role: user.role,
                photo_profile_url: user.photo_profile_url
            }
        });

    } catch (error) {
        console.error("Error Login:", error);
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
};

exports.updateFcmToken = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            console.log("[ERROR] req.user tidak ada!");
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const userId = req.user.id;
        const { fcm_token } = req.body;

        console.log(`[DEBUG FCM] Update User ID: ${userId}`);

        if (!fcm_token) {
            return res.status(400).json({ message: 'Token FCM kosong' });
        }

        const [result] = await db.query('UPDATE users SET fcm_token = ? WHERE id = ?', [fcm_token, userId]);

        if (result.affectedRows === 0) {
            console.log("Token GAGAL disimpan. User ID tidak ditemukan.");
        } else {
            console.log("Token BERHASIL disimpan.");
        }

        res.status(200).json({ message: 'Token updated' });

    } catch (error) {
        console.error("Gagal update token:", error);
        res.status(500).json({ message: 'Gagal update token' });
    }
};