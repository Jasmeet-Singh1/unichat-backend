const Notification = require('../models/notification');
const User = require('../models/user');

// Enhanced function with real-time Socket.IO support
const notifyCoursePeersOnNewSignup = async (newUser, io = null) => {
    try {
        const newCourses = newUser.coursesEnrolled || [];
        
        if (!newCourses.length) {
            console.log('No courses enrolled for new user, skipping peer notifications');
            return;
        }

        console.log(`🔍 Checking peer notifications for ${newUser.firstName} ${newUser.lastName}`);
        
        let totalNotificationsSent = 0;

        for (const newCourse of newCourses) {
            // Find users with matching course, semester, and year
            const peers = await User.find({
                _id: { $ne: newUser._id },
                'coursesEnrolled': {
                    $elemMatch: {
                        course: newCourse.course,
                        semester: newCourse.semester,
                        year: newCourse.year
                    }
                }   
            }).select('_id firstName lastName email role');

            console.log(`📚 Found ${peers.length} peers for ${newCourse.course} (${newCourse.semester} ${newCourse.year})`);

            if (!peers.length) {
                console.log(`No peers found for course: ${newCourse.course}`);
                continue;
            }

            // Create database notifications
            const notifications = peers.map(peer => ({
                userId: peer._id,
                type: 'course_peer',
                title: 'New Course Mate!',
                message: `${newUser.firstName} ${newUser.lastName} (${newUser.role}) has joined your ${newCourse.course} class for ${newCourse.semester} ${newCourse.year}.`,
                relatedId: newUser._id,
                metadata: {
                    newUserName: `${newUser.firstName} ${newUser.lastName}`,
                    newUserRole: newUser.role,
                    course: newCourse.course,
                    semester: newCourse.semester,
                    year: newCourse.year,
                    instructor: newCourse.instructor || 'TBA'
                },
                isRead: false,
                createdAt: new Date()
            }));

            // Save notifications to database
            const savedNotifications = await Notification.insertMany(notifications);
            console.log(`💾 Created ${savedNotifications.length} database notifications for course: ${newCourse.course}`);

            // Send real-time notifications via Socket.IO (if io is available)
            if (io) {
                peers.forEach((peer, index) => {
                    // Emit to specific user if they're online
                    io.emit('new-notification', {
                        userId: peer._id.toString(),
                        notification: {
                            id: savedNotifications[index]._id,
                            type: 'course_peer',
                            title: 'New Course Mate!',
                            message: savedNotifications[index].message,
                            metadata: savedNotifications[index].metadata,
                            isRead: false,
                            createdAt: savedNotifications[index].createdAt
                        }
                    });

                    console.log(`📱 Real-time notification sent to ${peer.firstName} ${peer.lastName}`);
                });
            }

            totalNotificationsSent += peers.length;
        }

        console.log(`✅ Total notifications sent: ${totalNotificationsSent}`);
        return totalNotificationsSent;

    } catch (error) {
        console.error('❌ Error in notifyCoursePeersOnNewSignup:', error);
        throw error;
    }
};

// Function to get course peers for a specific user (useful for frontend)
const getCoursePeers = async (userId) => {
    try {
        const user = await User.findById(userId).select('coursesEnrolled firstName lastName role');
        
        if (!user || !user.coursesEnrolled?.length) {
            return [];
        }

        const peers = [];
        
        for (const course of user.coursesEnrolled) {
            const coursePeers = await User.find({
                _id: { $ne: userId },
                'coursesEnrolled': {
                    $elemMatch: {
                        course: course.course,
                        semester: course.semester,
                        year: course.year
                    }
                }
            }).select('_id firstName lastName role program');

            coursePeers.forEach(peer => {
                peers.push({
                    ...peer.toObject(),
                    sharedCourse: {
                        course: course.course,
                        semester: course.semester,
                        year: course.year,
                        instructor: course.instructor
                    }
                });
            });
        }

        return peers;
    } catch (error) {
        console.error('Error getting course peers:', error);
        throw error;
    }
};

// Function to notify when someone updates their courses
const notifyOnCourseUpdate = async (updatedUser, io = null) => {
    try {
        console.log(`🔄 Processing course update notifications for ${updatedUser.firstName} ${updatedUser.lastName}`);
        
        // This would be called when a user updates their enrolled courses
        // Similar logic to signup, but with different message
        return await notifyCoursePeersOnNewSignup(updatedUser, io);
        
    } catch (error) {
        console.error('Error in notifyOnCourseUpdate:', error);
        throw error;
    }
};

module.exports = { 
    notifyCoursePeersOnNewSignup,
    getCoursePeers,
    notifyOnCourseUpdate
};