const Notification = require('../models/notification');

// Get all notifications for a user
exports.getUserNotifications = async (req, res) => {
  try {
    // Add cache-control headers
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    const notifications = await Notification.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Mark a single notification as seen
exports.markNotificationAsSeen = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.notificationId,
      { seen: true },
      { new: true }
    );
    res.json(notification);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Mark all notifications as seen
exports.markAllAsSeen = async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.params.userId, seen: false }, { seen: true });
    res.json({ message: 'All notifications marked as seen' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create a new notification
exports.createNotification = async (req, res) => {
  try {
    const { userId, type, message, relatedId } = req.body;

    const newNotification = new Notification({
      userId,
      type,
      message,
      relatedId,
    });

    const savedNotification = await newNotification.save();
    res.status(201).json(savedNotification);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

