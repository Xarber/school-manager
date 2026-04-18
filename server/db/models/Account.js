const { Schema, model, models } = require("mongoose");

const AccountSchema = new Schema({
    userid: {type: String, required: true, unique: true},
    userData: {type: Schema.Types.ObjectId, ref: 'UserData'},
    userDebug: {type: Schema.Types.ObjectId, ref: 'Debug'},
    pushToken: [{type: String, required: false}],
    locked: {type: Boolean, required: false, default: false},
    active: {type: Boolean, required: false, default: true},
    otpbackup: {
        base32: {type: String, required: false},
        otpauth_url: {type: String, required: false},
    },
    addedAt: {type: String, required: true},
    editedAt: {type: Number, required: true},
});

const Account = models.Account || model('Account', AccountSchema);

module.exports = { Account };