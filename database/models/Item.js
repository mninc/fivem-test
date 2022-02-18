const mongoose = require('mongoose');

module.exports = mongoose.model('Item', {
    item_id: String,
    ammo: Number // optional
});
