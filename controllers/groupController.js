const Group = require('../models/group');
const User = require('../models/user');
const Student = require('../models/student');
const Mentor = require('../models/mentor');
const Alumni = require('../models/alumni');
const GroupMessage = require('../models/groupMess');

// Helper function to get user from any role collection (same as your login logic)
const getUserById = async (userId) => {
  let user = 
    (await Student.findById(userId)) ||
    (await Mentor.findById(userId)) ||
    (await Alumni.findById(userId));
  return user;
};

// Create a new group
exports.createGroup = async (req, res) => {
  try {
    const { name, description, isPrivate, memberIds } = req.body;
    const createdBy = req.user.userId; // ✅ Using userId from JWT

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Group name is required' });
    }

    // Verify creator exists
    const creator = await getUserById(createdBy);
    if (!creator) {
      return res.status(404).json({ error: 'Creator not found' });
    }

    // Start with creator as member
    let members = [createdBy];
    
    // Add selected members if provided
    if (memberIds && Array.isArray(memberIds)) {
      // Filter out duplicates and ensure creator is included
      const uniqueMembers = [...new Set([createdBy, ...memberIds])];
      members = uniqueMembers;
    }

    const newGroup = new Group({
      name: name.trim(),
      description: description || '',
      createdBy: createdBy,
      members: members,
      isPrivate: isPrivate !== undefined ? isPrivate : true
    });

    const savedGroup = await newGroup.save();
    
    // Manually populate members since they're in different collections
    const populatedMembers = [];
    for (const memberId of savedGroup.members) {
      const member = await getUserById(memberId);
      if (member) {
        populatedMembers.push({
          _id: member._id,
          firstName: member.firstName,
          lastName: member.lastName,
          email: member.email
        });
      }
    }

    const creatorInfo = await getUserById(savedGroup.createdBy);

    const responseGroup = {
      ...savedGroup.toObject(),
      createdBy: {
        _id: creatorInfo._id,
        firstName: creatorInfo.firstName,
        lastName: creatorInfo.lastName,
        email: creatorInfo.email
      },
      members: populatedMembers
    };

    res.status(201).json(responseGroup);
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ error: 'Failed to create group' });
  }
};

// Get all groups for a user (formatted like conversations)
exports.getUserGroups = async (req, res) => {
  try {
    const userId = req.user.userId; // ✅ Using userId from JWT

    const groups = await Group.find({
      members: userId
    }).sort({ createdAt: -1 });

    // Format groups to match conversation structure
    const formattedGroups = await Promise.all(groups.map(async (group) => {
      // Get creator info
      const creator = await getUserById(group.createdBy);
      
      // Get members info
      const membersInfo = [];
      for (const memberId of group.members) {
        const member = await getUserById(memberId);
        if (member) {
          membersInfo.push({
            _id: member._id,
            firstName: member.firstName,
            lastName: member.lastName,
            email: member.email
          });
        }
      }

      // Get last message for the group
      const lastMessage = await GroupMessage.findOne({ groupId: group._id })
        .sort({ timestamp: -1 });

      let lastMessageInfo = null;
      if (lastMessage) {
        const sender = await getUserById(lastMessage.sender);
        lastMessageInfo = {
          id: lastMessage._id,
          text: lastMessage.message,
          senderId: lastMessage.sender,
          senderName: sender ? `${sender.firstName} ${sender.lastName || ''}`.trim() : 'Unknown',
          timestamp: lastMessage.timestamp
        };
      }

      return {
        id: group._id,
        name: group.name,
        type: 'group',
        description: group.description,
        avatar: null,
        members: membersInfo,
        createdBy: creator ? {
          _id: creator._id,
          firstName: creator.firstName,
          lastName: creator.lastName,
          email: creator.email
        } : null,
        isPrivate: group.isPrivate,
        lastMessage: lastMessageInfo,
        updatedAt: lastMessage ? lastMessage.timestamp : group.createdAt,
        unreadCount: 0,
        pinned: false,
        muted: false,
        archived: false
      };
    }));

    res.json(formattedGroups);
  } catch (error) {
    console.error('Error fetching user groups:', error);
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
};

// Get group messages
exports.getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.userId; // ✅ Using userId from JWT

    console.log('Getting group messages:', { groupId, userId });

    // Check if user is a member of the group
    const group = await Group.findById(groupId);
    if (!group) {
      console.log('Group not found:', groupId);
      return res.status(404).json({ error: 'Group not found' });
    }

    // Convert userId to string for comparison
    const userIdString = userId.toString();
    const isMember = group.members.some(memberId => memberId.toString() === userIdString);
    
    console.log('Group membership check:', {
      userId: userIdString,
      groupMembers: group.members.map(m => m.toString()),
      isMember
    });

    if (!isMember) {
      console.log('Access denied - user not in group');
      return res.status(403).json({ error: 'Access denied' });
    }

    const messages = await GroupMessage.find({ groupId })
      .sort({ timestamp: 1 });

    // Format messages to match your chat message structure
    const formattedMessages = [];
    for (const msg of messages) {
      const sender = await getUserById(msg.sender);
      
      formattedMessages.push({
        id: msg._id,
        chatId: groupId,
        text: msg.message,
        senderId: msg.sender,
        senderName: sender ? `${sender.firstName} ${sender.lastName || ''}`.trim() : 'Unknown',
        timestamp: msg.timestamp,
        type: 'text',
        likes: msg.likes || []
      });
    }

    console.log('Returning messages:', formattedMessages.length);
    res.json(formattedMessages);
  } catch (error) {
    console.error('Error fetching group messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

// Send message to group
exports.sendGroupMessage = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { text } = req.body;
    const senderId = req.user.userId; // ✅ Using userId from JWT

    console.log('Sending group message:', { groupId, senderId, text: text?.substring(0, 50) });

    // Validate input
    if (!text || text.trim() === '') {
      return res.status(400).json({ error: 'Message text is required' });
    }

    // Check if user is a member of the group
    const group = await Group.findById(groupId);
    if (!group) {
      console.log('Group not found:', groupId);
      return res.status(404).json({ error: 'Group not found' });
    }

    // Convert senderId to string for comparison
    const senderIdString = senderId.toString();
    const isMember = group.members.some(memberId => memberId.toString() === senderIdString);
    
    console.log('Sender membership check:', {
      senderId: senderIdString,
      groupMembers: group.members.map(m => m.toString()),
      isMember
    });

    if (!isMember) {
      console.log('Access denied - sender not in group');
      return res.status(403).json({ error: 'Access denied' });
    }

    // Verify sender exists
    const sender = await getUserById(senderId);
    if (!sender) {
      return res.status(404).json({ error: 'Sender not found' });
    }

    const newMessage = new GroupMessage({
      groupId: groupId,
      sender: senderId,
      message: text.trim(),
      timestamp: new Date()
    });

    const savedMessage = await newMessage.save();
    
    console.log('Message saved:', savedMessage._id);

    // Format response to match your chat message structure
    const formattedMessage = {
      id: savedMessage._id,
      chatId: groupId,
      text: savedMessage.message,
      senderId: savedMessage.sender,
      senderName: `${sender.firstName} ${sender.lastName || ''}`.trim(),
      timestamp: savedMessage.timestamp,
      type: 'text',
      likes: savedMessage.likes || []
    };

    res.status(201).json(formattedMessage);
  } catch (error) {
    console.error('Error sending group message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

// Get group details
exports.getGroupDetails = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.userId; // ✅ Using userId from JWT

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Check if user is a member
    const userIdString = userId.toString();
    const isMember = group.members.some(memberId => memberId.toString() === userIdString);

    if (!isMember) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Manually populate creator and members
    const creator = await getUserById(group.createdBy);
    const membersInfo = [];
    
    for (const memberId of group.members) {
      const member = await getUserById(memberId);
      if (member) {
        membersInfo.push({
          _id: member._id,
          firstName: member.firstName,
          lastName: member.lastName,
          email: member.email
        });
      }
    }

    const responseGroup = {
      ...group.toObject(),
      createdBy: creator ? {
        _id: creator._id,
        firstName: creator.firstName,
        lastName: creator.lastName,
        email: creator.email
      } : null,
      members: membersInfo
    };

    res.json(responseGroup);
  } catch (error) {
    console.error('Error fetching group details:', error);
    res.status(500).json({ error: 'Failed to fetch group details' });
  }
};

// Add member to group
exports.addMember = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId, userIds } = req.body; // Support both single user and multiple users
    const requesterId = req.user.userId;

    console.log('Add member request:', { groupId, userId, userIds, requesterId });

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Check if requester is group creator or admin (you can modify this logic)
    if (group.createdBy.toString() !== requesterId.toString()) {
      return res.status(403).json({ error: 'Only group creator can add members' });
    }

    // Handle both single user and multiple users
    let usersToAdd = [];
    if (userId) {
      usersToAdd = [userId];
    } else if (userIds && Array.isArray(userIds)) {
      usersToAdd = userIds;
    } else {
      return res.status(400).json({ error: 'userId or userIds required' });
    }

    console.log('Users to add:', usersToAdd);

    let addedUsers = [];
    let errors = [];

    for (const userIdToAdd of usersToAdd) {
      try {
        // Check if user exists
        const userToAdd = await getUserById(userIdToAdd);
        if (!userToAdd) {
          errors.push(`User ${userIdToAdd} not found`);
          continue;
        }

        // Check if already a member
        if (group.members.some(memberId => memberId.toString() === userIdToAdd.toString())) {
          errors.push(`${userToAdd.firstName} ${userToAdd.lastName} is already a member`);
          continue;
        }

        // Add to group
        group.members.push(userIdToAdd);
        addedUsers.push({
          _id: userToAdd._id,
          firstName: userToAdd.firstName,
          lastName: userToAdd.lastName,
          email: userToAdd.email
        });
      } catch (err) {
        errors.push(`Error adding user ${userIdToAdd}: ${err.message}`);
      }
    }

    // Save the group with new members
    await group.save();

    // Manually populate updated group
    const creator = await getUserById(group.createdBy);
    const membersInfo = [];
    
    for (const memberId of group.members) {
      const member = await getUserById(memberId);
      if (member) {
        membersInfo.push({
          _id: member._id,
          firstName: member.firstName,
          lastName: member.lastName,
          email: member.email
        });
      }
    }

    const responseGroup = {
      ...group.toObject(),
      createdBy: creator ? {
        _id: creator._id,
        firstName: creator.firstName,
        lastName: creator.lastName,
        email: creator.email
      } : null,
      members: membersInfo
    };

    res.json({
      group: responseGroup,
      addedUsers,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully added ${addedUsers.length} member(s)`
    });
  } catch (error) {
    console.error('Error adding member:', error);
    res.status(500).json({ error: 'Failed to add member', details: error.message });
  }
};

// Remove member from group
exports.removeMember = async (req, res) => {
  try {
    const { groupId, userId } = req.params;
    const requesterId = req.user.userId; // ✅ Using userId from JWT

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Only group creator or the member themselves can remove
    if (group.createdBy.toString() !== requesterId.toString() && userId !== requesterId.toString()) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    // Can't remove group creator
    if (userId === group.createdBy.toString()) {
      return res.status(400).json({ error: 'Cannot remove group creator' });
    }

    group.members = group.members.filter(member => member.toString() !== userId);
    await group.save();

    // Manually populate updated group
    const creator = await getUserById(group.createdBy);
    const membersInfo = [];
    
    for (const memberId of group.members) {
      const member = await getUserById(memberId);
      if (member) {
        membersInfo.push({
          _id: member._id,
          firstName: member.firstName,
          lastName: member.lastName,
          email: member.email
        });
      }
    }

    const responseGroup = {
      ...group.toObject(),
      createdBy: creator ? {
        _id: creator._id,
        firstName: creator.firstName,
        lastName: creator.lastName,
        email: creator.email
      } : null,
      members: membersInfo
    };

    res.json(responseGroup);
  } catch (error) {
    console.error('Error removing member:', error);
    res.status(500).json({ error: 'Failed to remove member' });
  }
};

// Search users for adding to groups
exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.length < 2) {
      return res.json([]);
    }

    // Search across all role collections
    const searchRegex = { $regex: query, $options: 'i' };
    const searchCriteria = {
      $or: [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex }
      ]
    };

    const students = await Student.find(searchCriteria)
      .select('firstName lastName email')
      .limit(5);

    const mentors = await Mentor.find(searchCriteria)
      .select('firstName lastName email')
      .limit(5);

    const alumni = await Alumni.find(searchCriteria)
      .select('firstName lastName email')
      .limit(5);

    // Combine results
    const allUsers = [...students, ...mentors, ...alumni];
    
    // Remove duplicates by email and limit total results
    const uniqueUsers = allUsers.filter((user, index, self) => 
      index === self.findIndex(u => u.email === user.email)
    ).slice(0, 10);

    res.json(uniqueUsers);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: 'Search failed' });
  }
};

// Leave group
exports.leaveGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.userId; // ✅ Using userId from JWT

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Group creator cannot leave (they need to transfer ownership or delete group)
    if (group.createdBy.toString() === userId.toString()) {
      return res.status(400).json({ error: 'Group creator cannot leave. Transfer ownership or delete the group.' });
    }

    group.members = group.members.filter(member => member.toString() !== userId.toString());
    await group.save();

    res.json({ message: 'Left group successfully' });
  } catch (error) {
    console.error('Error leaving group:', error);
    res.status(500).json({ error: 'Failed to leave group' });
  }
};

// Edit group details
exports.editGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { name, description, isPrivate } = req.body;
    const requesterId = req.user.userId;

    console.log('Edit group request:', { groupId, name, description, isPrivate, requesterId });

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Check if requester is group creator
    if (group.createdBy.toString() !== requesterId.toString()) {
      return res.status(403).json({ error: 'Only group creator can edit group details' });
    }

    // Validate name if provided
    if (name !== undefined) {
      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Group name cannot be empty' });
      }
      group.name = name.trim();
    }

    // Update description if provided
    if (description !== undefined) {
      group.description = description || '';
    }

    // Update privacy setting if provided
    if (isPrivate !== undefined) {
      group.isPrivate = Boolean(isPrivate);
    }

    // Save the updated group
    await group.save();

    // Manually populate updated group
    const creator = await getUserById(group.createdBy);
    const membersInfo = [];
    
    for (const memberId of group.members) {
      const member = await getUserById(memberId);
      if (member) {
        membersInfo.push({
          _id: member._id,
          firstName: member.firstName,
          lastName: member.lastName,
          email: member.email
        });
      }
    }

    const responseGroup = {
      ...group.toObject(),
      createdBy: creator ? {
        _id: creator._id,
        firstName: creator.firstName,
        lastName: creator.lastName,
        email: creator.email
      } : null,
      members: membersInfo
    };

    res.json({
      group: responseGroup,
      message: 'Group updated successfully'
    });
  } catch (error) {
    console.error('Error editing group:', error);
    res.status(500).json({ error: 'Failed to edit group', details: error.message });
  }
};

// Delete group
exports.deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const requesterId = req.user.userId;

    console.log('Delete group request:', { groupId, requesterId });

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Check if requester is group creator
    if (group.createdBy.toString() !== requesterId.toString()) {
      return res.status(403).json({ error: 'Only group creator can delete the group' });
    }

    // Delete all group messages
    await GroupMessage.deleteMany({ groupId: groupId });

    // Delete the group
    await Group.findByIdAndDelete(groupId);

    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Error deleting group:', error);
    res.status(500).json({ error: 'Failed to delete group', details: error.message });
  }
};