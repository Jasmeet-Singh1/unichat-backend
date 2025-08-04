const Notification = require('../models/notification');

// Get all notifications for a user
exports.getUserNotifications = async (req, res) => {
  try {
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

// existing users getting notification when users with same course joins 
const notifyCoursePeersOnNewSignup = async (newUser) => {
    try {
        const newCourses = newUser.coursesEnrolled || [];

        for (const newCourse of newCourses) {
            const peers = await User.find({
                _id: { $ne: newUser._id },
                'coursesEnrolled': {
                    $elemMatch: {course: newCourse.course,semester: newCourse.semester,year: newCourse.year}
                }   
            });

            console.log(`Found ${peers.length} peers for ${newCourse.course} (${newCourse.semester} ${newCourse.year})`);

            if (!peers.length) continue;

            const notifications = peers.map(peer => ({
                userId: peer._id,
                type: 'new user',
                message: `${newUser.firstName} ${newUser.lastName} has joined your ${newCourse.course} (${newCourse.semester} ${newCourse.year}) group.`,
                relatedId: newUser._id,
            }));

            await Notification.insertMany(notifications);
            console.log(`Notifications created for ${peers.length} peers.`);
        }
    } 
    catch (error) {
        console.error('Error notifying course peers:', error.message);
    }
};