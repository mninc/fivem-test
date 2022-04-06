const mongoose = require('mongoose');

const outfit = {
    outfitName: String,
    pedModel: String,
    ped: [[Number]],
    pedProp: [[Number]],
    face: [Number],
    headBlend: {
        shapeFirstID: Number,
        shapeSecondID: Number,
        shapeThirdID: Number,
        skinFirstID: Number,
        skinSecondID: Number,
        skinThirdID: Number,
        shapeMix: Number,
        skinMix: Number,
        thirdMix: Number,
    },
    hairColor: [Number],
    headOverlay: [[Number]],
};
module.exports = mongoose.model('Character', {
    steamid: String, // steamid of user who created the character
    playerServerId: Number, // server ID of the player. ideally only set when they're currently on this character
    name: String,
    health: Number,
    created: Date,
    cid: Number,
    cash: Number,
    phoneNumber: Number,
    walk: String,
    outfits: [outfit],
    currentOutfit: outfit,
    whitelists: [String], // eg police
});
