const { Schema, model, models } = require("mongoose");

const ComunicationSchema = new Schema({
    title: {type: String, required: true},
    content: {type: String, required: true},
    date: {type: String, required: false},
    time: {type: String, required: false},
    urgency: {type: String, required: false, enum: ['low', 'medium', 'high'], default: 'low'},
    requiresConfirmation: {type: Boolean, required: false, default: false},
    sender: {type: Schema.Types.ObjectId, ref: 'UserInfo', required: true},
    addedAt: {type: String, required: true},
    editedAt: {type: Number, required: true},
});

const Comunication = models.Comunication || model('Comunication', ComunicationSchema);

module.exports = { Comunication };