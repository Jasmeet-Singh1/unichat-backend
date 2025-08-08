const express = require('express');
const router = express.Router();
const Student = require('../models/student');
const Mentor = require('../models/mentor');
const Alumni = require('../models/alumni');
const auth = require('../middleware/auth'); // Your auth middleware
const StudentClub = require('../models/club'); // Import the studentClub model
const course = require('../models/course');

// Helper function to find user across all role collections with full population
const findUserById = async (userId) => {
  try {
    let user = await Student.findById(userId)
      .populate('studentClubs.club', 'description _id')  // This will now work
      .lean();
    
    if (!user) {
      user = await Mentor.findById(userId).lean();
    }
    
    if (!user) {
      user = await Alumni.findById(userId).lean();
    }
    
    return user;
  } catch (error) {
    console.error('Error finding user:', error);
    return null;
  }
};

// GET current user's profile - PROTECTED
router.get('/current', auth, async (req, res) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    console.log('Loading profile for user ID:', userId);
    
    const user = await findUserById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log('Found user:', user.email, user.role);
    
    // Return COMPLETE user data
    const profileData = {
      id: user._id,
      _id: user._id,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      username: user.username || '',
      email: user.email || '',
      role: user.role || '',
      program: user.program || '',
      programType: user.programType || '',
      bio: user.bio || '',
      interests: user.interests || '',
      skills: user.skills || [],
      contactNumber: user.contactNumber || '',
      
      // Handle graduation dates based on role
      graduationYear: user.role === 'Student' && user.expectedGradDate 
        ? new Date(user.expectedGradDate).getFullYear().toString()
        : user.role === 'Alumni' && user.gradDate
        ? new Date(user.gradDate).getFullYear().toString()
        : '',
      
      expectedGradDate: user.expectedGradDate || null,
      gradDate: user.gradDate || null,
      
      // Social links structure
      socialLinks: {
        linkedin: user.socialLinks?.linkedin || user.linkedin || '',
        github: user.socialLinks?.github || user.github || '',
        twitter: user.socialLinks?.twitter || user.twitter || ''
      },
      
      // Additional fields
      achievements: user.achievements || [],
      profilePicture: user.profilePicture || null,
      
      // Courses Enrolled (for all roles)
      coursesEnrolled: user.coursesEnrolled ? user.coursesEnrolled.map(course => ({
        course: course.course?.courseCode || course.course?.name || course.course || 'Unknown Course',
        courseName: course.course?.courseName || course.course?.name || '',
        semester: course.semester || '',
        year: course.year || '',
        instructor: course.instructor || ''
      })) : [],
      
      // Student-specific fields
      ...(user.role === 'Student' && {
        studentClubs: user.studentClubs ? user.studentClubs.map(club => ({
          club: club.club?.name || club.club?.clubName || club.club || 'Unknown Club',
          designation: club.designation || 'Member'
        })) : []
      }),
      
      // Mentor-specific fields
      ...(user.role === 'Mentor' && {
        courseExpertise: user.courseExpertise ? user.courseExpertise.map(expertise => ({
          course: expertise.course?.courseCode || expertise.course?.name || expertise.course || 'Unknown Course',
          courseName: expertise.course?.courseName || expertise.course?.name || '',
          grade: expertise.grade || '',
          topicsCovered: expertise.topicsCovered || [],
          instructor: expertise.instructor || ''
        })) : [],
        availability: user.availability || [],
        overallGPA: user.showGPA ? user.overallGPA : null,
        showGPA: user.showGPA || false,
        experience: user.experience || '',
        expertiseDescription: user.expertiseDescription || ''
      }),
      
      // Alumni-specific fields
      ...(user.role === 'Alumni' && {
        currentJob: {
          companyName: user.currentJob?.companyName || '',
          jobTitle: user.currentJob?.jobTitle || '',
          startDate: user.currentJob?.startDate || null,
          isPresent: user.currentJob?.isPresent || false
        }
      }),
      
      // Timestamps
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
    
    console.log('Returning complete profile data for:', profileData.email);
    res.status(200).json(profileData);
    
  } catch (error) {
    console.error('Error fetching current user profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET any user's profile by ID - PROTECTED (same structure as current)
router.get('/:userId', auth, async (req, res) => {
  try {
    const requestedUserId = req.params.userId;
    
    console.log('Loading profile for requested user ID:', requestedUserId);
    
    const user = await findUserById(requestedUserId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Return public profile data (same structure as current but potentially filtered)
    const profileData = {
      id: user._id,
      _id: user._id,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      username: user.username || '',
      // Hide email for privacy - only show to the user themselves
      email: '', // Hidden for other users
      role: user.role || '',
      program: user.program || '',
      programType: user.programType || '',
      bio: user.bio || '',
      interests: user.interests || '',
      skills: user.skills || [],
      
      graduationYear: user.role === 'Student' && user.expectedGradDate 
        ? new Date(user.expectedGradDate).getFullYear().toString()
        : user.role === 'Alumni' && user.gradDate
        ? new Date(user.gradDate).getFullYear().toString()
        : '',
      
      expectedGradDate: user.expectedGradDate || null,
      gradDate: user.gradDate || null,
      
      socialLinks: {
        linkedin: user.socialLinks?.linkedin || user.linkedin || '',
        github: user.socialLinks?.github || user.github || '',
        twitter: user.socialLinks?.twitter || user.twitter || ''
      },
      
      coursesEnrolled: user.coursesEnrolled ? user.coursesEnrolled.map(course => ({
        course: course.course?.courseCode || course.course?.name || course.course || 'Unknown Course',
        courseName: course.course?.courseName || course.course?.name || '',
        semester: course.semester || '',
        year: course.year || '',
        instructor: course.instructor || ''
      })) : [],
      
      // Role-specific public fields
      ...(user.role === 'Student' && {
        studentClubs: user.studentClubs ? user.studentClubs.map(club => ({
          club: club.club?.name || club.club?.clubName || club.club || 'Unknown Club',
          designation: club.designation || 'Member'
        })) : []
      }),
      
      ...(user.role === 'Mentor' && {
        courseExpertise: user.courseExpertise ? user.courseExpertise.map(expertise => ({
          course: expertise.course?.courseCode || expertise.course?.name || expertise.course || 'Unknown Course',
          courseName: expertise.course?.courseName || expertise.course?.name || '',
          grade: expertise.grade || '',
          topicsCovered: expertise.topicsCovered || []
        })) : [],
        availability: user.availability || [],
        // Only show GPA if user allows it
        overallGPA: user.showGPA ? user.overallGPA : null,
        experience: user.experience || '',
        expertiseDescription: user.expertiseDescription || ''
      }),
      
      ...(user.role === 'Alumni' && {
        currentJob: {
          companyName: user.currentJob?.companyName || '',
          jobTitle: user.currentJob?.jobTitle || ''
          // Hide sensitive job details for public view
        }
      })
    };
    
    res.status(200).json(profileData);
    
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT update user profile - PROTECTED
router.put('/:userId', auth, async (req, res) => {
  try {
    const userId = req.params.userId;
    const loggedInUserId = req.user?.userId;
    
    // Only allow users to update their own profile
    if (userId !== loggedInUserId) {
      return res.status(403).json({ message: 'Can only update your own profile' });
    }
    
    const updateData = req.body;
    console.log('Updating profile for user:', userId, 'with data:', Object.keys(updateData));
    
    // Find which collection the user belongs to
    let user = await Student.findById(userId);
    let Model = Student;
    
    if (!user) {
      user = await Mentor.findById(userId);
      Model = Mentor;
    }
    
    if (!user) {
      user = await Alumni.findById(userId);
      Model = Alumni;
    }
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Prepare update object
    const updateFields = {};
    
    // Basic fields that can be updated
    if (updateData.firstName !== undefined) updateFields.firstName = updateData.firstName;
    if (updateData.lastName !== undefined) updateFields.lastName = updateData.lastName;
    if (updateData.username !== undefined) updateFields.username = updateData.username;
    if (updateData.bio !== undefined) updateFields.bio = updateData.bio;
    if (updateData.interests !== undefined) updateFields.interests = updateData.interests;
    if (updateData.skills !== undefined) updateFields.skills = updateData.skills;
    if (updateData.contactNumber !== undefined) updateFields.contactNumber = updateData.contactNumber;
    if (updateData.program !== undefined) updateFields.program = updateData.program;
    if (updateData.programType !== undefined) updateFields.programType = updateData.programType;
    
    // Social links
    if (updateData.socialLinks) {
      updateFields.socialLinks = {
        linkedin: updateData.socialLinks.linkedin || '',
        github: updateData.socialLinks.github || '',
        twitter: updateData.socialLinks.twitter || ''
      };
    }
    
    // Graduation year handling
    if (updateData.graduationYear) {
      const gradYear = parseInt(updateData.graduationYear);
      if (user.role === 'Student') {
        updateFields.expectedGradDate = new Date(`${gradYear}-06-01`);
      } else if (user.role === 'Alumni') {
        updateFields.gradDate = new Date(`${gradYear}-06-01`);
      }
    }
    
    console.log('Update fields:', updateFields);
    
    // Update the user
    const updatedUser = await Model.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true, runValidators: true }
    );
    
    console.log('Profile updated successfully for:', updatedUser.email);
    
    res.status(200).json({ 
      message: 'Profile updated successfully',
      user: updatedUser 
    });
    
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;