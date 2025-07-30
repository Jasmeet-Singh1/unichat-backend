// existing users getting notification when users with same course joins 
const Notification = require('../models/notification');
const User = require('../models/user');

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

            console.log(`🔍 Found ${peers.length} peers for ${newCourse.course} (${newCourse.semester} ${newCourse.year})`);

            if (!peers.length) continue;

            const notifications = peers.map(peer => ({
                userId: peer._id,
                type: 'new user',
                message: `${newUser.firstName} ${newUser.lastName} has joined your ${newCourse.course} (${newCourse.semester} ${newCourse.year}) group.`,
                relatedId: newUser._id,
            }));

            await Notification.insertMany(notifications);
            console.log(`✅ Notifications created for ${peers.length} peers.`);
        }
    } 
    
    catch (error) {
        console.error('❌ Error notifying course peers:', error.message);
    }
};

module.exports = notifyCoursePeersOnNewSignup;
