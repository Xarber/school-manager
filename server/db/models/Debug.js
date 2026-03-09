const { Schema, model, models } = require("mongoose");

const DebugSchema = new Schema({
    userid: {type: String, required: true, unique: true},
    firstLaunch: {type: Boolean},
    firstLaunchDate: {type: String},
    lastLaunchDate: {type: String},
    launchCount: {type: Number},
    appVersion: {type: String},
    errorLogs: [{type: String}],
    performanceMetrics: [{type: Schema.Types.Mixed}],
    addedAt: {type: String, required: true},
    editedAt: {type: Number, required: true},
});

const Debug = models.Debug || model('Debug', DebugSchema);

module.exports = { Debug };