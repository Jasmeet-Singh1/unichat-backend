const Student = require("../models/student");
const Mentor = require("../models/mentor");
const Alumni = require("../models/alumni");
const User = require("../models/user");

// Helper function to get user from any role collection
const getUserById = async (userId) => {
  // Since you're using discriminators, you can just use the base User model
  return await User.findById(userId);
};

// Search users across all collections with advanced filters
exports.searchUsers = async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const {
      q, // general search term (name/email/username)
      email,
      username,
      role,
      program,
      programType,
      courseCode, // will search in coursesEnrolled
      limit = 50
    } = req.query;
    
    console.log('Search params:', req.query);
    console.log('Current user ID:', currentUserId);
    
    // Build base search query
    let searchQuery = { 
      _id: { $ne: currentUserId },
      isApproved: true // Only show approved users
    };
    
    // Add role filter if specified
    if (role && role.trim()) {
      searchQuery.role = role.trim();
    }
    
    // Add program type filter
    if (programType && programType.trim()) {
      searchQuery.programType = programType.trim();
    }
    
    // Add program filter
    if (program && program.trim()) {
      searchQuery.program = { $regex: program.trim(), $options: 'i' };
    }
    
    // Build text search conditions
    const textConditions = [];
    
    // General search (name, email, username)
    if (q && q.trim()) {
      const searchTerm = q.trim();
      textConditions.push(
        { firstName: { $regex: searchTerm, $options: 'i' } },
        { lastName: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } },
        { username: { $regex: searchTerm, $options: 'i' } },
        { $expr: { 
          $regexMatch: { 
            input: { $concat: ["$firstName", " ", { $ifNull: ["$lastName", ""] }] },
            regex: searchTerm,
            options: "i"
          }
        }}
      );
    }
    
    // Email specific search
    if (email && email.trim()) {
      searchQuery.email = { $regex: email.trim(), $options: 'i' };
    }
    
    // Username specific search
    if (username && username.trim()) {
      searchQuery.username = { $regex: username.trim(), $options: 'i' };
    }
    
    // Add text conditions to main query if any exist
    if (textConditions.length > 0) {
      if (searchQuery.$or) {
        searchQuery.$and = [{ $or: textConditions }, { $or: searchQuery.$or }];
        delete searchQuery.$or;
      } else {
        searchQuery.$or = textConditions;
      }
    }
    
    // Course code search in coursesEnrolled array
    if (courseCode && courseCode.trim()) {
      searchQuery['coursesEnrolled.course'] = { $regex: courseCode.trim(), $options: 'i' };
    }
    
    console.log('Final search query:', JSON.stringify(searchQuery, null, 2));
    
    let allUsers = [];
    
    // Use the base User model for searching (it includes all discriminators)
    const users = await User.find(searchQuery)
      .select('firstName lastName email username role program programType bio coursesEnrolled isVerified isApproved')
      .limit(parseInt(limit))
      .lean();
    
    console.log(`Found ${users.length} users`);
    
    // For Mentors, get additional fields
    if (!role || role === 'Mentor') {
      const mentorIds = users.filter(u => u.role === 'Mentor').map(u => u._id);
      if (mentorIds.length > 0) {
        const mentorDetails = await Mentor.find({ _id: { $in: mentorIds } })
          .select('courseExpertise availability overallGPA showGPA')
          .lean();
        
        // Merge mentor details with user data
        const mentorMap = new Map(mentorDetails.map(m => [m._id.toString(), m]));
        users.forEach(user => {
          if (user.role === 'Mentor') {
            const mentorData = mentorMap.get(user._id.toString());
            if (mentorData) {
              user.courseExpertise = mentorData.courseExpertise;
              user.availability = mentorData.availability;
              if (mentorData.showGPA) {
                user.overallGPA = mentorData.overallGPA;
              }
            }
          }
        });
      }
    }
    
    // For Alumni, get additional fields
    if (!role || role === 'Alumni') {
      const alumniIds = users.filter(u => u.role === 'Alumni').map(u => u._id);
      if (alumniIds.length > 0) {
        const alumniDetails = await Alumni.find({ _id: { $in: alumniIds } })
          .select('gradDate currentJob')
          .lean();
        
        // Merge alumni details with user data
        const alumniMap = new Map(alumniDetails.map(a => [a._id.toString(), a]));
        users.forEach(user => {
          if (user.role === 'Alumni') {
            const alumniData = alumniMap.get(user._id.toString());
            if (alumniData) {
              user.gradDate = alumniData.gradDate;
              user.currentJob = alumniData.currentJob;
            }
          }
        });
      }
    }
    
    // For Students, get additional fields
    if (!role || role === 'Student') {
      const studentIds = users.filter(u => u.role === 'Student').map(u => u._id);
      if (studentIds.length > 0) {
        const studentDetails = await Student.find({ _id: { $in: studentIds } })
          .select('expectedGradDate studentClubs')
          .lean();
        
        // Merge student details with user data
        const studentMap = new Map(studentDetails.map(s => [s._id.toString(), s]));
        users.forEach(user => {
          if (user.role === 'Student') {
            const studentData = studentMap.get(user._id.toString());
            if (studentData) {
              user.expectedGradDate = studentData.expectedGradDate;
              user.studentClubs = studentData.studentClubs;
            }
          }
        });
      }
    }
    
    // Format results
    const formattedUsers = users.map(user => ({
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName || '',
      fullName: `${user.firstName} ${user.lastName || ''}`.trim(),
      email: user.email,
      username: user.username,
      role: user.role,
      program: user.program || '',
      programType: user.programType || '',
      bio: user.bio || '',
      coursesEnrolled: user.coursesEnrolled || [],
      isVerified: user.isVerified,
      isApproved: user.isApproved,
      // Role-specific fields
      ...(user.role === 'Mentor' && {
        courseExpertise: user.courseExpertise || [],
        availability: user.availability || [],
        overallGPA: user.overallGPA
      }),
      ...(user.role === 'Alumni' && {
        gradDate: user.gradDate,
        currentJob: user.currentJob
      }),
      ...(user.role === 'Student' && {
        expectedGradDate: user.expectedGradDate,
        studentClubs: user.studentClubs || []
      })
    }));
    
    // Sort by relevance (exact matches first, then alphabetical)
    const sortedUsers = formattedUsers.sort((a, b) => {
      if (q && q.trim()) {
        const queryLower = q.trim().toLowerCase();
        const aExactMatch = a.fullName.toLowerCase() === queryLower || 
                           a.email.toLowerCase() === queryLower ||
                           a.username.toLowerCase() === queryLower;
        const bExactMatch = b.fullName.toLowerCase() === queryLower || 
                           b.email.toLowerCase() === queryLower ||
                           b.username.toLowerCase() === queryLower;
        
        if (aExactMatch && !bExactMatch) return -1;
        if (!aExactMatch && bExactMatch) return 1;
      }
      
      // Then sort alphabetically by name
      return a.fullName.localeCompare(b.fullName);
    });
    
    console.log(`Returning ${sortedUsers.length} users`);
    res.json(sortedUsers);
    
  } catch (error) {
    console.error('Error in search:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get all users (for initial load)
exports.getAllUsers = async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const { limit = 50, role } = req.query;
    
    console.log('Getting all users except:', currentUserId);
    
    const query = { 
      _id: { $ne: currentUserId },
      isApproved: true // Only show approved users
    };
    
    if (role) {
      query.role = role;
    }
    
    const users = await User.find(query)
      .select('firstName lastName email username role program programType bio isVerified')
      .limit(parseInt(limit))
      .sort({ firstName: 1, lastName: 1 })
      .lean();
    
    const formattedUsers = users.map(user => ({
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName || '',
      fullName: `${user.firstName} ${user.lastName || ''}`.trim(),
      email: user.email,
      username: user.username,
      role: user.role,
      program: user.program || '',
      programType: user.programType || '',
      bio: user.bio || '',
      isVerified: user.isVerified
    }));
    
    console.log(`Returning ${formattedUsers.length} users`);
    res.json(formattedUsers);
    
  } catch (error) {
    console.error('Error getting all users:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get user profile by ID
exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.params.userId;
    const currentUserId = req.user.userId;
    
    if (userId === currentUserId) {
      return res.status(400).json({ error: 'Cannot get your own profile through this endpoint' });
    }
    
    const user = await User.findById(userId)
      .select('-password') // Exclude password
      .lean();
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get role-specific details
    let additionalDetails = {};
    
    if (user.role === 'Mentor') {
      const mentor = await Mentor.findById(userId)
        .select('courseExpertise availability overallGPA showGPA expectedGradDate')
        .lean();
      if (mentor) {
        additionalDetails = {
          courseExpertise: mentor.courseExpertise,
          availability: mentor.availability,
          expectedGradDate: mentor.expectedGradDate
        };
        if (mentor.showGPA) {
          additionalDetails.overallGPA = mentor.overallGPA;
        }
      }
    } else if (user.role === 'Alumni') {
      const alumni = await Alumni.findById(userId)
        .select('gradDate currentJob')
        .lean();
      if (alumni) {
        additionalDetails = {
          gradDate: alumni.gradDate,
          currentJob: alumni.currentJob
        };
      }
    } else if (user.role === 'Student') {
      const student = await Student.findById(userId)
        .select('expectedGradDate studentClubs')
        .lean();
      if (student) {
        additionalDetails = {
          expectedGradDate: student.expectedGradDate,
          studentClubs: student.studentClubs
        };
      }
    }
    
    // Return public profile information
    const profile = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName || '',
      fullName: `${user.firstName} ${user.lastName || ''}`.trim(),
      email: user.email,
      username: user.username,
      role: user.role,
      program: user.program || '',
      programType: user.programType || '',
      bio: user.bio || '',
      coursesEnrolled: user.coursesEnrolled || [],
      isVerified: user.isVerified,
      isApproved: user.isApproved,
      createdAt: user.createdAt,
      ...additionalDetails
    };
    
    res.json(profile);
    
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({ error: error.message });
  }
};

// Search mentors by course expertise
exports.searchMentorsByCourse = async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const { courseCode, minGrade = 'B+', limit = 20 } = req.query;
    
    if (!courseCode) {
      return res.status(400).json({ error: 'Course code is required' });
    }
    
    const gradeOrder = ['A+', 'A', 'A-', 'B+'];
    const minGradeIndex = gradeOrder.indexOf(minGrade);
    const acceptableGrades = gradeOrder.slice(0, minGradeIndex + 1);
    
    const mentors = await Mentor.find({
      _id: { $ne: currentUserId },
      isApproved: true,
      'courseExpertise.course': { $regex: courseCode, $options: 'i' },
      'courseExpertise.grade': { $in: acceptableGrades }
    })
    .select('firstName lastName email username courseExpertise availability overallGPA showGPA')
    .limit(parseInt(limit))
    .lean();
    
    // Format and filter course expertise
    const formattedMentors = mentors.map(mentor => {
      const relevantCourses = mentor.courseExpertise.filter(ce => 
        ce.course.match(new RegExp(courseCode, 'i')) &&
        acceptableGrades.includes(ce.grade)
      );
      
      return {
        id: mentor._id,
        firstName: mentor.firstName,
        lastName: mentor.lastName || '',
        fullName: `${mentor.firstName} ${mentor.lastName || ''}`.trim(),
        email: mentor.email,
        username: mentor.username,
        relevantCourseExpertise: relevantCourses,
        availability: mentor.availability || [],
        overallGPA: mentor.showGPA ? mentor.overallGPA : undefined
      };
    });
    
    // Sort by best grade in the searched course
    formattedMentors.sort((a, b) => {
      const getBestGrade = (mentor) => {
        const grades = mentor.relevantCourseExpertise.map(ce => ce.grade);
        for (let grade of gradeOrder) {
          if (grades.includes(grade)) return gradeOrder.indexOf(grade);
        }
        return gradeOrder.length;
      };
      
      return getBestGrade(a) - getBestGrade(b);
    });
    
    res.json(formattedMentors);
    
  } catch (error) {
    console.error('Error searching mentors by course:', error);
    res.status(500).json({ error: error.message });
  }
};

/*
// Simplified version of searchController.js to ensure it works

const User = require("../models/user");

// Simplified search to test basic functionality
exports.searchUsers = async (req, res) => {
  try {
    console.log('🔍 Search endpoint called');
    console.log('Query params:', req.query);
    
    const currentUserId = req.user.userId;
    const { q, role, limit = 50 } = req.query;
    
    // Build simple query
    let searchQuery = {
      _id: { $ne: currentUserId }
    };
    
    // Add role filter
    if (role) {
      searchQuery.role = role;
    }
    
    // Add search term
    if (q) {
      searchQuery.$or = [
        { firstName: { $regex: q, $options: 'i' } },
        { lastName: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { username: { $regex: q, $options: 'i' } }
      ];
    }
    
    console.log('MongoDB query:', JSON.stringify(searchQuery, null, 2));
    
    // Get users
    const users = await User.find(searchQuery)
      .select('firstName lastName email username role program')
      .limit(parseInt(limit))
      .lean()
      .exec(); // Force execution
    
    console.log(`Found ${users.length} users`);
    
    // Format response
    const formattedUsers = users.map(user => ({
      id: user._id.toString(),
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      email: user.email || '',
      username: user.username || '',
      role: user.role || '',
      program: user.program || ''
    }));
    
    console.log('Sending response with', formattedUsers.length, 'users');
    
    // Send response
    return res.status(200).json(formattedUsers);
    
  } catch (error) {
    console.error('❌ Search error:', error);
    return res.status(500).json({ 
      error: 'Search failed', 
      message: error.message 
    });
  }
};

// Simplified getAllUsers
exports.getAllUsers = async (req, res) => {
  try {
    console.log('📋 Get all users endpoint called');
    
    const currentUserId = req.user.userId;
    const { limit = 50 } = req.query;
    
    // Simple query - just exclude current user
    const query = {
      _id: { $ne: currentUserId }
    };
    
    console.log('Query:', query);
    
    // Get users
    const users = await User.find(query)
      .select('firstName lastName email username role program')
      .limit(parseInt(limit))
      .sort({ firstName: 1 })
      .lean()
      .exec(); // Force execution
    
    console.log(`Found ${users.length} users`);
    
    // Format response
    const formattedUsers = users.map(user => ({
      id: user._id.toString(),
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      email: user.email || '',
      username: user.username || '',
      role: user.role || '',
      program: user.program || ''
    }));
    
    console.log('Sending response with', formattedUsers.length, 'users');
    
    // Send response
    return res.status(200).json(formattedUsers);
    
  } catch (error) {
    console.error('❌ Get all users error:', error);
    return res.status(500).json({ 
      error: 'Failed to get users', 
      message: error.message 
    });
  }
};

// Simple get user profile
exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.params.userId;
    const currentUserId = req.user.userId;
    
    console.log('👤 Get profile for:', userId);
    
    if (userId === currentUserId) {
      return res.status(400).json({ 
        error: 'Cannot get your own profile through this endpoint' 
      });
    }
    
    const user = await User.findById(userId)
      .select('-password')
      .lean()
      .exec();
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const profile = {
      id: user._id.toString(),
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      email: user.email || '',
      username: user.username || '',
      role: user.role || '',
      program: user.program || '',
      bio: user.bio || ''
    };
    
    console.log('Sending profile for:', profile.fullName);
    return res.status(200).json(profile);
    
  } catch (error) {
    console.error('❌ Get profile error:', error);
    return res.status(500).json({ 
      error: 'Failed to get profile', 
      message: error.message 
    });
  }
};
*/