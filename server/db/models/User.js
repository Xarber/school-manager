const { Schema, model, models } = require("mongoose");

const UserInfoSchema = new Schema({
    userid: {type: String, required: true, unique: true},
    name: {type: String, required: true},
    surname: {type: String, required: true},
    email: {type: String, required: true, unique: true},
    role: {type: String, required: true, enum: ['student', 'teacher'], default: 'student'},
});

const UserSettingsSchema = new Schema({
    theme: {type: String, required: true, enum: ['light', 'dark', 'system'], default: 'system'},
    notifications: {type: Boolean, required: true, default: false},
    language: {type: String, required: true, default: 'en'},
    activeClassId: {type: String, required: true, default: ''},
    calendarSync: {
        enabled: {type: Boolean, required: true, default: false},
        homework: {type: Boolean, required: true, default: false},
        schedule: {type: Boolean, required: true, default: false},
        comunications: {type: Boolean, required: true, default: false},
        exams: {type: Boolean, required: true, default: false},
    },
});

const UserDataSchema = new Schema({
    userid: {type: String, required: true, unique: true},
    name: {type: String, required: true},
    birthday: {type: String, required: true, default: ""},
    userInfo: {type: Schema.Types.ObjectId, ref: 'User'},
    settings: {type: UserSettingsSchema, required: true},
    classes: [{type: Schema.Types.ObjectId, ref: 'Class'}],
    grades: [{type: Schema.Types.ObjectId, ref: 'Grade'}],
    completedhomework: [{classid: String, subjectid: String, homeworkid: String}],
});

const UserInfo = models.UserInfo || model('UserInfo', UserInfoSchema);
const UserData = models.UserData || model('UserData', UserDataSchema);

module.exports = { UserInfo, UserData };