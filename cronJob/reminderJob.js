// /jobs/reminderJob.js
const cron = require('node-cron');
const nodemailer = require('nodemailer');
const Notification = require('../models/notification');
const User = require('../models/user'); // adjust if path differs
const mongoose = require('mongoose');

// Send email using nodemailer
const sendEmail = async (to, subject, text) => {
  let transporter = nodemailer.createTransport({
    service: 'Gmail', // or another service like Outlook, etc.
    auth: {
      user: process.env.EMAIL_USER,     // your email
      pass: process.env.EMAIL_PASS      // app password
    }
  });

  await transporter.sendMail({
    from: `"UniChat" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
  });
};

// Cron job to run every hour (adjustable)
cron.schedule('0 * * * *', async () => {
  console.log('🔁 Running unread message email check...');

  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Find unseen message notifications older than 24 hours
    const oldNotifications = await Notification.find({
      type: 'message',
      seen: false,
      createdAt: { $lte: twentyFourHoursAgo }
    }).populate('userId');

    for (const notif of oldNotifications) {
      const user = notif.userId;

      if (user && user.email) {
        await sendEmail(
          user.email,
          '⏰ You have an unread message on UniChat',
          `Hi ${user.name || 'there'},\n\nYou have a message waiting on UniChat. Don’t leave your peer hanging!\n\nGo check it out now.`
        );
        console.log(`📨 Reminder sent to ${user.email}`);
      }
    }

  } catch (err) {
    console.error('❌ Error in reminder job:', err.message);
  }
});
