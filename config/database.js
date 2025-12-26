
const mysql = require('mysql2');
const dotenv = require('dotenv');


dotenv.config();



const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});


pool.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Gagal connect ke Database:', err.code);
        console.error('⚠️ Pastikan XAMPP sudah nyala dan database "careerlink_db" sudah dibuat!');
    } else {
        console.log('✅ Berhasil connect ke Database MySQL!');
        connection.release();
    }
});


module.exports = pool.promise();