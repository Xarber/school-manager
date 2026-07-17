const { Schema, model, models } = require("mongoose");

const passkeyChallengeSchema = new Schema(
  {
    challengeId: { type: String, required: true, unique: true, index: true },
    challenge: { type: String, required: true },
    type: { type: String, required: true, enum: ['registration', 'authentication'] },

    account_id: { type: Schema.Types.ObjectId, default: null, index: true },
    webauthnUserId: { type: String, default: null },

    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  {
    timestamps: true,
  },
);

const PasskeyChallenge = models.PasskeyChallenge || model('PasskeyChallenge', passkeyChallengeSchema);

module.exports = { PasskeyChallenge };