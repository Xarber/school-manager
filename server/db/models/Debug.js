const { Schema, model, models } = require("mongoose");

const DebugSchema = new Schema({
    userid: {type: String, required: true, unique: true},
    firstLaunch: {type: Boolean, required: true},
    firstLaunchDate: {type: String, required: true},
    lastLaunchDate: {type: String, required: true},
    launchCount: {type: Number, required: true},
});

const Debug = models.Debug || model('Debug', DebugSchema);

module.exports = { Debug };