const Mentor = require('../models/mentor');
const nodemailer = require('nodemailer');
const config = require('config');

// Get all mentors pending approval
const getPendingMentors = async (req, res) => {
  try {
    const pendingMentors = await Mentor.find({ isPendingApproval: true });
    res.status(200).json(pendingMentors);
  } catch (error) {
    console.error('Error fetching pending mentors:', error);
    res.status(500).json({ error: 'Server error fetching pending mentors' });
  }
};
// Get details of one mentor by ID
const getMentorById = async (req, res) => {
  try {
    const mentor = await Mentor.findById(req.params.id);
    if (!mentor)
      return res.status(404).json({
        error: 'Mentor not found',
      });
    res.status(200).json(mentor);
  } catch (error) {
    console.error('Error fetching mentor details:', error);
    res.status(500).json({ error: 'Server error fetching mentor details' });
  }
};

// SMTP(Simple Mail Transfer Protocol) setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const approveMentor = async (req, res) => {
  try {
    const mentorId = req.params.id;
    const mentor = await Mentor.findById(mentorId);

    if (!mentor) return res.status(404).json({ error: 'Mentor not found' });

    mentor.isApproved = true;
    mentor.isPendingApproval = false;
    await mentor.save();

    // Only send email if valid kpu student email
    if (mentor.email.toLowerCase().endsWith('@student.kpu.ca')) {
      const mailOptions = {
        from: config.get('emailUser'),
        to: mentor.email,
        subject: 'Mentor Account Approved',
        text: `Hello ${mentor.firstName},\n\n
            Your mentor account has been approved! You can now log in to your account.
            \n\nBest regards,
            \nUniChat Team`,
      };

      transporter.sendMail(mailOptions, (err, info) => {
        if (err) console.error('Error sending approval email:', err);
        else console.log('Approval email sent:', info.response);
      });
    }
    res.json({ message: 'Mentor approved successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while approving mentor.' });
  }
};

const rejectMentor = async (req, res) => {
  try {
    const mentorId = req.params.id;
    const { reason } = req.body;

    const mentor = await Mentor.findById(mentorId);

    if (!mentor) return res.status(404).json({ error: 'Mentor not found' });

    mentor.isApproved = false;
    mentor.isPendingApproval = false;
    await mentor.save();

    if (mentor.email.toLowerCase().endsWith('@student.kpu.ca')) {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: mentor.email,
        subject: 'Mentor Account Rejected',
        text: `Hello ${mentor.firstName},\n\n

            We regret to inform you that your mentor
            account application has been rejected for the following reason(s):
            \n${reason}\n
            If you believe this was a mistake, please contact the UniChat support team.
            \n\nBest regards,
            \nUniChat Team`,
      };

      transporter.sendMail(mailOptions, (err, info) => {
        if (err) console.error('Error sending rejection email:', err);
        else console.log('Rejection email sent:', info.response);
      });
    }

    res.json({ message: 'Mentor rejected and notified successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while rejecting mentor.' });
  }
};

module.exports = { approveMentor, rejectMentor, getPendingMentors, getMentorById };
