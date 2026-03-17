const { Schema, model, models } = require("mongoose");

const GradeSchema = new Schema({
    class: {type: Schema.Types.ObjectId, ref: 'Class', required: true},
    subject: {type: Schema.Types.ObjectId, ref: 'Subject', required: true},
    homework: {type: Schema.Types.ObjectId, ref: 'Homework', required: false},
    exam: {type: Schema.Types.ObjectId, ref: 'Lesson', required: false},
    user: {type: Schema.Types.ObjectId, ref: 'UserInfo', required: true},
    title: {type: String, required: true, maxlength: [50, "Name cannot exceed 50 characters"]},
    description: {type: String, required: false, maxlength: [300, "Description cannot exceed 300 characters"]},
    type: {type: String, required: false, enum: ['oral', 'written', 'other'], default: 'other'},
    grade: {type: Number, required: true},
    gradeTitle: {type: String, required: false},
    addedAt: {type: String, required: true},
    editedAt: {type: Number, required: true},
});

const Grade = models.Grade || model('Grade', GradeSchema);

module.exports = { Grade };