const mongoose = require('mongoose');

module.exports = mongoose.model('TextMessage', {
    from: Number,
    to: Number,
    at: Date,
    content: String
});
