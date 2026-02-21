const { Schema, model, models } = require("mongoose");

const ComunicationSchema = new Schema({
    comunicationid: {type: String, required: true, unique: true},
    classid: {type: String, required: true},
    subjectid: {type: String, required: false},
    title: {type: String, required: true},
    content: {type: String, required: true},
    date: {type: String, required: false},
    time: {type: String, required: false},
    urgency: {type: String, required: false, enum: ['low', 'medium', 'high'], default: 'low'},
    requiresConfirmation: {type: Boolean, required: false, default: false},
    sender: {type: Schema.Types.ObjectId, ref: 'User'},
    addedAt: {type: String, required: true},
});

const Comunication = models.Comunication || model('Comunication', ComunicationSchema);

module.exports = { Comunication };