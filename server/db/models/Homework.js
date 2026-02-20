const { Schema, model, models } = require("mongoose");

const HomeworkSchema = new Schema({
    homeworkid: {type: String, required: true, unique: true},
    classid: {type: String, required: true},
    subjectid: {type: String, required: true},
    title: {type: String, required: true},
    description: {type: String, required: true},
    points: {type: Number, required: false},
    material: [{type: Schema.Types.String, ref: 'Material'}],
    dueDate: {type: String, required: true},
    addedAt: {type: String, required: true},
});

const Homework = models.Homework || model('Homework', HomeworkSchema);

module.exports = { Homework };