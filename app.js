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

// Middleware
app.use(cors()); // Biar bisa diakses dari HP/Emulator Android
app.use(bodyParser.json()); // Biar bisa baca JSON dari Android
app.use(bodyParser.urlencoded({ extended: true }));

// Folder statis untuk menyimpan file upload (CV/Gambar)
// Nanti file bisa diakses via: http://localhost:3000/uploads/namafile.jpg
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- TEST ROUTE (Buat ngecek server nyala atau nggak) ---
app.get('/', (req, res) => {
    res.send('Server CareerLink Berjalan dengan Aman!');
});

// --- IMPORT ROUTES (Nanti kita isi ini bertahap) ---
const authRoutes = require('./routes/authRoutes');
const jobRoutes = require('./routes/jobRoutes');

// ---MENTORING ROUTES ---
const mentoringRoutes = require("./routes/mentoringRoutes");
app.use("/api/mentoring", mentoringRoutes);


// Gunakan rutenya
// Artinya semua URL di authRoutes bakal diawali /api/auth
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);

// Jalankan Server
app.listen(port, () => {
    console.log(`\n🚀 Server berjalan di: http://localhost:${port}`);
    console.log(`📂 Menunggu koneksi database...`);
});