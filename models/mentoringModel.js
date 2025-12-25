// models/mentoringModel.js
const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    address: { type: String, default: "" },
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
  },
  { _id: false }
);

const sessionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true }, // contoh: "UI/UX Portfolio Review"
    mentorName: { type: String, required: true }, // contoh: "Jack"
    mentorJob: { type: String, default: "" }, // contoh: "Microsoft"
    description: { type: String, default: "" },
    platform: { type: String, default: "" }, // contoh: "Cafe Dari Sini"
    durationMinutes: { type: Number, default: 60 },
    timeZone: { type: String, default: "WIB" },
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
    location: { type: locationSchema, default: () => ({}) },

    // kuota dan status
    capacity: { type: Number, default: 1 },
    bookedCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const bookingSchema = new mongoose.Schema(
  {
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: "MentoringSession", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    fullName: { type: String, required: true },
    birthDate: { type: String, default: "" },
    gender: { type: String, default: "" },
    education: { type: String, default: "" },
    studyProgram: { type: String, default: "" },
    phone: { type: String, default: "" },
    expectation: { type: String, default: "" },

    status: { type: String, enum: ["BOOKED", "CANCELLED", "DONE"], default: "BOOKED" },
  },
  { timestamps: true }
);

const noteSchema = new mongoose.Schema(
  {
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: "MentoringSession", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, default: "" },
    attachments: [{ type: String }], // url/path file kalau kamu mau
  },
  { timestamps: true }
);

const notifSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["EVENT", "REMINDER"], default: "REMINDER" },
    title: { type: String, required: true },
    message: { type: String, default: "" },
    targetRoute: { type: String, default: "" }, // contoh: "/detail/{id}"
    isActive: { type: Boolean, default: true },
    fireAt: { type: Date, default: null }, // kapan reminder
  },
  { timestamps: true }
);

const MentoringSession = mongoose.model("MentoringSession", sessionSchema);
const MentoringBooking = mongoose.model("MentoringBooking", bookingSchema);
const MentoringNote = mongoose.model("MentoringNote", noteSchema);
const MentoringNotif = mongoose.model("MentoringNotif", notifSchema);

module.exports = { MentoringSession, MentoringBooking, MentoringNote, MentoringNotif };