const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const ctrl = require("../controllers/mentoringController");

router.get("/schedules", auth, ctrl.getSchedules);
router.get("/schedules/:id", auth, ctrl.getScheduleDetail);
router.post("/book", auth, ctrl.bookMentoring);

router.get("/notifications", auth, ctrl.getNotifications);

router.post("/notes", auth, ctrl.saveNote);
router.get("/notes/:bookingId", auth, ctrl.getNote);

module.exports = router;
