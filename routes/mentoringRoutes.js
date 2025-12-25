const router = require("express").Router();
const { authenticateToken } = require("../middleware/authMiddleware"); 
const ctrl = require("../controllers/mentoringController");

router.get("/schedules", authenticateToken, ctrl.getSchedules);
router.get("/schedules/:id", authenticateToken, ctrl.getScheduleDetail);
router.post("/book", authenticateToken, ctrl.bookMentoring);
router.get("/notifications", authenticateToken, ctrl.getNotifications);
router.post("/notes", authenticateToken, ctrl.saveNote);
router.get("/notes/:bookingId", authenticateToken, ctrl.getNote);

module.exports = router;
