// routes/chat.js - Updated to use real database collections
const express = require('express');
const router = express.Router();
const DirectMessage = require('../models/directMess');
const GroupMessage = require('../models/groupMess');
const Group = require('../models/group');
const User = require('../models/user');

// GET /api/chat/conversations - Get user's conversations
router.get('/conversations', async (req, res) => {
  try {
    const userId = req.user?.id || 'currentUser'; // From JWT middleware when implemented
    
    // Get direct message conversations
    const directMessages = await DirectMessage.find({
      $or: [
        { sender: userId },
        { receiver: userId }
      ]
    })
    .populate('sender', 'firstName lastName username role')
    .populate('receiver', 'firstName lastName username role')
    .sort({ timestamp: -1 });

    // Get group conversations user is part of
    const userGroups = await Group.find({
      members: userId
    }).populate('members', 'firstName lastName username role');

    // Format direct conversations
    const directConversations = [];
    const processedUsers = new Set();

    directMessages.forEach(msg => {
      const otherUser = msg.sender._id.toString() === userId ? msg.receiver : msg.sender;
      const otherUserId = otherUser._id.toString();
      
      if (!processedUsers.has(otherUserId)) {
        processedUsers.add(otherUserId);
        directConversations.push({
          id: `direct_${otherUserId}`,
          type: 'direct',
          name: `${otherUser.firstName} ${otherUser.lastName}`,
          avatar: `/avatars/${otherUser.username}.jpg`,
          lastMessage: {
            text: msg.message,
            timestamp: msg.timestamp,
            senderId: msg.sender._id.toString()
          },
          members: [
            {
              id: userId,
              name: 'You',
              role: 'current'
            },
            {
              id: otherUser._id.toString(),
              name: `${otherUser.firstName} ${otherUser.lastName}`,
              role: otherUser.role,
              avatar: `/avatars/${otherUser.username}.jpg`
            }
          ],
          unreadCount: 0 // Calculate this based on your read tracking
        });
      }
    });

    // Format group conversations
    const groupConversations = await Promise.all(
      userGroups.map(async (group) => {
        // Get latest message for this group
        const latestMessage = await GroupMessage.findOne({
          groupId: group._id.toString()
        })
        .populate('sender', 'firstName lastName username')
        .sort({ timestamp: -1 });

        return {
          id: group._id.toString(),
          type: 'group',
          name: group.name,
          description: group.description,
          avatar: `/group-avatars/${group.name.toLowerCase().replace(/\s+/g, '-')}.jpg`,
          lastMessage: latestMessage ? {
            text: latestMessage.message,
            timestamp: latestMessage.timestamp,
            senderId: latestMessage.sender._id.toString(),
            senderName: `${latestMessage.sender.firstName} ${latestMessage.sender.lastName}`
          } : null,
          members: group.members.map(member => ({
            id: member._id.toString(),
            name: `${member.firstName} ${member.lastName}`,
            role: member.role,
            avatar: `/avatars/${member.username}.jpg`
          })),
          unreadCount: 0 // Calculate based on the read tracking
        };
      })
    );

    const allConversations = [...directConversations, ...groupConversations]
      .sort((a, b) => {
        const aTime = new Date(a.lastMessage?.timestamp || 0);
        const bTime = new Date(b.lastMessage?.timestamp || 0);
        return bTime - aTime;
      });

    res.json(allConversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// GET /api/chat/messages/:chatId - Get messages for a specific chat
router.get('/messages/:chatId', async (req, res) => {
  try {
    const { chatId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    let messages = [];

    if (chatId.startsWith('direct_')) {
      // Direct message conversation
      const otherUserId = chatId.replace('direct_', '');
      const currentUserId = req.user?.id || 'currentUser';

      messages = await DirectMessage.find({
        $or: [
          { sender: currentUserId, receiver: otherUserId },
          { sender: otherUserId, receiver: currentUserId }
        ]
      })
      .populate('sender', 'firstName lastName username role')
      .populate('receiver', 'firstName lastName username role')
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(skip);

    } else {
      // Group message conversation
      messages = await GroupMessage.find({
        groupId: chatId
      })
      .populate('sender', 'firstName lastName username role')
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(skip);
    }

    // Format messages for frontend
    const formattedMessages = messages.reverse().map(msg => ({
      id: msg._id.toString(),
      text: msg.message,
      senderId: msg.sender._id.toString(),
      senderName: `${msg.sender.firstName} ${msg.sender.lastName}`,
      senderAvatar: `/avatars/${msg.sender.username}.jpg`,
      senderRole: msg.sender.role,
      timestamp: msg.timestamp,
      chatId: chatId,
      type: "text",
      likes: msg.likes || [],
      likeCount: msg.likes ? msg.likes.length : 0
    }));

    res.json(formattedMessages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// POST /api/chat/messages - Send a new message
router.post('/messages', async (req, res) => {
  try {
    const { chatId, text, type = 'text' } = req.body;
    const senderId = req.user?.id || 'currentUser'; // From JWT middleware

    let savedMessage;

    if (chatId.startsWith('direct_')) {
      // Direct message
      const receiverId = chatId.replace('direct_', '');
      
      const directMessage = new DirectMessage({
        sender: senderId,
        receiver: receiverId,
        message: text,
        timestamp: new Date()
      });

      savedMessage = await directMessage.save();
      await savedMessage.populate('sender', 'firstName lastName username role');
      await savedMessage.populate('receiver', 'firstName lastName username role');

    } else {
      // Group message
      const groupMessage = new GroupMessage({
        groupId: chatId,
        sender: senderId,
        message: text,
        timestamp: new Date()
      });

      savedMessage = await groupMessage.save();
      await savedMessage.populate('sender', 'firstName lastName username role');
    }

    // Format response
    const formattedMessage = {
      id: savedMessage._id.toString(),
      text: savedMessage.message,
      senderId: savedMessage.sender._id.toString(),
      senderName: `${savedMessage.sender.firstName} ${savedMessage.sender.lastName}`,
      senderAvatar: `/avatars/${savedMessage.sender.username}.jpg`,
      timestamp: savedMessage.timestamp,
      chatId,
      type: 'text'
    };

    res.status(201).json(formattedMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// GET /api/chat/users - Get available users to chat with (with role-based filtering)
router.get('/users', async (req, res) => {
  try {
    const currentUserId = req.user?.id || 'currentUser';
    const currentUser = await User.findById(currentUserId);
    
    if (!currentUser) {
      return res.status(404).json({ error: 'Current user not found' });
    }

    let availableUsers = [];

    // Role-based filtering logic
    if (currentUser.role === 'Student') {
      // Students can chat with: other students, mentors, alumni (if connected)
      availableUsers = await User.find({
        _id: { $ne: currentUserId },
        role: { $in: ['Student', 'Mentor'] }
        // TODO: Add alumni connection check
      });
    } else if (currentUser.role === 'Mentor') {
      // Mentors can chat with: students, other mentors, alumni (if connected)
      availableUsers = await User.find({
        _id: { $ne: currentUserId },
        role: { $in: ['Student', 'Mentor'] }
        // TODO: Add alumni connection check
      });
    } else if (currentUser.role === 'Alumni') {
      // Alumni can chat with: other alumni, connected students/mentors
      availableUsers = await User.find({
        _id: { $ne: currentUserId },
        role: 'Alumni'
        // TODO: Add connection-based filtering for students/mentors
      });
    } else if (currentUser.role === 'Admin') {
      // Admins can chat with everyone
      availableUsers = await User.find({
        _id: { $ne: currentUserId }
      });
    }

    // Format users for frontend
    const formattedUsers = availableUsers.map(user => ({
      id: user._id.toString(),
      name: `${user.firstName} ${user.lastName}`,
      username: user.username,
      role: user.role,
      avatar: `/avatars/${user.username}.jpg`,
      online: false // TODO: Implement online status tracking
    }));

    res.json(formattedUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST /api/chat/groups - Create a new group chat
router.post('/groups', async (req, res) => {
  try {
    const { name, description, memberIds } = req.body;
    const creatorId = req.user?.id || 'currentUser';

    const newGroup = new Group({
      name,
      description,
      createdBy: creatorId,
      members: [creatorId, ...memberIds],
      isPrivate: true,
      createdAt: new Date()
    });

    const savedGroup = await newGroup.save();
    await savedGroup.populate('members', 'firstName lastName username role');

    res.status(201).json({
      id: savedGroup._id.toString(),
      name: savedGroup.name,
      description: savedGroup.description,
      members: savedGroup.members.map(member => ({
        id: member._id.toString(),
        name: `${member.firstName} ${member.lastName}`,
        role: member.role
      }))
    });
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ error: 'Failed to create group' });
  }
});

module.exports = router;