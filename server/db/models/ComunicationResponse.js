const { Schema, model, models } = require("mongoose");

const ComunicationResponseSchema = new Schema({
    user: {type: Schema.Types.ObjectId, ref: 'UserInfo', required: true},
    state: {type: Boolean, required: false},
    message: {type: String, required: false},
    material: [{type: Schema.Types.ObjectId, ref: 'Material'}],
    addedAt: {type: String, required: true},
    editedAt: {type: Number, required: true},
});

const ComunicationResponse = models.ComunicationResponse || model('ComunicationResponse', ComunicationResponseSchema);

module.exports = { ComunicationResponse };