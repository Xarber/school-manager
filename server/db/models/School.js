const {Schema, model, models} = require('mongoose');

const SchoolSchema = new Schema({
    schoolid: {type: String, required: true, unique: true},
    name: {type: String, required: true},
    address: {type: String, required: true},
    city: {type: String, required: true},
    country: {type: String, required: true},
    postalCode: {type: String, required: true},
    phoneNumber: {type: String, required: false},
    email: {type: String, required: false},
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
    classes: [{type: Schema.Types.ObjectId, ref: 'Class'}],
    students: [{type: Schema.Types.ObjectId, ref: 'UserInfo'}],
    teachers: [{type: Schema.Types.ObjectId, ref: 'UserInfo'}],
    admins: [{type: Schema.Types.ObjectId, ref: 'UserInfo'}],

    addedAt: {type: String, required: true},
    editedAt: {type: Number, required: true},
});

const School = models.School || model('School', SchoolSchema);

module.exports = { School };