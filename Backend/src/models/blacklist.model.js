const mongoose = require('mongoose');

const blacklistTokenSchema = new mongoose.Schema({ 
    token: {
        type: String,
        required: [true, "Token is required to add in blacklist"],
    }
},{
    timestamps: true
}) 

const blacklistTokenModel = mongoose.model('blacklistTokens', blacklistTokenSchema);

module.exports = blacklistTokenModel;
