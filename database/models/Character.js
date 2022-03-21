const mongoose = require('mongoose');

module.exports = mongoose.model('Character', {
    steamid: String, // steamid of user who created the character
    playerServerId: Number, // server ID of the player. ideally only set when they're currently on this character
    ped: String,
    name: String,
    health: Number,
    created: Date,
    cid: Number,
    cash: Number,
    phoneNumber: Number,
    variations: {
        ped: [ [ Number ] ],
        pedProp: [ [ Number ] ]
    },
});
