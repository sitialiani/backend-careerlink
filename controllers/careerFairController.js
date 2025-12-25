const db = require("../config/database");

/* =========================
   EVENTS
========================= */

// Get all events
exports.getAllEvents = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM events");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get event detail
exports.getEventById = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM events WHERE id = ?",
      [req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Follow event
exports.followEvent = async (req, res) => {
  const { user_id, event_id } = req.body;
  try {
    await db.query(
      "INSERT IGNORE INTO user_saved_events (user_id, event_id) VALUES (?, ?)",
      [user_id, event_id]
    );
    res.json({ message: "Event berhasil diikuti" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Saved events
exports.getSavedEvents = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT e.*
       FROM user_saved_events s
       JOIN events e ON s.event_id = e.id
       WHERE s.user_id = ?
       ORDER BY s.follow_date DESC`,
      [req.params.userId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =========================
   CHECK-IN
========================= */
exports.checkinEvent = async (req, res) => {
  const { user_id, event_id } = req.body;
  try {
    await db.query(
      "INSERT INTO event_checkins (user_id, event_id) VALUES (?, ?)",
      [user_id, event_id]
    );

    await db.query(
      "INSERT IGNORE INTO user_saved_events (user_id, event_id) VALUES (?, ?)",
      [user_id, event_id]
    );

    res.json({ message: "Check-in berhasil" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =========================
   BOOTH
========================= */

// Get all booths
exports.getBooths = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM booths");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Booth detail
exports.getBoothById = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM booths WHERE id = ?",
      [req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =========================
   NETWORKING
========================= */
exports.getNetworkingContacts = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM networking_contacts");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =========================
   NOTIFICATIONS
========================= */
exports.getNotifications = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM notifications ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
