const { Schema, model, models } = require("mongoose");

const FileSchema = new Schema({
    name: {type: String, required: true, maxlength: [50, "Name cannot exceed 50 characters"]},
    mimetype: {type: String, required: true},
    size: {type: Number, required: true},
    author: {type: Schema.Types.ObjectId, ref: 'UserInfo', required: true},
    addedAt: {type: String, required: true},
    editedAt: {type: Number, required: true},
});

const File = models.File || model('File', FileSchema);

module.exports = { File };