const mongoose = require("mongoose");

const calenderSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    event: {
      type: String,
      required: true,
    },
    calendarId: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

const Events = mongoose.model("Events", calenderSchema);

module.exports = Events;