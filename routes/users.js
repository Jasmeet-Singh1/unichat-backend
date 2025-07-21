const express = require('express');
const router = express.Router();
const { updateUserProfile } = require('../controllers/userController');
//const auth = require('../middleware/auth');   ADD THIS WHEN AUTHENTICATION IS IMPLEMENTED.
//temporary is
router.put('/profile', updateUserProfile);

//when authentication is ready
//router.put('/profile', auth, updateUserProfile);

const User = require('../models/User');
const Otp = require('../models/OTP');
const sendOtpEmail = require('../utils/sendOtpEmail');

// Register and send OTP
router.post('/register', async (req, res) => {
  const { email } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await Otp.findOneAndUpdate({ email }, { otp, createdAt: new Date() }, { upsert: true });

    await sendOtpEmail(email, otp);

    res.status(200).json({ message: 'OTP sent to email' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
});

module.exports = router;
