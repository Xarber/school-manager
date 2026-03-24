const { Schema, model, models } = require("mongoose");

const ScheduleHourSchema = new Schema({
    subjects: [{type: Schema.Types.ObjectId, ref: 'Subject'}],
    startTime: {type: String, required: true},
    endTime: {type: String, required: true},
});

const WeekScheduleSchema = new Schema({
    day: {type: Number, required: true, enum: [1, 2, 3, 4, 5, 6, 0], enumNames: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']},
    hours: [{type: ScheduleHourSchema}],
    addedAt: {type: String, required: true},
    editedAt: {type: Number, required: true},
});

//const ScheduleHour = models.ScheduleHour || model('ScheduleHour', ScheduleHourSchema);
//const WeekSchedule = models.WeekSchedule || model('WeekSchedule', WeekScheduleSchema);

//module.exports = { ScheduleHour, WeekSchedule };
module.exports = { ScheduleHourSchema, WeekScheduleSchema };