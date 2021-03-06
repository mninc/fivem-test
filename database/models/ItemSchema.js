const mongoose = require('mongoose');

module.exports = mongoose.model('ItemSchema', {
    item_id: String,
    icon: String,
    name: String,
    description: String,
    type: { type: String, enum: [ "weapon", "consumable", "equipment", "ammo" ] },
    weapon_hash: String,
    stackable: Boolean,
    consumable: {
        stat: String,
        value: Number
    },
});
