const Group = require('../models/group');
const User = require('../models/user');
const GroupMessage = require('../models/groupMess'); // Your existing model

// Create a new group
exports.createGroup = async (req, res) => {
  try {
    const { name, description, isPrivate, memberIds } = req.body;
    const createdBy = req.user.userId;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Group name is required' });
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
    
    const populatedGroup = await Group.findById(savedGroup._id)
      .populate('createdBy', 'firstName lastName email')
      .populate('members', 'firstName lastName email');

    res.status(201).json(populatedGroup);
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ error: 'Failed to create group' });
  }
};

// Get all groups for a user (formatted like conversations)
exports.getUserGroups = async (req, res) => {
  try {
    const userId = req.user.userId;

    const groups = await Group.find({
      members: userId
    })
    .populate('createdBy', 'firstName lastName email')
    .populate('members', 'firstName lastName email')
    .sort({ createdAt: -1 });

    // Format groups to match conversation structure
    const formattedGroups = await Promise.all(groups.map(async (group) => {
      // Get last message for the group
      const lastMessage = await GroupMessage.findOne({ groupId: group._id })
        .populate('sender', 'firstName lastName')
        .sort({ timestamp: -1 });

      return {
        id: group._id,
        name: group.name,
        type: 'group',
        description: group.description,
        avatar: null, // You can add group avatars later
        members: group.members,
        createdBy: group.createdBy,
        isPrivate: group.isPrivate,
        lastMessage: lastMessage ? {
          id: lastMessage._id,
          text: lastMessage.message,
          senderId: lastMessage.sender._id,
          senderName: `${lastMessage.sender.firstName} ${lastMessage.sender.lastName}`,
          timestamp: lastMessage.timestamp
        } : null,
        updatedAt: lastMessage ? lastMessage.timestamp : group.createdAt,
        unreadCount: 0, // You can implement unread count logic later
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
    const userId = req.user.id;

    // Check if user is a member of the group
    const group = await Group.findById(groupId);
    if (!group || !group.members.includes(userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const messages = await GroupMessage.find({ groupId })
      .populate('sender', 'firstName lastName email')
      .sort({ timestamp: 1 });

    // Format messages to match your chat message structure
    const formattedMessages = messages.map(msg => ({
      id: msg._id,
      chatId: groupId,
      text: msg.message,
      senderId: msg.sender._id,
      senderName: `${msg.sender.firstName} ${msg.sender.lastName}`,
      timestamp: msg.timestamp,
      type: 'text',
      likes: msg.likes || []
    }));

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
    const senderId = req.user.id;

    // Check if user is a member of the group
    const group = await Group.findById(groupId);
    if (!group || !group.members.includes(senderId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const newMessage = new GroupMessage({
      groupId: groupId,
      sender: senderId,
      message: text,
      timestamp: new Date()
    });

    const savedMessage = await newMessage.save();
    
    const populatedMessage = await GroupMessage.findById(savedMessage._id)
      .populate('sender', 'firstName lastName email');

    // Format response to match your chat message structure
    const formattedMessage = {
      id: populatedMessage._id,
      chatId: groupId,
      text: populatedMessage.message,
      senderId: populatedMessage.sender._id,
      senderName: `${populatedMessage.sender.firstName} ${populatedMessage.sender.lastName}`,
      timestamp: populatedMessage.timestamp,
      type: 'text',
      likes: populatedMessage.likes || []
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
    const userId = req.user.userId;

    const group = await Group.findById(groupId)
      .populate('createdBy', 'firstName lastName email')
      .populate('members', 'firstName lastName email');

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (!group.members.some(member => member._id.toString() === userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(group);
  } catch (error) {
    console.error('Error fetching group details:', error);
    res.status(500).json({ error: 'Failed to fetch group details' });
  }
};

// Add member to group
exports.addMember = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;
    const requesterId = req.user.userId;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (group.createdBy.toString() !== requesterId) {
      return res.status(403).json({ error: 'Only group creator can add members' });
    }

    if (group.members.includes(userId)) {
      return res.status(400).json({ error: 'User is already a member' });
    }

    group.members.push(userId);
    await group.save();

    const updatedGroup = await Group.findById(groupId)
      .populate('createdBy', 'firstName lastName email')
      .populate('members', 'firstName lastName email');

    res.json(updatedGroup);
  } catch (error) {
    console.error('Error adding member:', error);
    res.status(500).json({ error: 'Failed to add member' });
  }
};

// Remove member from group
exports.removeMember = async (req, res) => {
  try {
    const { groupId, userId } = req.params;
    const requesterId = req.user.id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Only group creator or the member themselves can remove
    if (group.createdBy.toString() !== requesterId && userId !== requesterId) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    // Can't remove group creator
    if (userId === group.createdBy.toString()) {
      return res.status(400).json({ error: 'Cannot remove group creator' });
    }

    group.members = group.members.filter(member => member.toString() !== userId);
    await group.save();

    const updatedGroup = await Group.findById(groupId)
      .populate('createdBy', 'firstName lastName email')
      .populate('members', 'firstName lastName email');

    res.json(updatedGroup);
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

    const users = await User.find({
      $or: [
        { firstName: { $regex: query, $options: 'i' } },
        { lastName: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    })
    .select('firstName lastName email')
    .limit(10);

    res.json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: 'Search failed' });
  }
};

// Leave group
exports.leaveGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Group creator cannot leave (they need to transfer ownership or delete group)
    if (group.createdBy.toString() === userId) {
      return res.status(400).json({ error: 'Group creator cannot leave. Transfer ownership or delete the group.' });
    }

    group.members = group.members.filter(member => member.toString() !== userId);
    await group.save();

    res.json({ message: 'Left group successfully' });
  } catch (error) {
    console.error('Error leaving group:', error);
    res.status(500).json({ error: 'Failed to leave group' });
  }
};