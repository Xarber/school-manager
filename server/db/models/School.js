const {Schema, model, models} = require('mongoose');

const SchoolSchema = new Schema({
    name: {type: String, required: true, maxlength: [30, "Name cannot exceed 30 characters"]},
    address: {type: String, required: true},
    city: {type: String, required: true},
    country: {type: String, required: true},
    website: {type: String, required: false},
    istitutionalEmailDomain: {type: String, required: true},

    facebook: {type: String, required: false},
    instagram: {type: String, required: false},
    linkedin: {type: String, required: false},
    twitter: {type: String, required: false},
    youtube: {type: String, required: false},
    about: {type: String, required: false},
    banner: {type: String, required: false},

    comunications: [{type: Schema.Types.ObjectId, ref: 'Comunication'}],
    material: [{type: Schema.Types.ObjectId, ref: 'Material'}],
    classes: [{type: Schema.Types.ObjectId, ref: 'Class'}],
    students: [{type: Schema.Types.ObjectId, ref: 'UserInfo'}],
    teachers: [{type: Schema.Types.ObjectId, ref: 'UserInfo'}],
    admins: [{type: Schema.Types.ObjectId, ref: 'UserInfo'}],

    addedAt: {type: String, required: true},
    editedAt: {type: Number, required: true},
});

const School = models.School || model('School', SchoolSchema);

module.exports = { School };