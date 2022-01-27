const mongoose = require('mongoose');

module.exports = mongoose.model('BankTransaction', {
    accountNumber: Number,
    amount: Number,
    direction: {
        type: String,
        enum: [ "incoming", "outgoing" ]
    },
    transactionType: {
        type: String,
        enum: [ "withdraw", "deposit", "transfer" ]
    },
    otherAccountNumber: Number, // can be undefined, ie in cash withdrawl
    at: Date
});
