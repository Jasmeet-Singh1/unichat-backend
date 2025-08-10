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

// SMTP (Simple Mail Transfer Protocol) setup
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

    // Only send email if valid KPU student email
    if (mentor.email.toLowerCase().endsWith('@student.kpu.ca')) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      
      const mailOptions = {
        from: process.env.EMAIL_USER || config.get('emailUser'),
        to: mentor.email,
        subject: '🎉 Welcome to UniChat - Your Mentor Account is Approved!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 20px;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">🎓 UniChat</h1>
              <p style="color: #e2e8f0; margin: 10px 0 0 0; font-size: 16px;">Student Mentorship Platform</p>
            </div>
            
            <!-- Main Content -->
            <div style="background: white; padding: 40px 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <div style="background: #10b981; color: white; display: inline-block; padding: 10px 20px; border-radius: 25px; font-weight: bold; margin-bottom: 20px;">
                  ✅ ACCOUNT APPROVED
                </div>
              </div>
              
              <h2 style="color: #1f2937; margin-bottom: 20px;">Hello ${mentor.firstName},</h2>
              
              <p style="color: #4b5563; line-height: 1.6; font-size: 16px; margin-bottom: 20px;">
                🎉 <strong>Congratulations!</strong> We're excited to let you know that your mentor account on UniChat has been successfully approved by our team.
              </p>
              
              <p style="color: #4b5563; line-height: 1.6; font-size: 16px; margin-bottom: 30px;">
                You can now log in and start engaging with students, sharing your knowledge, and building meaningful connections in our community.
              </p>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 40px 0;">
                <a href="${frontendUrl}/login" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                  🚀 Login to UniChat
                </a>
              </div>
              
              <!-- Features Box -->
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 30px 0;">
                <h3 style="color: #1f2937; margin-top: 0; margin-bottom: 15px;">As a mentor, you can now:</h3>
                <ul style="color: #4b5563; margin: 0; padding-left: 20px;">
                  <li style="margin-bottom: 8px;">💬 Connect with students seeking guidance</li>
                  <li style="margin-bottom: 8px;">📚 Share your academic expertise</li>
                  <li style="margin-bottom: 8px;">🌟 Participate in community discussions</li>
                  <li style="margin-bottom: 8px;">📅 Set your availability for mentoring sessions</li>
                </ul>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin-top: 30px;">
                If you have any questions or need assistance getting started, feel free to reach out to us at 
                <a href="mailto:devteam.unichat@gmail.com" style="color: #667eea; text-decoration: none;">devteam.unichat@gmail.com</a>.
              </p>
              
              <p style="color: #4b5563; margin-top: 30px; margin-bottom: 0;">
                Thank you for joining us in shaping meaningful connections and supporting student success! 🌟
              </p>
              
              <p style="color: #4b5563; margin-top: 20px; margin-bottom: 0; font-weight: 500;">
                Best regards,<br>
                <span style="color: #667eea; font-weight: bold;">The UniChat Team</span>
              </p>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
              <p style="margin: 0;">© 2025 UniChat - Connecting Students, Building Futures</p>
              <p style="margin: 5px 0 0 0;">Kwantlen Polytechnic University</p>
            </div>
          </div>
        `,
        // Fallback text version
        text: `
🎉 Welcome to UniChat - Your Mentor Account is Approved!

Hello ${mentor.firstName},

Congratulations! We're excited to let you know that your mentor account on UniChat has been successfully approved by our team.

You can now log in and start engaging with students, sharing your knowledge, and building meaningful connections in our community.

🚀 Login here: ${frontendUrl}/login

As a mentor, you can now:
• Connect with students seeking guidance
• Share your academic expertise  
• Participate in community discussions
• Set your availability for mentoring sessions

If you have any questions or need assistance, feel free to reach out to us at devteam.unichat@gmail.com.

Thank you for joining us in shaping meaningful connections and supporting student success!

Best regards,
The UniChat Team

© 2025 UniChat - Connecting Students, Building Futures
Kwantlen Polytechnic University
        `,
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
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: mentor.email,
        subject: '📋 UniChat Application Update',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 20px;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">🎓 UniChat</h1>
              <p style="color: #fecaca; margin: 10px 0 0 0; font-size: 16px;">Student Mentorship Platform</p>
            </div>
            
            <!-- Main Content -->
            <div style="background: white; padding: 40px 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <div style="background: #ef4444; color: white; display: inline-block; padding: 10px 20px; border-radius: 25px; font-weight: bold; margin-bottom: 20px;">
                  📋 APPLICATION UPDATE
                </div>
              </div>
              
              <h2 style="color: #1f2937; margin-bottom: 20px;">Dear ${mentor.firstName},</h2>
              
              <p style="color: #4b5563; line-height: 1.6; font-size: 16px; margin-bottom: 20px;">
                Thank you for your interest in becoming a mentor at UniChat. We appreciate the time and effort you put into your application.
              </p>
              
              <p style="color: #4b5563; line-height: 1.6; font-size: 16px; margin-bottom: 20px;">
                After careful review by our team, we regret to inform you that your mentor registration has not been approved at this time.
              </p>
              
              ${reason ? `
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 0 4px 4px 0;">
                <p style="margin: 0; color: #92400e; font-weight: 500;">Reason provided:</p>
                <p style="margin: 10px 0 0 0; color: #92400e;">${reason}</p>
              </div>
              ` : ''}
              
              <p style="color: #4b5563; line-height: 1.6; font-size: 16px; margin-bottom: 30px;">
                This decision is based on our current requirements and internal criteria. We encourage you to continue developing your skills and experience.
              </p>
              
              <!-- Info Box -->
              <div style="background: #eff6ff; border: 1px solid #dbeafe; padding: 20px; border-radius: 8px; margin: 30px 0;">
                <h3 style="color: #1e40af; margin-top: 0; margin-bottom: 15px;">💡 What's Next?</h3>
                <ul style="color: #1e40af; margin: 0; padding-left: 20px;">
                  <li style="margin-bottom: 8px;">You're welcome to reapply in the future</li>
                  <li style="margin-bottom: 8px;">Consider gaining more experience in your field</li>
                  <li style="margin-bottom: 8px;">You can still join as a student to access resources</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin: 40px 0;">
                <a href="${frontendUrl}/signup" style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 14px; display: inline-block;">
                  🎓 Join as Student
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin-top: 30px;">
                If you believe this is a mistake or have questions about your application, feel free to contact us at 
                <a href="mailto:devteam.unichat@gmail.com" style="color: #3b82f6; text-decoration: none;">devteam.unichat@gmail.com</a>.
              </p>
              
              <p style="color: #4b5563; margin-top: 30px; margin-bottom: 0;">
                We wish you the best in your academic and professional journey! 🌟
              </p>
              
              <p style="color: #4b5563; margin-top: 20px; margin-bottom: 0; font-weight: 500;">
                Best wishes,<br>
                <span style="color: #3b82f6; font-weight: bold;">The UniChat Team</span>
              </p>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
              <p style="margin: 0;">© 2025 UniChat - Connecting Students, Building Futures</p>
              <p style="margin: 5px 0 0 0;">Kwantlen Polytechnic University</p>
            </div>
          </div>
        `,
        // Fallback text version
        text: `
UniChat Application Update

Dear ${mentor.firstName},

Thank you for your interest in becoming a mentor at UniChat. We appreciate the time and effort you put into your application.

After careful review by our team, we regret to inform you that your mentor registration has not been approved at this time.

${reason ? `Reason: ${reason}\n` : ''}

This decision is based on our current requirements and internal criteria. We encourage you to continue developing your skills and experience.

What's Next?
• You're welcome to reapply in the future
• Consider gaining more experience in your field  
• You can still join as a student to access resources

Join as Student: ${frontendUrl}/signup

If you believe this is a mistake or have questions, contact us at devteam.unichat@gmail.com.

We wish you the best in your academic and professional journey!

Best wishes,
The UniChat Team

© 2025 UniChat - Connecting Students, Building Futures
Kwantlen Polytechnic University
        `,
      };

      transporter.sendMail(mailOptions, (err, info) => {
        if (err) console.error('Error sending rejection email:', err);
        else console.log('Rejection email sent:', info.response);
      });

      // Delete user from database
      await Mentor.findByIdAndDelete(mentorId);
    }

    res.json({ message: 'Mentor rejected and notified successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while rejecting mentor.' });
  }
};

module.exports = { approveMentor, rejectMentor, getPendingMentors, getMentorById };