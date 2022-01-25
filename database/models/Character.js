const mongoose = require('mongoose');

module.exports = mongoose.model('Character', {
    steamid: String, // steamid of user who created the character
    ped: String,
    name: String,
    health: Number,
});
