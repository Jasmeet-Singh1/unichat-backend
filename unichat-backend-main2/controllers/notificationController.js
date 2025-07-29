
// existing users getting notification when users with same course joins 
const Notification = require('../models/notification');
const User = require('../models/user');

const notifyCoursePeersOnNewSignup = async (newUser) => {

    try {
        // users with same course, semester, and year
        const peers = await User.find({
            course: newUser.course,
            semester: newUser.semester,
            year: newUser.year,
            _id: { $ne: newUser._id },
        });

        if (!peers.length) return;

        // Create notifications
        const notifications = peers.map((peer) => ({
            userId: peer._id,
            type: 'new user',
            message: `${newUser.name} has joined your ${newUser.course} (${newUser.semester} ${newUser.year}) group.`,
            relatedId: newUser._id,
        }));

        await Notification.insertMany(notifications);
    } 
    
    catch (error) {
        console.error('Error notifying course peers:', error.message);
    }
};

module.exports = notifyCoursePeersOnNewSignup;
