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
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.userId; // Using your existing JWT structure
    console.log('getConversations called for user:', userId);
    
    // Get current user info
    const currentUser = await getUserById(userId);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get user's groups
    const groups = await Group.find({ members: userId })
      .sort({ updatedAt: -1 });

    console.log('Found groups:', groups.length);

    // Get user's direct message conversations
    const directMessages = await DirectMessage.find({
      $or: [{ sender: userId }, { receiver: userId }]
    }).sort({ timestamp: -1 });

    console.log('Found direct messages:', directMessages.length);

    // Create conversations array
    const conversations = [];

    // Add groups
    for (const group of groups) {
      const lastMessage = await GroupMessage.findOne({ groupId: group._id })
        .sort({ timestamp: -1 });
      
      let lastMessageSender = null;
      if (lastMessage) {
        lastMessageSender = await getUserById(lastMessage.sender);
      }

      // Get group members info
      const membersInfo = [];
      for (const memberId of group.members) {
        const memberUser = await getUserById(memberId);
        if (memberUser) {
          membersInfo.push({
            id: memberUser._id,
            firstName: memberUser.firstName,
            lastName: memberUser.lastName || '',
            email: memberUser.email,
            name: `${memberUser.firstName} ${memberUser.lastName || ''}`.trim(),
            avatar: null
          });
        }
      }

      conversations.push({
        id: group._id,
        name: group.name,
        type: 'group',
        members: membersInfo,
        avatar: null,
        description: group.description,
        lastMessage: lastMessage ? {
          text: lastMessage.message,
          timestamp: lastMessage.timestamp,
          senderId: lastMessage.sender,
          senderName: lastMessageSender ? `${lastMessageSender.firstName} ${lastMessageSender.lastName || ''}`.trim() : 'Unknown'
        } : null,
        updatedAt: group.updatedAt || group.createdAt,
        unreadCount: 0,
        pinned: false,
        muted: false,
        archived: false
      });
    }

    // Add direct message conversations
    const directChats = new Map();
    
    for (const dm of directMessages) {
      const otherUserId = dm.sender.toString() === userId ? dm.receiver : dm.sender;
      const sender = await getUserById(dm.sender);
      const receiver = await getUserById(dm.receiver);
      const otherUser = dm.sender.toString() === userId ? receiver : sender;
      
      if (!otherUser) continue;
      
      const chatId = `direct_${Math.min(userId, otherUserId)}_${Math.max(userId, otherUserId)}`;
      
      if (!directChats.has(otherUserId.toString()) || 
          new Date(dm.timestamp) > new Date(directChats.get(otherUserId.toString()).lastMessage.timestamp)) {
        
        directChats.set(otherUserId.toString(), {
          id: chatId,
          name: `${otherUser.firstName} ${otherUser.lastName || ''}`.trim(),
          type: 'direct',
          members: [
            { 
              id: userId,
              name: `${currentUser.firstName} ${currentUser.lastName || ''}`.trim(),
              firstName: currentUser.firstName,
              lastName: currentUser.lastName || '',
              email: currentUser.email,
              avatar: null
            },
            { 
              id: otherUser._id, 
              name: `${otherUser.firstName} ${otherUser.lastName || ''}`.trim(),
              firstName: otherUser.firstName,
              lastName: otherUser.lastName || '',
              email: otherUser.email,
              avatar: null
            }
          ],
          avatar: null,
          lastMessage: {
            text: dm.message,
            timestamp: dm.timestamp,
            senderId: dm.sender,
            senderName: sender ? `${sender.firstName} ${sender.lastName || ''}`.trim() : 'Unknown'
          },
          updatedAt: dm.timestamp,
          unreadCount: 0,
          pinned: false,
          muted: false,
          archived: false
        });
      }
    }

    conversations.push(...Array.from(directChats.values()));

    // Sort by most recent activity
    conversations.sort((a, b) => {
      const aTime = new Date(a.lastMessage?.timestamp || a.updatedAt || 0);
      const bTime = new Date(b.lastMessage?.timestamp || b.updatedAt || 0);
      return bTime - aTime;
    });

    console.log('Returning conversations:', conversations.length);
    res.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
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
exports.sendMessage = async (req, res) => {
  try {
    const { chatId, text, type = 'text', attachments = [] } = req.body;
    const senderId = req.user.userId;
    console.log('sendMessage called:', { chatId, senderId, text: text.substring(0, 50) + '...' });

    let savedMessage;
    let sender = await getUserById(senderId);

    if (chatId.startsWith('direct_')) {
      // Direct message
      const [_, user1, user2] = chatId.split('_');
      const receiverId = user1 === senderId ? user2 : user1;

      const directMessage = new DirectMessage({
        sender: senderId,
        receiver: receiverId,
        message: text,
        timestamp: new Date(),
        attachments: attachments
      });

      savedMessage = await directMessage.save();

      // Create notification (your existing logic)
      await Notification.create({
        userId: receiverId,
        type: "message",
        message: "You have a new direct message.",
        relatedId: savedMessage._id,
        relatedModel: "directMessage",
      });

    } else {
      // Group message
      const groupMessage = new GroupMessage({
        groupId: chatId,
        sender: senderId,
        message: text,
        timestamp: new Date(),
        attachments: attachments
      });

      savedMessage = await groupMessage.save();

      // Notify group members (your existing logic)
      const group = await Group.findById(chatId);
      if (group) {
        const recipientIds = group.members.filter((id) => id.toString() !== senderId);

        const notifications = recipientIds.map((userId) => ({
          userId,
          type: "message",
          message: `New group message in ${group.name}`,
          relatedId: savedMessage._id,
          relatedModel: "groupMessage",
        }));

        await Notification.insertMany(notifications);
      }
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

    console.log('Message saved successfully');
    res.status(201).json(responseMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: error.message });
  }
};