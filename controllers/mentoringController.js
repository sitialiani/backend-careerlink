const db = require("../config/database");

// 1. List jadwal mentoring
exports.getSchedules = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT ms.id, ms.datetime, ms.location, ms.capacity,
             u.name AS mentor_name, u.role AS mentor_role
      FROM mentoring_schedules ms
      JOIN users u ON ms.mentor_id = u.id
      ORDER BY ms.datetime ASC
    `);
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ message: "Gagal ambil jadwal mentoring" });
  }
};

// 2. Detail mentoring
exports.getScheduleDetail = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT ms.*, u.name AS mentor_name, u.role AS mentor_role
      FROM mentoring_schedules ms
      JOIN users u ON ms.mentor_id = u.id
      WHERE ms.id = ?
    `, [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Mentoring tidak ditemukan" });
    }

    res.json({ data: rows[0] });
  } catch (err) {
    res.status(500).json({ message: "Gagal ambil detail mentoring" });
  }
};

// 3. Booking mentoring
exports.bookMentoring = async (req, res) => {
  try {
    const userId = req.user.id;
    const { scheduleId } = req.body;

    const [result] = await db.query(`
      INSERT INTO mentoring_bookings (user_id, schedule_id, status)
      VALUES (?, ?, 'Confirmed')
    `, [userId, scheduleId]);

    // Notifikasi
    await db.query(`
      INSERT INTO notifications (user_id, title, message, type, reference_id)
      VALUES (?, 'Mentoring Reminder',
              'Anda berhasil mendaftar mentoring',
              'mentoring', ?)
    `, [userId, result.insertId]);

    res.status(201).json({ message: "Booking mentoring berhasil" });
  } catch (err) {
    res.status(500).json({ message: "Gagal booking mentoring" });
  }
};

// 4. Ambil notifikasi mentoring
exports.getNotifications = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT * FROM notifications
      WHERE user_id = ? AND type = 'mentoring'
      ORDER BY created_at DESC
    `, [req.user.id]);

    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ message: "Gagal ambil notifikasi" });
  }
};

// 5. Simpan catatan mentoring
exports.saveNote = async (req, res) => {
  try {
    const { bookingId, content } = req.body;

    await db.query(`
      INSERT INTO mentoring_notes (booking_id, content)
      VALUES (?, ?)
    `, [bookingId, content]);

    res.json({ message: "Catatan berhasil disimpan" });
  } catch (err) {
    res.status(500).json({ message: "Gagal simpan catatan" });
  }
};

// 6. Ambil catatan mentoring
exports.getNote = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT * FROM mentoring_notes WHERE booking_id = ?
    `, [req.params.bookingId]);

    res.json({ data: rows[0] || null });
  } catch (err) {
    res.status(500).json({ message: "Gagal ambil catatan" });
  }
};
