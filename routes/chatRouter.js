const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");

// Group routes
router.post("/groups", chatController.createGroup);
router.get("/groups/:id", chatController.getGroupById);

// Group messages routes
router.post("/groups/messages", chatController.addGroupMessage);
router.get("/groups/:groupId/messages", chatController.getGroupMessages);

// Direct message routes
router.post("/direct-messages", chatController.sendDirectMessage);
router.get("/direct-messages/:user1/:user2", chatController.getDirectMessages);
// Add these to your existing chatRouter.js
router.get("/conversations", chatController.getConversations);
router.get("/messages/:chatId", chatController.getMessagesForChat);
router.post("/messages", chatController.sendMessage);
// Mark single message as read
router.post('/messages/:messageId/read', chatController.markMessageAsRead);

// Mark all messages in chat as read  
router.post('/chats/:chatId/read', chatController.markChatAsRead);
module.exports = router;
