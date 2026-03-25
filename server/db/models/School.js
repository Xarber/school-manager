const {Schema, model, models} = require('mongoose');

const SchoolSchema = new Schema({
    name: {type: String, required: true, maxlength: [30, "Name cannot exceed 30 characters"]},
    address: {type: String, required: true},
    city: {type: String, required: true},
    country: {type: String, required: true},
    website: {type: String},
    istitutionalEmailDomain: {type: String, required: true},

    facebook: {type: String},
    instagram: {type: String},
    linkedin: {type: String},
    twitter: {type: String},
    youtube: {type: String},
    about: {type: String},
    banner: {type: String},

    comunications: [{type: Schema.Types.ObjectId, ref: 'Comunication'}],
    material: [{type: Schema.Types.ObjectId, ref: 'Material'}],
    files: [{type: Schema.Types.ObjectId, ref: 'File'}],
    classes: [{type: Schema.Types.ObjectId, ref: 'Class'}],
    students: [{type: Schema.Types.ObjectId, ref: 'UserInfo'}],
    teachers: [{type: Schema.Types.ObjectId, ref: 'UserInfo'}],
    admins: [{type: Schema.Types.ObjectId, ref: 'UserInfo'}],

    addedAt: {type: String, required: true},
    editedAt: {type: Number, required: true},
});

const School = models.School || model('School', SchoolSchema);

module.exports = { School };