const { Schema, model, models } = require("mongoose");

const SessionSchema = new Schema({
  account_id: { type: Schema.Types.ObjectId, ref: "Account", required: true, index: true },
  tokenId: { type: String, required: true, unique: true, index: true },
  deviceName: { type: String, required: true, maxlength: 120 },
  userAgent: { type: String, maxlength: 500 },
  appVersion: { type: String, maxlength: 50 },
  createdAt: { type: Date, default: Date.now },
  lastUsedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  revokedAt: { type: Date, default: null },
  revokedReason: { type: String, maxlength: 120 },
});

SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Session = models.Session || model("Session", SessionSchema);

module.exports = { Session };
