const { Schema, model, models } = require("mongoose");
const { WeekScheduleSchema } = require("./ScheduleHour");

const ClassSchema = new Schema({
    name: {type: String, required: true, maxlength: [30, "Name cannot exceed 30 characters"]},
    teachers: [{type: Schema.Types.ObjectId, ref: 'UserInfo'}],
    students: [{type: Schema.Types.ObjectId, ref: 'UserInfo'}],
    schedule: [{type: WeekScheduleSchema}],
    comunications: [{type: Schema.Types.ObjectId, ref: 'Comunication'}],
    material: [{type: Schema.Types.ObjectId, ref: 'Material'}],
    homework: [{type: Schema.Types.ObjectId, ref: 'Homework'}],
    lessons: [{type: Schema.Types.ObjectId, ref: 'Lesson'}],
    subjects: [{type: Schema.Types.ObjectId, ref: 'Subject'}],
    notes: [String],
    addedAt: {type: String, required: true},
    editedAt: {type: Number, required: true},
});

const Class = models.Class || model('Class', ClassSchema);

module.exports = { Class };