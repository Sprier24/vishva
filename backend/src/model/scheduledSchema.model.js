const mongoose = require("mongoose");
const scheduledEventSchema = new mongoose.Schema({
  subject: {
    type: String,
  },
  assignedUser: {
    type: String,
  },
  customer: {
    type: String,
  },
  location: {
    type: String,
  },
  status: {
    type: String,
    enum: ["Scheduled", "Completed", "Cancelled", "Postpone"],
  },
  eventType: {
    type: String,
    enum: [
      "call",
      "Call",
      "Meeting",
      "meeting",
      "Demo",
      "demo",
      "Follow-Up",
      "follow-up",
    ],
  },
  priority: {
    type: String,
    enum: ["Low", "low", "Medium", "medium", "High", "high"],
  },
  date: {
    type: Date,
  },
  recurrence: {
    type: String,
    enum: ["one-time", "Daily", "Weekly", "Monthly", "Yearly"],
  },
  description: {
    type: String,
  },

}, { timestamps: true });

const Scheduled = mongoose.model("scheduledevents", scheduledEventSchema);

module.exports = Scheduled;
