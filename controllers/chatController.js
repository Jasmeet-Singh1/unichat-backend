const Group = require("../models/group");
const DirectMessage = require("../models/directMess");
const GroupMessage = require("../models/groupMess");
const Notification = require("../models/notification"); // <== NEW
const User = require("../models/user");


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
