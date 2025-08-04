const User = require('../models/user');

exports.getUserProfile = async (req, res) => {
    try {
        const requestedUserId = req.params.userId; // Whose profile is being requested
        const loggedInUserId = req.user.userId;    // Who is making the request (from JWT)

        // Authorization: 
        // Allow access if requesting own profile,
        // Otherwise check if requesting user exists and is an admin
        if (requestedUserId !== loggedInUserId) {
            const requestingUser = await User.findById(loggedInUserId);

            if (!requestingUser || requestingUser.role !== 'admin') {
                // If user doesn't exist or isn't admin, block access
                return res.status(403).json({ message: 'Access denied' });
            }
        }

        // Fetch the requested user profile from DB, including related info
        const user = await User.findById(requestedUserId)
        .populate('program')
        .populate({
            path: 'coursesEnrolled.course',
            model: 'Course',
        })
        .populate({
            path: 'studentClubs.club',
            model: 'StudentClub',
        })
        
        .lean(); //For faster read-only query results

        if (!user) {
            // If user not found, return 404 error
            return res.status(404).json({ message: 'User not found' });
        }

        // Build a base profile object with common fields
        const baseProfile = {
             _id: user._id,
            username: user.username,
            email: user.email,
            name: user.fullName || `${user.firstName} ${user.lastName}`,
            role: user.role,
            bio: user.bio || '',
            contactNumber: user.contactNumber || '',
            program: user.program,
            coursesEnrolled: user.coursesEnrolled || [],
        };

        // Add role-specific profile details
        if (user.role === 'Student') {
            baseProfile.expectedGradDate = user.expectedGradDate;
            baseProfile.studentClubs = user.studentClubs || [];
        }

        if (user.role === 'Mentor') {
            baseProfile.courseExpertise = user.courseExpertise || [];
            baseProfile.overallGPA = user.showGPA ? user.overallGPA : null;
            baseProfile.availability = user.availability || [];
            baseProfile.meetingFormat = user.meetingFormat || '';
            baseProfile.experience = user.experience || '';
            baseProfile.expertiseDescription = user.expertiseDescription || '';
        }

        if (user.role === 'Alumni') {
            baseProfile.gradDate = user.gradDate;
            baseProfile.currentJob = user.currentJob;
            baseProfile.passedOutCourses = user.passedOutCourses || [];
        }

        // Send the profile back to the client
        res.status(200).json(baseProfile);
    } 
    
    catch (err) {
        console.error('Error fetching profile:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
};
