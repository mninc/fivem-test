const mongoose = require('mongoose');

const containerSizes = {
    inventory: 10,
    dumpster: 10
}

const schema = new mongoose.Schema({
    type: { type: String, enum: [ "inventory", "dumpster" ] },
    identifier: String, // eg steamid
    name: String,
    description: String,
    items: [ [ String ] ], // 2d array of _ids
});
schema.methods.setItems = function() {
    this.items = [];
    for (let i = 0; i < containerSizes[this.type]; i++) {
        this.items.push([]);
    }
};
module.exports = mongoose.model('Container', schema);
