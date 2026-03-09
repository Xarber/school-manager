const { Schema, model, models } = require("mongoose");
const { type } = require("node:os");

const UserInfoSchema = new Schema({
    userid: {type: String, required: true, unique: true},
    name: {type: String, required: true},
    surname: {type: String, required: true},
    email: {type: String, required: true, unique: true},
    role: {type: String, required: false, enum: ['student', 'teacher'], default: 'student'},
    addedAt: {type: String, required: true},
    editedAt: {type: Number, required: true},
});

const UserSettingsSchema = new Schema({
    theme: {type: String, required: false, enum: ['light', 'dark', 'system'], default: 'system'},
    notifications: {type: Boolean, required: false, default: false},
    language: {type: String, required: false, default: 'en'},
    activeClassId: {type: String, required: false, default: ''},
    calendarSync: {
        enabled: {type: Boolean, required: false, default: false},
        homework: {type: Boolean, required: false, default: false},
        schedule: {type: Boolean, required: false, default: false},
        comunications: {type: Boolean, required: false, default: false},
        exams: {type: Boolean, required: false, default: false},
    },
});

const UserDataSchema = new Schema({
    userid: {type: String, required: true, unique: true},
    name: {type: String, required: false, default: "User"},
    birthday: {type: String, required: false, default: ""},
    userInfo: {type: Schema.Types.ObjectId, ref: 'UserInfo'},
    settings: {type: UserSettingsSchema, required: true},
    classes: [{type: Schema.Types.ObjectId, ref: 'Class'}],
    grades: [{type: Schema.Types.ObjectId, ref: 'Grade'}],
    completedhomework: [{type: Schema.Types.ObjectId, ref: 'Homework'}],
    addedAt: {type: String, required: true},
    editedAt: {type: Number, required: true},
});

const UserInfo = models.UserInfo || model('UserInfo', UserInfoSchema);
const UserData = models.UserData || model('UserData', UserDataSchema);

module.exports = { UserInfo, UserData };