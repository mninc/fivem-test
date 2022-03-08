const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    task_type: { type: String, enum: ["boost"] },
    cid: String, // character the task is for
    current_step: Number,
    started: Date,
    in_progress: Boolean,
    complete: Boolean,

    // boost
    vehicle: Number,
});

schema.methods.generateSteps = function () {
    let steps = [];
    if (this.task_type === "boost") {
        steps = [
            {
                heading: "Find and steal the car"
            }, {
                heading: "Take the car to the drop off spot"
            }, {
                heading: "Leave the area"
            }
        ];
    }

    for (let i = 0; i < steps.length; i++) {
        let step = steps[i];
        if (this.complete) {
            step.state = 2;
        } else if (this.current_step < i) { // not yet done
            step.state = 0;
        } else if (this.current_step === i) { // in progress
            step.state = 1;
        } else { // done
            step.state = 2;
        }
    }

    return steps;
};

module.exports = mongoose.model('Task', schema);
