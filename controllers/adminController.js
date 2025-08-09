// controllers/adminController.js
const Student = require("../models/student");
const Mentor = require("../models/mentor");
const Alumni = require("../models/alumni");
const User = require("../models/user");

// Get all users for admin dashboard
exports.getAllUsers = async (req, res) => {
  try {
    console.log('🔍 Admin: Getting all users');
    
    const { 
      search, 
      role, 
      status, 
      limit = 100,
      page = 1 
    } = req.query;
    
    // Build query
    let query = {};
    
    // Add role filter
    if (role && role !== 'All') {
      query.role = role;
    }
    
    // Add status filter (isApproved field)
    if (status && status !== 'All') {
      if (status === 'Verified') {
        query.isApproved = true;
      } else if (status === 'Pending') {
        query.isApproved = false;
      }
    }
    
    // Add search filter
    if (search && search.trim()) {
      const searchTerm = search.trim();
      query.$or = [
        { firstName: { $regex: searchTerm, $options: 'i' } },
        { lastName: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } },
        { username: { $regex: searchTerm, $options: 'i' } }
      ];
    }
    
    console.log('Admin query:', JSON.stringify(query, null, 2));
    
    // Get users with pagination
    const users = await User.find(query)
      .select('firstName lastName email username role program programType bio isApproved isVerified createdAt updatedAt')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();
    
    // Get total count for pagination
    const totalUsers = await User.countDocuments(query);
    
    // Get additional details for each user based on role
    const enrichedUsers = await Promise.all(users.map(async (user) => {
      let additionalData = {};
      
      try {
        if (user.role === 'Mentor') {
          const mentorData = await Mentor.findById(user._id)
            .select('courseExpertise availability overallGPA showGPA expectedGradDate')
            .lean();
          if (mentorData) {
            additionalData = {
              courseExpertise: mentorData.courseExpertise || [],
              availability: mentorData.availability || [],
              expectedGradDate: mentorData.expectedGradDate,
              ...(mentorData.showGPA && { overallGPA: mentorData.overallGPA })
            };
          }
        } else if (user.role === 'Alumni') {
          const alumniData = await Alumni.findById(user._id)
            .select('gradDate currentJob')
            .lean();
          if (alumniData) {
            additionalData = {
              gradDate: alumniData.gradDate,
              currentJob: alumniData.currentJob
            };
          }
        } else if (user.role === 'Student') {
          const studentData = await Student.findById(user._id)
            .select('expectedGradDate studentClubs')
            .lean();
          if (studentData) {
            additionalData = {
              expectedGradDate: studentData.expectedGradDate,
              studentClubs: studentData.studentClubs || []
            };
          }
        }
      } catch (err) {
        console.warn(`Could not fetch additional data for user ${user._id}:`, err.message);
      }
      
      return {
        id: user._id,
        name: `${user.firstName} ${user.lastName || ''}`.trim(),
        firstName: user.firstName,
        lastName: user.lastName || '',
        email: user.email,
        username: user.username,
        role: user.role,
        program: user.program || '',
        programType: user.programType || '',
        bio: user.bio || '',
        status: user.isApproved ? 'Verified' : 'Pending',
        isVerified: user.isVerified,
        joinDate: user.createdAt,
        lastActive: user.updatedAt,
        phone: user.phone || '',
        location: user.location || '',
        department: user.program || '',
        ...additionalData
      };
    }));
    
    console.log(`Found ${enrichedUsers.length} users out of ${totalUsers} total`);
    
    res.json({
      users: enrichedUsers,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalUsers / parseInt(limit)),
        totalUsers,
        hasMore: (parseInt(page) * parseInt(limit)) < totalUsers
      }
    });
    
  } catch (error) {
    console.error('❌ Admin getAllUsers error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch users', 
      message: error.message 
    });
  }
};

// Get user details by ID
exports.getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`🔍 Admin: Getting user details for ${userId}`);
    
    const user = await User.findById(userId)
      .select('-password') // Exclude password
      .lean();
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get role-specific details
    let additionalDetails = {};
    
    try {
      if (user.role === 'Mentor') {
        const mentorData = await Mentor.findById(userId)
          .select('courseExpertise availability overallGPA showGPA expectedGradDate')
          .lean();
        if (mentorData) {
          additionalDetails = {
            courseExpertise: mentorData.courseExpertise || [],
            availability: mentorData.availability || [],
            expectedGradDate: mentorData.expectedGradDate,
            ...(mentorData.showGPA && { overallGPA: mentorData.overallGPA })
          };
        }
      } else if (user.role === 'Alumni') {
        const alumniData = await Alumni.findById(userId)
          .select('gradDate currentJob')
          .lean();
        if (alumniData) {
          additionalDetails = {
            gradDate: alumniData.gradDate,
            currentJob: alumniData.currentJob
          };
        }
      } else if (user.role === 'Student') {
        const studentData = await Student.findById(userId)
          .select('expectedGradDate studentClubs')
          .lean();
        if (studentData) {
          additionalDetails = {
            expectedGradDate: studentData.expectedGradDate,
            studentClubs: studentData.studentClubs || []
          };
        }
      }
    } catch (err) {
      console.warn(`Could not fetch additional data for user ${userId}:`, err.message);
    }
    
    // Format complete user profile for admin
    const userProfile = {
      id: user._id,
      name: `${user.firstName} ${user.lastName || ''}`.trim(),
      firstName: user.firstName,
      lastName: user.lastName || '',
      email: user.email,
      username: user.username,
      role: user.role,
      program: user.program || '',
      programType: user.programType || '',
      bio: user.bio || '',
      status: user.isApproved ? 'Verified' : 'Pending',
      isVerified: user.isVerified,
      isApproved: user.isApproved,
      joinDate: user.createdAt,
      lastActive: user.updatedAt,
      phone: user.phone || '',
      location: user.location || '',
      coursesEnrolled: user.coursesEnrolled || [],
      totalMessages: 0, // You'll need to implement this based on your chat system
      eventsAttended: 0, // You'll need to implement this based on your events system
      accountCreated: user.createdAt,
      ...additionalDetails
    };
    
    console.log(`Returning profile for: ${userProfile.name}`);
    res.json(userProfile);
    
  } catch (error) {
    console.error('❌ Admin getUserById error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user details', 
      message: error.message 
    });
  }
};

// Delete user (admin only)
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`🗑️ Admin: Deleting user ${userId}`);
    
    // Get user details before deletion for logging
    const user = await User.findById(userId).select('firstName lastName email role');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Delete from the appropriate role-specific collection first
    try {
      if (user.role === 'Student') {
        await Student.findByIdAndDelete(userId);
      } else if (user.role === 'Mentor') {
        await Mentor.findByIdAndDelete(userId);
      } else if (user.role === 'Alumni') {
        await Alumni.findByIdAndDelete(userId);
      }
    } catch (err) {
      console.warn(`Could not delete from ${user.role} collection:`, err.message);
    }
    
    // Delete from main User collection
    await User.findByIdAndDelete(userId);
    
    console.log(`✅ Successfully deleted user: ${user.firstName} ${user.lastName} (${user.email})`);
    
    res.json({ 
      message: 'User deleted successfully',
      deletedUser: {
        id: userId,
        name: `${user.firstName} ${user.lastName || ''}`.trim(),
        email: user.email,
        role: user.role
      }
    });
    
  } catch (error) {
    console.error('❌ Admin deleteUser error:', error);
    res.status(500).json({ 
      error: 'Failed to delete user', 
      message: error.message 
    });
  }
};

// Get admin dashboard stats
exports.getDashboardStats = async (req, res) => {
  try {
    console.log('📊 Admin: Getting dashboard stats');
    
    // Get user counts
    const [
      totalUsers,
      students,
      mentors,
      alumni,
      verifiedUsers,
      pendingUsers,
      recentUsers
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'Student' }),
      User.countDocuments({ role: 'Mentor' }),
      User.countDocuments({ role: 'Alumni' }),
      User.countDocuments({ isApproved: true }),
      User.countDocuments({ isApproved: false }),
      User.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .select('firstName lastName email role createdAt')
        .lean()
    ]);
    
    // Calculate growth (you might want to implement this based on date ranges)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const newUsersThisWeek = await User.countDocuments({
      createdAt: { $gte: weekAgo }
    });
    
    const stats = {
      totalUsers,
      usersByRole: {
        students,
        mentors,
        alumni
      },
      usersByStatus: {
        verified: verifiedUsers,
        pending: pendingUsers
      },
      growth: {
        thisWeek: newUsersThisWeek,
        // You can add more growth metrics here
      },
      recentUsers: recentUsers.map(user => ({
        id: user._id,
        name: `${user.firstName} ${user.lastName || ''}`.trim(),
        email: user.email,
        role: user.role,
        joinDate: user.createdAt
      }))
    };
    
    console.log('Dashboard stats:', stats);
    res.json(stats);
    
  } catch (error) {
    console.error('❌ Admin getDashboardStats error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch dashboard stats', 
      message: error.message 
    });
  }
};

// Update user status (approve/reject)
exports.updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isApproved, isVerified } = req.body;
    
    console.log(`📝 Admin: Updating user status for ${userId}`, { isApproved, isVerified });
    
    const updateData = {};
    if (typeof isApproved === 'boolean') updateData.isApproved = isApproved;
    if (typeof isVerified === 'boolean') updateData.isVerified = isVerified;
    
    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select('firstName lastName email role isApproved isVerified');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log(`✅ Updated user status: ${user.firstName} ${user.lastName}`);
    
    res.json({
      message: 'User status updated successfully',
      user: {
        id: user._id,
        name: `${user.firstName} ${user.lastName || ''}`.trim(),
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
        isVerified: user.isVerified
      }
    });
    
  } catch (error) {
    console.error('❌ Admin updateUserStatus error:', error);
    res.status(500).json({ 
      error: 'Failed to update user status', 
      message: error.message 
    });
  }
};