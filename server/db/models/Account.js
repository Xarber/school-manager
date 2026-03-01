const { Schema, model, models } = require("mongoose");

const AccountSchema = new Schema({
    userData: {type: Schema.Types.ObjectId, ref: 'UserData'},
    userDebug: {type: Schema.Types.ObjectId, ref: 'Debug'},
    pushToken: [{type: String, required: false}],
    locked: {type: Boolean, required: false, default: false},
    active: {type: Boolean, required: false, default: true},
    addedAt: {type: String, required: true},
    editedAt: {type: Number, required: true},
});

const Account = models.Account || model('Account', AccountSchema);

module.exports = { Account };