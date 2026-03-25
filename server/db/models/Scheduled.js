const { Schema, model, models } = require("mongoose");

const ScheduledDateSchema = new Schema({
    day: {type: Date, required: true},
    students: [{type: Schema.Types.ObjectId, ref: 'UserInfo'}],
    availability: {type: Number, required: true, default: -1, min: -1},
    addedAt: {type: String, required: true},
    editedAt: {type: Number, required: true},
});

const ScheduledLessonSchema = new Schema({
    dates: [{type: ScheduledDateSchema}],
    lock: {type: Boolean, required: false, default: false},
    exclude: [{type: Schema.Types.ObjectId, ref: 'UserInfo'}],
    addedAt: {type: String, required: true},
    editedAt: {type: Number, required: true},
});

const ScheduledLesson = models.ScheduledLesson || model('ScheduledLesson', ScheduledLessonSchema);

module.exports = { ScheduledDateSchema, ScheduledLesson };