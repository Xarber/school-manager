const { Schema, model, models } = require("mongoose");

const passkeyExchangeSchema = new Schema(
  {
    codeHash: { type: String, required: true, unique: true, index: true },
    action: { type: String, required: true, enum: ["add", "login"], index: true },
    purpose: { type: String, required: true, enum: ["browser", "app"], index: true },

    account_id: { type: Schema.Types.ObjectId, default: null, index: true },
    parent: { type: Boolean, default: false },
    callbackUrl: { type: String, default: null },
    codeChallenge: { type: String, required: true },
    pendingPasskey: { type: Schema.Types.Mixed, default: null },

    consumedAt: { type: Date, default: null, index: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  {
    timestamps: true,
  },
);

const PasskeyExchange = models.PasskeyExchange || model("PasskeyExchange", passkeyExchangeSchema);

module.exports = { PasskeyExchange };
