const express = require('express');
const {notificationcontroller} = require('../../../controller');
const router = express.Router();

router.post('/storeNotification', notificationcontroller.storeNotification); 
router.get('/getAllNotifications', notificationcontroller.getAllNotifications); 
router.delete('/deleteNotification/:id', notificationcontroller.deleteNotification); 
router.delete('/deleteAllNotifications', notificationcontroller.deleteAllNotifications); 

module.exports = router;
