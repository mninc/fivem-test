const mongoose = require('mongoose');

module.exports = mongoose.model('Task', {
    task_type: { type: String, enum: ["boost"] },
    owner_cid: Number, // character the task was started by
    characters: [ Number ], // characters helping with the task
    current_step: Number,
    started: Date,
    in_progress: Boolean,
    complete: Boolean,

    // boost
    vehicle: {
        coords: [ Number ],
        model: String,
        netID: Number,
        colours: {
            primary: Number,
            secondary: Number
        },
        blipID: Number
    },
});
