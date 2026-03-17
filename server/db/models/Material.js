const { Schema, model, models } = require("mongoose");

const MaterialSchema = new Schema({
    title: {type: String, required: true, maxlength: [50, "Name cannot exceed 50 characters"]},
    description: {type: String, required: true},
    type: {type: String, required: false, enum: ['file', 'link'], default: 'file'},
    url: {type: String, required: true},
    downloadName: {type: String, required: false},
    addedAt: {type: String, required: true},
    editedAt: {type: Number, required: true},
});

const Material = models.Material || model('Material', MaterialSchema);

module.exports = { Material };