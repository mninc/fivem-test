const mongoose = require('mongoose');

module.exports = mongoose.model('Item', {
    icon: String,
    name: String,
    description: String,
    type: { type: String, enum: [ "weapon" ] },
    weapon_hash: String,
    ammo: Number
});
