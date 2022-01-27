const mongoose = require('mongoose');

module.exports = mongoose.model('BankAccount', {
    owner: Number, // cid
    access: [ Number ], // array of cids
    balance: Number,
    id: Number,
    type: {
        type: String,
        enum: [ "personal" ]
    }
});
