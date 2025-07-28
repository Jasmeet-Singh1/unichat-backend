//DRAFT
//DO NOT UNCOMMENT


/*const nodemailer = require('nodemailer');

const sendResetEmail = async (email, message) => {

    const transporter = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: `"UniChat Support" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Reset Password ',
        text: `Your OTP for password reset is: ${otp}. It will expire in 10 minutes.`,
    };

    await transporter.sendMail(mailOptions);
};
*/
