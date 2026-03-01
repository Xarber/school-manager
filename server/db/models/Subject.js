const { Schema, model, models } = require("mongoose");
const { WeekScheduleSchema } = require("./ScheduleHour");

const SubjectSchema = new Schema({
    name: {type: String, required: true},
    teacher: [{type: Schema.Types.ObjectId, ref: 'UserInfo', required: true}],
    maxgrade: {type: Number, required: true},
    gradeType: {type: String, required: false, enum: ['letter', 'percentage', 'points'], default: 'percentage'},
    homework: [{type: Schema.Types.ObjectId, ref: 'Homework'}],
    lessons: [{type: Schema.Types.ObjectId, ref: 'Lesson'}],
    material: [{type: Schema.Types.ObjectId, ref: 'Material'}],
    addedAt: {type: String, required: true},
    editedAt: {type: Number, required: true},
});

const Subject = models.Subject || model('Subject', SubjectSchema);

module.exports = { Subject };