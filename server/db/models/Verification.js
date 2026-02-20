const { Schema, model, models } = require("mongoose");

const verificationSchema = new Schema({
  email: { type: String, required: true, unique: true },
  code: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 300 } // 5 min expiry
});

const Verification = model('Verification', verificationSchema);

module.exports = { Verification }