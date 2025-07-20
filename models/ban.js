const mongoose = require('mongoose');
const banSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },

    bannedAt: { type: Date, default: Date.now },
    reason: String
});

module.exports = mongoose.model('ban', banSchema);
