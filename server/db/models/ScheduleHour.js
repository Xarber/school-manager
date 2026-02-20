const { Schema, model, models } = require("mongoose");

const ScheduleHourSchema = new Schema({
    classid: {type: String, required: true},
    subjectid: {type: String, required: true},
    teacher: {type: String, required: false},
    room: {type: String, required: true},
    duration: {type: String, required: true},
});

const WeekScheduleSchema = new Schema({
    day: {type: String, required: true},
    hours: [{type: ScheduleHourSchema, required: true}],
});

const ScheduleHour = models.ScheduleHour || model('ScheduleHour', ScheduleHourSchema);
const WeekSchedule = models.WeekSchedule || model('WeekSchedule', WeekScheduleSchema);

module.exports = { ScheduleHourSchema, WeekScheduleSchema };