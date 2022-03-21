const mongoose = require('mongoose');

const outfit = {
    outfitName: String,
    pedModel: String,
    ped: [[Number]],
    pedProp: [[Number]],
};
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
    walk: String,
    outfits: [ outfit ],
    currentOutfit: outfit,
});
