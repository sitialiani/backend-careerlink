// Lokasi: config/multerConfig.js
const multer = require('multer');
const path = require('path');

// Atur tempat penyimpanan file
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // File akan disimpan di folder 'uploads'
    },
    filename: (req, file, cb) => {
        // Namai file dengan: timestamp-namaasli.pdf (biar gak bentrok)
        cb(null, Date.now() + '-' + file.originalname);
    }
});

// Filter biar cuma bisa upload PDF
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Format file harus PDF!'), false);
    }
};

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Maksimal 5MB
    fileFilter: fileFilter
});

module.exports = upload;