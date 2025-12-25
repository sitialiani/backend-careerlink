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
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Folder statis untuk menyimpan file upload (CV/Gambar)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- CCTV (LOGGER) ---
app.use((req, res, next) => {
    console.log(`\n📥 [CCTV] Request Masuk: ${req.method} ${req.url}`);
    console.log('📦 Headers:', req.headers['content-type']);
    console.log('📦 Body:', req.body);
    next();
});

// --- TEST ROUTE ---
app.get('/', (req, res) => {
    res.send('Server CareerLink Berjalan dengan Aman!');
});

// --- IMPORT ROUTES ---
const authRoutes = require('./routes/authRoutes');
const jobRoutes = require('./routes/jobRoutes');
const careerFairRoutes = require('./routes/careerFairRoutes');
const mentoringRoutes = require('./routes/mentoringRoutes');

// --- GUNAKAN ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/career-fair', careerFairRoutes);
app.use('/api/mentoring', mentoringRoutes);

// Jalankan Server
app.listen(port, () => {
    console.log(`\n🚀 Server berjalan di: http://localhost:${port}`);
    console.log(`📂 Menunggu koneksi database...`);
});
