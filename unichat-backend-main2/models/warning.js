const mongoose = require('mongoose');
const warningSchema = new mongoose.Schema({

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    
    reason: String,

    issuedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('warning', warningSchema);
