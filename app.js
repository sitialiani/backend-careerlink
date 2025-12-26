
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');



dotenv.config();


const app = express();
const port = process.env.PORT || 3000;


app.use(cors()); 
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true }));


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));



app.use((req, res, next) => {
    console.log(`\n📥 [CCTV] Request Masuk: ${req.method} ${req.url}`);
    console.log('📦 Headers:', JSON.stringify(req.headers['content-type'])); 
    console.log('📦 Body:', req.body); 
    next(); 
});


app.get('/', (req, res) => {
    res.send('Server CareerLink Berjalan dengan Aman!');
});


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


app.listen(port, () => {
    console.log(`\n🚀 Server berjalan di: http:
    console.log(`📂 Menunggu koneksi database...`);
});