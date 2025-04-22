const express = require('express');
const multer = require('multer');
const { scheduledEventController } = require('../../../controller');
const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });
router.post("/createScheduledEvent", upload.array('attachments', 5), scheduledEventController.createScheduledEvent); 
router.get("/getAllScheduledEvents", scheduledEventController.getAllScheduledEvents);
router.put("/updateScheduledEvent/:id", scheduledEventController.updateScheduledEvent);
router.delete("/deleteScheduledEvent/:id", scheduledEventController.deleteScheduledEvent);

module.exports = router;
