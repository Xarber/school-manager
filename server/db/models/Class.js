const { Schema, model, models } = require("mongoose");
const { WeekScheduleSchema } = require("./ScheduleHour");

const ClassSchema = new Schema({
    classid: {type: String, required: true, unique: true},
    name: {type: String, required: true},
    teachers: [{type: Schema.Types.ObjectId, ref: 'UserInfo'}],
    students: [{type: Schema.Types.ObjectId, ref: 'UserInfo'}],
    schedule: {type: WeekScheduleSchema, required: true},
    comunications: [{type: Schema.Types.ObjectId, ref: 'Comunication'}],
    subjects: [{type: Schema.Types.ObjectId, ref: 'Subject'}],
    notes: [String],
});

const Class = models.Class || model('Class', ClassSchema);

module.exports = { Class };