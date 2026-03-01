const { Schema, model, models } = require("mongoose");

const LessonSchema = new Schema({
    title: {type: String, required: true},
    description: {type: String, required: true},
    date: {type: String, required: true},
    time: {type: String, required: true},
    teacher: {type: Schema.Types.ObjectId, ref: 'UserInfo', required: true},
    room: {type: String, required: false},
    material: [{type: Schema.Types.ObjectId, ref: 'Material'}],
    scheduled: {type: Boolean, required: false, default: false},
    isExam: {type: Boolean, required: false, default: false},
    addedAt: {type: String, required: true},
    editedAt: {type: Number, required: true},
});

const Lesson = models.Lesson || model('Lesson', LessonSchema);

module.exports = { Lesson };