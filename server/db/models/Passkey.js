const { Schema, model, models } = require("mongoose");

const passkeySchema = new Schema(
  {
    account_id: { type: Schema.Types.ObjectId, required: true, index: true },
    parent: { type: Boolean, required: true, default: false },

    credentialId: { type: String, required: true, unique: true, index: true },
    publicKey: { type: Buffer, required: true },
    counter: { type: Number, required: true, default: 0 },
    transports: { type: [String], default: [] },

    deviceType: { type: String, required: true },
    backedUp: { type: Boolean, required: true },
    aaguid: { type: String, required: true },
    
    webauthnUserId: { type: String, required: true, index: true },

    name: { type: String, required: true, default: 'Passkey', maxlength: 100 },

    lastUsedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  },
);

const Passkey = models.Passkey || model('Passkey', passkeySchema);

module.exports = { Passkey };