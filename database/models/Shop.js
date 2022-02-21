const mongoose = require('mongoose');

module.exports = mongoose.model('Shop', {
    id: String,
    items: [
        {
            item_id: String,
            cost: Number
        }
    ]
});
