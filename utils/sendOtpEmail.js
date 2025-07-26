require('dotenv').config();
const nodemailer = require('nodemailer');

async function sendOtpEmail(email, otp) {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.verify();

    const mailOptions = {
      from: `"UniChat Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your OTP Code for UniChat',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #2e6da4;">🎓 Welcome to UniChat!</h2>
          <p>Hello 👋,</p>
          <p>You're one step away from accessing your student dashboard.</p>
          <p style="font-size: 16px;">Please enter the following OTP code:</p>
          <div style="font-size: 28px; font-weight: bold; background: #f2f2f2; padding: 15px; text-align: center; border-radius: 5px; letter-spacing: 4px; color: #333;">
            ${otp}
          </div>
          <p>This code is valid for <b>10 minutes</b>. Please do not share it with anyone.</p>
          <p>If you didn’t request this, you can safely ignore this email.</p>
          <br />
          <p>Cheers,<br/>The UniChat Team</p>
          <hr />
          <p style="font-size: 12px; color: #aaa;">Need help? Reply to this email or visit our support page.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Please check your email for OTP ", info.response);
    return info;
    
  } catch (error) {
    console.error("Failed to send OTP email:", error.message);
    throw error;
  }
}

module.exports = sendOtpEmail;
