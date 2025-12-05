// Lokasi: config/database.js
const mysql = require('mysql2');
const dotenv = require('dotenv');

// Load settingan dari file .env
dotenv.config();

// Buat kolam koneksi (Connection Pool)
// Kita pakai Pool biar aplikasi nggak berat kalau banyak user akses barengan
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Cek koneksi pas awal jalan (Optional, biar tau kalo error)
pool.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Gagal connect ke Database:', err.code);
        console.error('⚠️ Pastikan XAMPP sudah nyala dan database "careerlink_db" sudah dibuat!');
    } else {
        console.log('✅ Berhasil connect ke Database MySQL!');
        connection.release();
    }
});

// Kita export versi 'promise' biar nanti bisa pake async/await (lebih modern)
module.exports = pool.promise();