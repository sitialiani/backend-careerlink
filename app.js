// Lokasi: app.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');


// Load environment variables
dotenv.config();

// Inisialisasi App
const app = express();
const port = process.env.PORT || 3000;

// --- MIDDLEWARE UTAMA ---
app.use(cors()); // Biar bisa diakses dari HP/Emulator Android
app.use(bodyParser.json()); // Biar bisa baca JSON dari Android
app.use(bodyParser.urlencoded({ extended: true }));

// Folder statis untuk menyimpan file upload (CV/Gambar)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- 🔴 CCTV (LOGGER) - DARI KODEMU 🔴 ---
// Kita PERTAHANKAN ini agar kamu tetap bisa memantau request yang masuk.
app.use((req, res, next) => {
    console.log(`\n📥 [CCTV] Request Masuk: ${req.method} ${req.url}`);
    console.log('📦 Headers:', JSON.stringify(req.headers['content-type'])); // Cek tipe data
    console.log('📦 Body:', req.body); // Cek isi data yang dikirim Android
    next(); // Lanjut ke route berikutnya
});

// --- TEST ROUTE ---
app.get('/', (req, res) => {
    res.send('Server CareerLink Berjalan dengan Aman!');
});

// --- IMPORT ROUTES ---
const authRoutes = require('./routes/authRoutes');
const jobRoutes = require('./routes/jobRoutes');
const mentoringRoutes = require("./routes/mentoringRoutes"); 
const courseRoutes = require('./routes/courseRoutes'); 
const badgeRoutes = require('./routes/badgeRoutes');


app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use("/api/mentoring", mentoringRoutes); 
app.use('/api/courses', courseRoutes); 
app.use('/api/badges', badgeRoutes);   

// Jalankan Server
app.listen(port, () => {
    console.log(`\n🚀 Server berjalan di: http://localhost:${port}`);
    console.log(`📂 Menunggu koneksi database...`);
});