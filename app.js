
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
const courseRoutes = require('./routes/courseRoutes'); 
const badgeRoutes = require('./routes/badgeRoutes');
const careerFairRoutes = require('./routes/careerFairRoutes');
const mentoringRoutes = require('./routes/mentoringRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/courses', courseRoutes); 
app.use('/api/badges', badgeRoutes);   
app.use('/api/career-fair', careerFairRoutes);
app.use('/api/mentoring', mentoringRoutes);

app.listen(port, () => {
    console.log(`\n🚀 Server berjalan di: http://localhost:${port}`);
    console.log(`📂 Menunggu koneksi database...`);
});
