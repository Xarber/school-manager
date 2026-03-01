const { Schema, model, models } = require("mongoose");

const HomeworkSchema = new Schema({
    title: {type: String, required: true},
    description: {type: String, required: true},
    points: {type: Number, required: false},
    material: [{type: Schema.Types.ObjectId, ref: 'Material'}],
    dueDate: {type: String, required: true},
    addedAt: {type: String, required: true},
    editedAt: {type: Number, required: true},
});

const Homework = models.Homework || model('Homework', HomeworkSchema);

module.exports = { Homework };