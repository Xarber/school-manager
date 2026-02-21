const { Schema, model, models } = require("mongoose");

const GradeSchema = new Schema({
    gradeid: {type: String, required: true, unique: true},
    title: {type: String, required: true},
    type: {type: String, required: false, enum: ['oral', 'written', 'homework', 'project', 'other'], default: 'other'},
    grade: {type: Number, required: true},
    gradeTitle: {type: String, required: false},
    classid: {type: String, required: true},
    subjectid: {type: String, required: true},
    homeworkid: {type: String, required: false},
    addedAt: {type: String, required: true},
});

const Grade = models.Grade || model('Grade', GradeSchema);

module.exports = { Grade };