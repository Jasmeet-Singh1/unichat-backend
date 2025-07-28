// DO NOT UNCOMMENT UNTIL AND UNLESS TESTED - harleen


/*const crypto = require('crypto');
const User = require('../models/user');
const sendResetEmail = require('../utils/sendResetEmail'); 
const bcrypt = require('bcrypt');

// Request password reset
exports.requestPasswordReset = async (req, res) => {

    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ 
         msg: 'User not found' 
        });

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');

        // Set token and expiry
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; 
        await user.save();

        // Prepare reset URL (frontend link + token)
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

        // Send email (you can customize this function or create a new one for reset)
        await sendOtpEmail(email, `Please reset your password using this link: ${resetUrl}`);

        res.status(200).json({ msg: 'Password reset email sent.' });
    } 
    
    catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error sending password reset email.' });
    }
};

// Reset password using token
exports.resetPassword = async (req, res) => {

    const { token } = req.params;
    const { password } = req.body;

    try {
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }, // check not expired
        });

        if (!user) return res.status(400).json({ msg: 'Invalid or expired password reset token.' });

        // Hash new password (the pre-save hook will do it)
        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.status(200).json({ msg: 'Password has been reset successfully.' });
    } 
    
    catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Failed to reset password.' });
    }
}; */
