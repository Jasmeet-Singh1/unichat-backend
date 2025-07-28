const Event = require("../models/event");
const User = require("../models/user");
const nodemailer = require("nodemailer");

exports.createEvent = async (req, res) => {
  try {
    const event = new Event(req.body);
    await event.save();
    res.status(201).json(event);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getEvents = async (req, res) => {
  try {
    const events = await Event.find();
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.registerEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    const user = await User.findById(req.body.userId);

    if (!event || !user) return res.status(404).json({ message: "Event or user not found" });

    if (event.participants.includes(req.body.userId)) {
      return res.status(400).json({ message: "Already registered" });
    }

    if (event.participants.length >= event.rsvpLimit) {
      return res.status(400).json({ message: "Event is full" });
    }

    event.participants.push(req.body.userId);
    await event.save();

    // Send confirmation email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: `Registration Confirmed: ${event.title}`,
      text: `Hi ${user.name},\n\nYou have successfully registered for the event: ${event.title} scheduled on ${event.date.toDateString()}.\n\nThank you!\nUniChat Team`,
    };

    await transporter.sendMail(mailOptions);

    res.json(event);
  } catch (err) {
    res.status(500).json({ message: "Registration failed", error: err.message });
  }
};