const { Schema, model, models } = require("mongoose");
const { type } = require("node:os");

const UserInfoSchema = new Schema({
    userid: {type: String, required: true, unique: true},
    name: {type: String, required: true, maxlength: [30, "Name cannot exceed 30 characters"]},
    surname: {type: String, required: true, maxlength: [40, "Surname cannot exceed 40 characters"]},
    parentemail: [{type: String, required: false}],
    email: {type: String, required: true, unique: true},
    role: {type: String, required: false, enum: ['student', 'teacher', 'admin'], default: 'student'},
    addedAt: {type: String, required: true},
    editedAt: {type: Number, required: true},
});

const UserSettingsSchema = new Schema({
    theme: {type: String, required: false, enum: ['light', 'dark', 'schoolmanager', 'system'], default: 'system'},
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
    userid: {type: String, required: true, unique: true}, // only in auth
    name: {type: String, required: false, default: "User", maxlength: [70, "Full name cannot exceed 70 characters"]},
    birthday: {type: String, required: false, default: ""}, // unused
    userInfo: {type: Schema.Types.ObjectId, ref: 'UserInfo'},
    settings: {type: UserSettingsSchema, required: true},
    classes: [{type: Schema.Types.ObjectId, ref: 'Class'}],
    grades: [{type: Schema.Types.ObjectId, ref: 'Grade'}], // unused
    completedhomework: [{type: Schema.Types.ObjectId, ref: 'Homework'}],
    pushtokens: [{type: String, required: false}],
    addedAt: {type: String, required: true},
    editedAt: {type: Number, required: true},
});

const UserInfo = models.UserInfo || model('UserInfo', UserInfoSchema);
const UserData = models.UserData || model('UserData', UserDataSchema);

module.exports = { UserInfo, UserData };