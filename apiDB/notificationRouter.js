const express = require('express');
const router = express.Router();
const notificationController = require('./notificationController');

router.get('/:userId', notificationController.getUserNotifications);
router.put('/seen/:notificationId', notificationController.markNotificationAsSeen);
router.put('/seen-all/:userId', notificationController.markAllAsSeen);

router.post('/', notificationController.createNotification);// add new notification

module.exports = router;
