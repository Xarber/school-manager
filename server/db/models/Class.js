const { Schema, model, models } = require("mongoose");
const { WeekScheduleSchema } = require("./ScheduleHour");

const ClassSchema = new Schema({
    classid: {type: String, required: true, unique: true},
    name: {type: String, required: true},
    teachers: [{type: Schema.Types.ObjectId, ref: 'UserInfo'}],
    students: [{type: Schema.Types.ObjectId, ref: 'UserInfo'}],
    schedule: [{type: WeekScheduleSchema, required: true}],
    comunications: [{type: Schema.Types.ObjectId, ref: 'Comunication'}],
    materials: [{type: Schema.Types.ObjectId, ref: 'Material'}],
    homework: [{type: Schema.Types.ObjectId, ref: 'Homework'}],
    lessons: [{type: Schema.Types.ObjectId, ref: 'Lesson'}],
    subjects: [{type: Schema.Types.ObjectId, ref: 'Subject'}],
    notes: [String],
    addedAt: {type: String, required: true},
    editedAt: {type: Number, required: true},
});

const Class = models.Class || model('Class', ClassSchema);

module.exports = { Class };