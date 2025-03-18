const mongoose = require('mongoose');
const Events = require("../model/calendarSchema.model");
const cron = require('node-cron');
const { storeNotification } = require('./notification.controller');

const remindEvent = async () => {
  const io = require('../index');
  const now = new Date();
  const nowIST = new Date(now.getTime() + (5 * 60 + 30) * 60000);
  const todayIST = nowIST.toISOString().split('T')[0]; 
  console.log('Cron job running at (IST): ', nowIST.toISOString());

  try {
      const events = await Events.find({
          date: { $gte: nowIST.toISOString().split('T')[0] }, 
      });

      if (!events.length) {
          console.log('No events to remind');
          return;
      }

      for (const event of events) {
          const followUpDate = new Date(event.date);
          if (isNaN(followUpDate.getTime())) {
              console.error(`Invalid follow-up date for event: ${event.event}`);
              continue; 
          }

          if (
              nowIST.toISOString().split('T')[0] ===
              followUpDate.toISOString().split('T')[0]
          ) {
              console.log(`Reminder: ${event.event} is scheduled for today!`);

              io.emit('calenderreminder', {
                  id: event._id,
                  event: event.event,
                  followUpDate: followUpDate.toISOString().split('T')[0], 
              });
              console.log('Reminder emitted for:', event.event);

              io.emit('notification', {
                  _id: "event._id",
                  title: `Calendar Reminder: ${event.event}`,
                  createdAt: new Date().toISOString(),
                  message: `Your ${event.event} is scheduled for today (${followUpDate.toISOString().split('T')[0]}).`,
                  type: 'calendar',
              });

              const notificationData = {
                  title: `Calendar Reminder: ${event.event}`,
                  message: `Your ${event.event} is scheduled for today (${followUpDate.toISOString().split('T')[0]}).`,
                  type: 'calendar',
              };

              await storeNotification(notificationData);
          } else {
              console.log('No reminder needed for:', event.event);
          }
      }
  } catch (error) {
      console.error('Error executing remindEvent API:', error);
  }
};

cron.schedule('0 0 * * *', remindEvent);

const getAllData = async (req, res) => {
  try {
    const data = await Events.find({});
    if (!data || data.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No events found.",
        data: [],
      });
    }

    res.status(200).json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error("Error fetching Data:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message,
    });
  }
};

const createData = async (req, res) => {
  const { date, event, calendarId } = req.body;

  try {
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format.",
      });
    }

    const newEvent = new Events({
      date: parsedDate,
      event,
      calendarId,
    });

    const savedEvent = await newEvent.save();

    res.status(201).json({
      success: true,
      message: "Event created successfully.",
      data: savedEvent,
    });
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message,
    });
  }
};

const updateData = async (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;

  try {
    const event = await Events.findById(id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    Object.keys(updatedData).forEach((key) => {
      event[key] = updatedData[key];
    });

    await event.save();

    res.status(200).json({
      success: true,
      message: "Event updated successfully!",
      data: event,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update event" });
  }
};

const deleteData = async (req, res) => {
  const { id } = req.body;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID provided.",
      });
    }

    const deletedEvent = await Events.findByIdAndDelete(id);

    if (!deletedEvent) {
      return res.status(404).json({
        success: false,
        message: "Event not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Event deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message,
    });
  }
};

const getDataById = async (req, res) => {
  const { id } = req.params;

  try {
    const event = await Events.findById(id);
    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }

    res.status(200).json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error("Error fetching event:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getAllData,
  createData,
  updateData,
  deleteData,
  getDataById,
};
