const mongoose = require('mongoose');

module.exports = mongoose.model('Vehicle', {
    owner: Number, // cid
    garage: Number,
    model: String,
    plate: String,
    saleHistory: [
        {
            at: Date, // some stuff about vehicle transfers in the future, for now just the date it was bought
        }
    ],
    netID: Number, // current vehicle network id, or -1 if parked
});
