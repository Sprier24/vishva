const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });  
const Scheduled = require("../model/scheduledSchema.model");

const createScheduledEvent = async (req, res) => {
    try {
        const eventData = req.body;

        if (req.files && req.files.length > 0) {
            eventData.attachments = req.files.map(file => file.buffer);  
        }

        const validRecurrences = ['one-time', 'Daily', 'Weekly', 'Monthly', 'Yearly'];
        if (eventData.recurrence && !validRecurrences.includes(eventData.recurrence)) {
            return res.status(400).json({
                success: false,
                message: `Invalid recurrence value. Allowed values are: ${validRecurrences.join(', ')}`,
            });
        }

        const newEvent = await Scheduled.create(eventData);

        res.status(201).json({
            success: true,
            message: "Scheduled event created successfully",
            data: newEvent,
        });
    } catch (error) {
        console.error("Error creating scheduled event:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error: " + error.message,
        });
    }
};

const getAllScheduledEvents = async (req, res) => {
    try {
        const events = await Scheduled.find({});
        res.status(200).json({
            success: true,
            data: events
        });
    } catch (error) {
        console.error("Error fetching scheduled events:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error: " + error.message
        });
    }
};

const updateScheduledEvent = async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    try {
        const updatedEvent = await Scheduled.findByIdAndUpdate(id, updates, {
            new: true,
            runValidators: true, 
        });

        if (!updatedEvent) {
            return res.status(404).json({
                success: false,
                message: "Scheduled event not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Scheduled event updated successfully",
            data: updatedEvent
        });
    } catch (error) {
        console.error("Error updating scheduled event:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error: " + error.message
        });
    }
};

const deleteScheduledEvent = async (req, res) => {
    const { id } = req.params;

    try {
        const deletedEvent = await Scheduled.findByIdAndDelete(id);

        if (!deletedEvent) {
            return res.status(404).json({
                success: false,
                message: "Scheduled event not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Scheduled event deleted successfully",
            data: deletedEvent
        });
    } catch (error) {
        console.error("Error deleting scheduled event:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error: " + error.message
        });
    }
};

module.exports = {
    createScheduledEvent,
    getAllScheduledEvents,
    updateScheduledEvent,
    deleteScheduledEvent,
};
