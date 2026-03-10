const { Schema, model, models } = require("mongoose");

const invitationSchema = new Schema({
    code: { type: String, required: true, unique: true },
    author: { type: Schema.Types.ObjectId, required: true, ref: 'UserInfo' },
    targetid: { type: Schema.Types.ObjectId, required: true },
    for: { type: String, required: true, enum: ['school', 'class'] },
    joinAs: { type: String, required: true, enum: ['student', 'teacher'] },
    maxUsage: { type: Number, required: false, default: -1 },
    used: { type: Number, required: false, default: 0 },
    addedAt: { type: Date, default: Date.now, expires: 2678400 } // Expires in a month
});

const Invitation = model('Invitation', invitationSchema);

module.exports = { Invitation }