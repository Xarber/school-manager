const { Schema, model, models } = require("mongoose");

const MaterialSchema = new Schema({
    materialid: {type: String, required: true, unique: true},
    classid: {type: String, required: true},
    subjectid: {type: String, required: false},
    title: {type: String, required: true},
    description: {type: String, required: true},
    type: {type: String, required: true, enum: ['file', 'link'], default: 'file'},
    url: {type: String, required: true},
    addedAt: {type: String, required: true},
});

const Material = models.Material || model('Material', MaterialSchema);

module.exports = { Material };