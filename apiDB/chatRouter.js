const express = require("express");
const router = express.Router();
const chatController = require("./chatController");

// Group routes
router.post("/groups", chatController.createGroup);
router.get("/groups/:id", chatController.getGroupById);

// Group messages routes
router.post("/groups/messages", chatController.addGroupMessage);
router.get("/groups/:groupId/messages", chatController.getGroupMessages);

// Direct message routes
router.post("/direct-messages", chatController.sendDirectMessage);
router.get("/direct-messages/:user1/:user2", chatController.getDirectMessages);

module.exports = router;
