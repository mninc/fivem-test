function save(item, callback) {
    item.save(function(error){
        if (error) console.error(error);
        if (callback) callback();
    });
}
exports.save = save;

function findOne(search, query, fields, options, callback) {
    if (typeof fields === "function") {
        callback = fields;
        fields = null;
        options = {};
    } else if (typeof options === "function") {
        callback = options;
        options = {};
    }

    return new Promise((resolve, reject) => {
        search.findOne(query, fields, options, function(err, returned) {
            if (callback) callback(err, returned);
            else if (err) reject(err);
            else resolve(returned);
        })
    });
}
exports.findOne = findOne;

function findById(search, id, callback) {
    search.findById(id, function(err, returned){
        if (callback) callback(err, returned);
    })
}
exports.findById = findById;

function findByIdAndUpdate(search, id, update, callback) {
    search.findByIdAndUpdate(id, update, function(err, returned) {
        if (callback) callback(err, returned);
    })
}
exports.findByIdAndUpdate = findByIdAndUpdate;

function find(search, query, fields, options, callback) {
    if (typeof fields === "function") {
        callback = fields;
        fields = null;
        options = {};
    } else if (typeof options === "function") {
        callback = options;
        options = {};
    }
    return new Promise((resolve, reject) => {
        search.find(query, fields, options, function (err, returned) {
            if (callback) callback(err, returned);
            else if (err) reject(err);
            else resolve(returned);
        })
    });
}
exports.find = find;

function findOneAndUpdate(search, query, update, options, callback) {
    if (typeof options === "function") {
        callback = options;
        options = {};
    }
    if (!options) options = {};
    return new Promise((resolve, reject) => {
        search.findOneAndUpdate(query, update, options, function(err, returned) {
            if (callback) callback(err, returned);
            else if (err) reject(err);
            else resolve(returned);
        })
    })
}
exports.findOneAndUpdate = findOneAndUpdate;

function update(search, query, changes, callback) {
    search.updateMany(query, changes, function(err, result) {
        if (callback) callback(err, result);
    });
}
exports.update = update;

function count(search, query, callback) {
    search.countDocuments(query, function(err, returned){
        callback(err, returned);
    })
}
exports.count = count;

function deleteOne(search, query, callback) {
    search.deleteOne(query, function(err) {
        if (err) console.error(`delete one: ${err.stack ? err.stack : err}`);
        if (callback) callback(err);
    })
}
exports.deleteOne = deleteOne;

function deleteMany(search, query, callback) {
    search.deleteMany(query, function(err) {
        if (err) console.error(`delete many: ${err.stack ? err.stack : err}`);
        if (callback) callback(err);
    })
}
exports.deleteMany = deleteMany;

exports.models = require('./models/index');
