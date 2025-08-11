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
    
    console.log('📥 Getting notifications for user:', req.params.userId);
    
    const notifications = await Notification.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    
    console.log(`📦 Found ${notifications.length} notifications`);
    console.log('📊 isRead status:', notifications.map(n => ({ id: n._id, isRead: n.isRead, type: n.type })));
    
    res.json(notifications);
  } catch (err) {
    console.error('❌ Error getting notifications:', err);
    res.status(500).json({ error: err.message });
  }
};

// Mark a single notification as seen (using isRead)
exports.markNotificationAsSeen = async (req, res) => {
  try {
    console.log('👁️ Marking notification as read:', req.params.notificationId);
    
    const notification = await Notification.findByIdAndUpdate(
      req.params.notificationId,
      { isRead: true }, // ✅ Use isRead instead of seen
      { new: true }
    );
    
    console.log('✅ Notification marked as read:', notification._id);
    res.json(notification);
  } catch (err) {
    console.error('❌ Error marking notification as read:', err);
    res.status(500).json({ error: err.message });
  }
};

// Mark all notifications as seen (using isRead)
exports.markAllAsSeen = async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log('👁️‍🗨️ Marking ALL notifications as read for user:', userId);
    
    // Check before update
    const beforeUpdate = await Notification.find({ userId });
    console.log('📋 Before update:', beforeUpdate.map(n => ({ id: n._id, isRead: n.isRead })));
    
    const result = await Notification.updateMany(
      { userId: userId, isRead: false }, // ✅ Use isRead instead of seen
      { isRead: true } // ✅ Use isRead instead of seen
    );
    
    console.log('📊 Update result:', {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount
    });
    
    // Check after update
    const afterUpdate = await Notification.find({ userId });
    console.log('📋 After update:', afterUpdate.map(n => ({ id: n._id, isRead: n.isRead })));
    
    res.json({ 
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount
    });
  } catch (err) {
    console.error('❌ Error marking all notifications as read:', err);
    res.status(500).json({ error: err.message });
  }
};

// Create a new notification
exports.createNotification = async (req, res) => {
  try {
    const { userId, type, message, relatedId, title } = req.body;

    const newNotification = new Notification({
      userId,
      type,
      message,
      title: title || 'Notification', // Default title if not provided
      relatedId,
      isRead: false // ✅ Explicitly set isRead
    });

    const savedNotification = await newNotification.save();
    console.log('✅ Notification created:', savedNotification._id);
    res.status(201).json(savedNotification);
  } catch (err) {
    console.error('❌ Error creating notification:', err);
    res.status(500).json({ error: err.message });
  }
};