const { Schema, model, models } = require("mongoose");

const ScheduleHourSchema = new Schema({
    classid: {type: String, required: true},
    subjectid: {type: String, required: true},
    startTime: {type: String, required: true},
    endTime: {type: String, required: true},
});

const WeekScheduleSchema = new Schema({
    day: {type: String, required: true},
    hours: [{type: ScheduleHourSchema}],
});

//const ScheduleHour = models.ScheduleHour || model('ScheduleHour', ScheduleHourSchema);
//const WeekSchedule = models.WeekSchedule || model('WeekSchedule', WeekScheduleSchema);

//module.exports = { ScheduleHour, WeekSchedule };
module.exports = { ScheduleHourSchema, WeekScheduleSchema };