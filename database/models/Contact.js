const mongoose = require('mongoose');

module.exports = mongoose.model('Contact', {
    phoneBook: Number, // number of the character whose 'phonebook' this number is saved in
    phoneNumber: Number,
    name: String,
});
