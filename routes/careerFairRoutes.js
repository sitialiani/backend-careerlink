const express = require("express");
const router = express.Router();
const controller = require("../controllers/careerFairController");

// EVENTS
router.get("/events", controller.getAllEvents);
router.get("/events/:id", controller.getEventById);
router.post("/follow", controller.followEvent);
router.get("/saved/:userId", controller.getSavedEvents);

// CHECK-IN
router.post("/checkin", controller.checkinEvent);

// BOOTH
router.get("/booths", controller.getBooths);
router.get("/booths/:id", controller.getBoothById);

// NETWORKING
router.get("/networking", controller.getNetworkingContacts);

// NOTIFICATIONS
router.get("/notifications", controller.getNotifications);

module.exports = router;
