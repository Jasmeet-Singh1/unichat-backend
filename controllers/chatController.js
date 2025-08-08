const Group = require("../models/group");
const DirectMessage = require("../models/directMess");
const GroupMessage = require("../models/groupMess");
const Notification = require("../models/notification"); // <== NEW
const User = require("../models/user");
const Student = require("../models/student");
const Mentor = require("../models/mentor");
const Alumni = require("../models/alumni");

// Helper function to get user from any role collection
const getUserById = async (userId) => {
  let user = 
    (await Student.findById(userId)) ||
    (await Mentor.findById(userId)) ||
    (await Alumni.findById(userId));
  return user;
}; 

// --- Group CRUD ---
exports.createGroup = async (req, res) => {
  try {
    const { name, description, members, createdBy, isPrivate } = req.body;

    if (!name || !createdBy)
      return res.status(400).json({ error: "Name and createdBy are required" });

    const group = new Group({
      name,
      description,
      members: members || [],
      createdBy,
      isPrivate: isPrivate !== undefined ? isPrivate : true,
    });

    await group.save();
    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getGroupById = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate({ path: "members", model: "User", select: "firstName lastName email" })
      .populate({ path: "createdBy", model: "User", select: "firstName lastName email" });

    if (!group) return res.status(404).json({ error: "Group not found" });

    res.json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- Group Messages ---
exports.addGroupMessage = async (req, res) => {
  try {
    const { groupId, sender, message } = req.body;

    if (!groupId || !sender || !message)
      return res.status(400).json({ error: "groupId, sender and message are required" });

    const groupMessage = new GroupMessage({
      groupId,
      sender,
      message,
      timestamp: new Date(),
    });

    await groupMessage.save();

    // 🔔 Notify all group members (except the sender)
    const group = await Group.findById(groupId);
    const recipientIds = group.members.filter((id) => id.toString() !== sender);

    const notifications = recipientIds.map((userId) => ({
      userId,
      type: "message",
      message: `New group message in ${group.name}`,
      relatedId: groupMessage._id,
      relatedModel: "groupMessage",
    }));

    await Notification.insertMany(notifications);

    res.status(201).json(groupMessage);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getGroupMessages = async (req, res) => {
  try {
    const groupId = req.params.groupId;

    const messages = await GroupMessage.find({ groupId })
      .populate({ path: "sender", model: "User", select: "firstName lastName email" })
      .sort({ timestamp: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- Direct Messages ---
exports.sendDirectMessage = async (req, res) => {
  try {
    const { sender, receiver, message } = req.body;

    if (!sender || !receiver || !message)
      return res.status(400).json({ error: "sender, receiver and message are required" });

    const directMessage = new DirectMessage({
      sender,
      receiver,
      message,
      timestamp: new Date(),
    });

    await directMessage.save();

    // 🔔 Create a notification for the receiver
    await Notification.create({
      userId: receiver,
      type: "message",
      message: "You have a new direct message.",
      relatedId: directMessage._id,
      relatedModel: "directMessage",
    });

    res.status(201).json(directMessage);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getDirectMessages = async (req, res) => {
  try {
    const { user1, user2 } = req.params;

    const messages = await DirectMessage.find({
      $or: [
        { sender: user1, receiver: user2 },
        { sender: user2, receiver: user1 },
      ],
    })
      .populate({ path: "sender", model: "User", select: "firstName lastName email" })
      .populate({ path: "receiver", model: "User", select: "firstName lastName email" })
      .sort({ timestamp: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get conversations for frontend (NEW - required by frontend)
// Update your getConversations function in chatController.js

// Add this SIMPLE version to your chatController.js to test
exports.getConversations = async (req, res) => {
  try {
    console.log('getConversations called, user:', req.user);
    const userId = req.user.userId; 
    
    console.log('Getting conversations for userId:', userId);
    
    // Get current user info
    const currentUser = await getUserById(userId);
    if (!currentUser) {
      console.error('Current user not found:', userId);
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log('Current user found:', currentUser.firstName);
    
    // For now, let's just get ALL direct messages involving this user
    const directMessages = await DirectMessage.find({
      $or: [{ sender: userId }, { receiver: userId }]
    }).sort({ timestamp: -1 });
    
    console.log('Found direct messages:', directMessages.length);
    
    // Create a simple conversations array
    const conversations = [];
    const processedUsers = new Set();
    
    for (const dm of directMessages) {
      const otherUserId = dm.sender.toString() === userId ? dm.receiver : dm.sender;
      
      // Skip if we already processed this user
      if (processedUsers.has(otherUserId.toString())) continue;
      processedUsers.add(otherUserId.toString());
      
      const otherUser = await getUserById(otherUserId);
      if (!otherUser) continue;
      
      // Create chat ID
      const chatId = userId < otherUserId.toString() 
        ? `direct_${userId}_${otherUserId}`
        : `direct_${otherUserId}_${userId}`;
      
      conversations.push({
        id: chatId,
        name: `${otherUser.firstName} ${otherUser.lastName || ''}`.trim(),
        type: 'direct',
        members: [
          { 
            id: userId,
            name: `${currentUser.firstName} ${currentUser.lastName || ''}`.trim(),
            firstName: currentUser.firstName,
            lastName: currentUser.lastName || '',
            email: currentUser.email
          },
          { 
            id: otherUser._id, 
            name: `${otherUser.firstName} ${otherUser.lastName || ''}`.trim(),
            firstName: otherUser.firstName,
            lastName: otherUser.lastName || '',
            email: otherUser.email
          }
        ],
        lastMessage: {
          text: dm.message,
          timestamp: dm.timestamp,
          senderId: dm.sender,
          senderName: dm.sender.toString() === userId ? currentUser.firstName : otherUser.firstName
        },
        updatedAt: dm.timestamp,
        unreadCount: 0,
        pinned: false,
        muted: false,
        archived: false
      });
    }
    
    console.log('Returning conversations:', conversations.length);
    res.json(conversations);
    
  } catch (error) {
    console.error('Error in getConversations:', error);
    res.status(500).json({ error: error.message });
  }
};
// Get messages for frontend format (NEW - adapts your existing data)
exports.getMessagesForChat = async (req, res) => {
  try {
    const chatId = req.params.chatId;
    console.log('getMessagesForChat called for chatId:', chatId);
    let messages = [];

    if (chatId.startsWith('direct_')) {
      // Direct message chat
      const [_, user1, user2] = chatId.split('_');
      const directMessages = await DirectMessage.find({
        $or: [
          { sender: user1, receiver: user2 },
          { sender: user2, receiver: user1 }
        ]
      }).sort({ timestamp: 1 });

      // Manually populate since users are in different collections
      for (const msg of directMessages) {
        const sender = await getUserById(msg.sender);
        
        messages.push({
          id: msg._id,
          text: msg.message,
          senderId: msg.sender,
          senderName: sender ? `${sender.firstName} ${sender.lastName || ''}`.trim() : 'Unknown',
          senderAvatar: null,
          timestamp: msg.timestamp,
          chatId: chatId,
          type: 'text',
          status: 'sent',
          attachments: msg.attachments || []
        });
      }
    } else {
      // Group message
      const groupMessages = await GroupMessage.find({ groupId: chatId })
        .sort({ timestamp: 1 });

      // Manually populate senders
      for (const msg of groupMessages) {
        const sender = await getUserById(msg.sender);
        
        messages.push({
          id: msg._id,
          text: msg.message,
          senderId: msg.sender,
          senderName: sender ? `${sender.firstName} ${sender.lastName || ''}`.trim() : 'Unknown',
          senderAvatar: null,
          timestamp: msg.timestamp,
          chatId: chatId,
          type: 'text',
          status: 'sent',
          attachments: msg.attachments || []
        });
      }
    }

    console.log('Returning messages:', messages.length);
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: error.message });
  }
};

// Send message for frontend (NEW - adapts your existing methods)
// Send message for frontend (IMPROVED with better validation)
exports.sendMessage = async (req, res) => {
  try {
    const { chatId, text, type = 'text', attachments = [] } = req.body;
    const senderId = req.user.userId;
    console.log('sendMessage called:', { chatId, senderId, text: text?.substring(0, 50) + '...' });

    // Validate input
    if (!chatId) {
      return res.status(400).json({ error: 'Chat ID is required' });
    }
    if (!text || text.trim() === '') {
      return res.status(400).json({ error: 'Message text is required' });
    }

    let savedMessage;
    let sender = await getUserById(senderId);
    
    if (!sender) {
      return res.status(404).json({ error: 'Sender not found' });
    }

    if (chatId.startsWith('direct_')) {
      // Direct message
      const chatParts = chatId.split('_');
      if (chatParts.length !== 3) {
        return res.status(400).json({ error: 'Invalid direct chat ID format' });
      }
      
      const [_, user1, user2] = chatParts;
      
      // Validate that senderId is one of the users in the chat
      if (senderId !== user1 && senderId !== user2) {
        return res.status(403).json({ error: 'Not authorized to send message to this chat' });
      }
      
      const receiverId = user1 === senderId ? user2 : user1;
      
      // Validate receiver exists
      const receiver = await getUserById(receiverId);
      if (!receiver) {
        return res.status(404).json({ error: 'Receiver not found' });
      }

      const directMessage = new DirectMessage({
        sender: senderId,
        receiver: receiverId,
        message: text.trim(),
        timestamp: new Date(),
        attachments: attachments
      });

      savedMessage = await directMessage.save();

      // Create notification (your existing logic)
      await Notification.create({
        userId: receiverId,
        type: "message",
        message: `You have a new direct message from ${sender.firstName}.`,
        relatedId: savedMessage._id,
        relatedModel: "directMessage",
      });

      console.log('Direct message saved:', savedMessage._id);

    } else {
      // Group message
      const group = await Group.findById(chatId);
      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }
      
      // Check if sender is a member of the group
      if (!group.members.includes(senderId)) {
        return res.status(403).json({ error: 'Not authorized to send message to this group' });
      }

      const groupMessage = new GroupMessage({
        groupId: chatId,
        sender: senderId,
        message: text.trim(),
        timestamp: new Date(),
        attachments: attachments
      });

      savedMessage = await groupMessage.save();

      // Notify group members (your existing logic)
      const recipientIds = group.members.filter((id) => id.toString() !== senderId);

      if (recipientIds.length > 0) {
        const notifications = recipientIds.map((userId) => ({
          userId,
          type: "message",
          message: `New group message in ${group.name} from ${sender.firstName}`,
          relatedId: savedMessage._id,
          relatedModel: "groupMessage",
        }));

        await Notification.insertMany(notifications);
      }

      console.log('Group message saved:', savedMessage._id);
    }

    // Format response for frontend
    const responseMessage = {
      id: savedMessage._id,
      text: savedMessage.message,
      senderId: savedMessage.sender,
      senderName: sender ? `${sender.firstName} ${sender.lastName || ''}`.trim() : 'Unknown',
      senderAvatar: null,
      timestamp: savedMessage.timestamp,
      chatId: chatId,
      type: type,
      status: 'sent',
      attachments: savedMessage.attachments || []
    };

    console.log('Message saved successfully, returning response');
    res.status(201).json(responseMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message', details: error.message });
  }
};