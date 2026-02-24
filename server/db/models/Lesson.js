const { Schema, model, models } = require("mongoose");

const LessonSchema = new Schema({
    lessonid: {type: String, required: true, unique: true},
    classid: {type: String, required: true},
    subjectid: {type: String, required: true},
    title: {type: String, required: true},
    description: {type: String, required: true},
    date: {type: String, required: true},
    time: {type: String, required: true},
    teacher: {type: Schema.Types.ObjectId, ref: 'UserInfo'},
    room: {type: String, required: false},
    material: [{type: Schema.Types.ObjectId, ref: 'Material'}],
    scheduled: {type: Boolean, required: false, default: false},
    isExam: {type: Boolean, required: false, default: false},
    addedAt: {type: String, required: true},
});

const Lesson = models.Lesson || model('Lesson', LessonSchema);

module.exports = { Lesson };