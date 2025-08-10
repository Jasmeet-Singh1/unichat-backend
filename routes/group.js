const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');

// Create a new group
router.post('/', groupController.createGroup);

// Get all groups for current user
router.get('/', groupController.getUserGroups);

// Search users for adding to groups
router.get('/search/users', groupController.searchUsers);

// Get specific group details
router.get('/:groupId', groupController.getGroupDetails);

// Edit group details
router.put('/:groupId', groupController.editGroup);

// Delete group
router.delete('/:groupId', groupController.deleteGroup);

// Get group messages
router.get('/:groupId/messages', groupController.getGroupMessages);

// Send message to group
router.post('/:groupId/messages', groupController.sendGroupMessage);

// Add member to group
router.post('/:groupId/members', groupController.addMember);

// Remove member from group
router.delete('/:groupId/members/:userId', groupController.removeMember);

// Leave group
router.post('/:groupId/leave', groupController.leaveGroup);

module.exports = router;