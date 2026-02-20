const { Schema, model, models } = require("mongoose");

const AccountSchema = new Schema({
    username: {type: String, required: true, unique: true},
    userid: {type: String, required: true, unique: true},
    token: {type: String, required: true},
    refreshToken: {type: String, required: true},
    idToken: {type: String, required: true},
    expiresAt: {type: Number, required: true},
    pushToken: {type: String, required: false},
    locked: {type: Boolean, required: true, default: false},
    active: {type: Boolean, required: true, default: true},
});

const Account = models.Account || model('Account', AccountSchema);

module.exports = { Account };