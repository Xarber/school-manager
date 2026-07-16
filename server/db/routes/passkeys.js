const express = require("express");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const {
    generateRegistrationOptions,
    verifyRegistrationResponse,
    generateAuthenticationOptions,
    verifyAuthenticationResponse,
} = require("@simplewebauthn/server");

const { Passkey } = require("../models/Passkey");
const { PasskeyChallenge } = require("../models/PasskeyChallenge");

const { Account } = require("../models/Account");
const { UserInfo, UserData } = require("../models/User");
const { Debug } = require("../models/Debug");

const paths = require("./paths");

const router = express.Router();

const RP_NAME = process.env.APP_NAME;
const RP_ID = process.env.RP_ID;

const RP_ORIGINS = process.env.RP_ORIGINS
    .split(",")
    .map(origin => origin.trim())
    .filter(Boolean);

const CHALLENGE_TIMEOUT = 1000 * 60 * 5;

async function saveChallenge({
    challenge,
    type,
    account_id = null,
    webauthnUserId = null,
}) {
    const challengeId = crypto.randomUUID();

    await PasskeyChallenge.create({
        challengeId,
        challenge,
        type,
        account_id,
        webauthnUserId,
        expiresAt: new Date(Date.now() + CHALLENGE_TIMEOUT),
    });

    return challengeId;
}

async function consumeChallenge(challengeId, type) {
    if (!challengeId)
        return null;

    return await PasskeyChallenge.findOneAndDelete({
        challengeId,
        type,
        expiresAt: {
            $gt: new Date(),
        },
    });
}

async function createLoginToken(account_id, parent = false) {
    const account = await Account.findById(account_id);
    if (!account) return null;

    const userData = await UserData.findOne({ userid: account.userid });
    const userInfo = await UserInfo.findOne({ userid: account.userid });
    const debugData = await Debug.findOne({ userid: account.userid });

    if (!userData || !userInfo || !debugData) return null;

    const token = jwt.sign(
        {
            userdata_id: userData._id,
            userinfo_id: userInfo._id,
            account_id: account._id,
            userid: userData.userid,
            debug_id: debugData._id,
            parent,
            issued: Date.now(),
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "365d",
        }
    );

    return {
        token,
        account,
        userData,
        userInfo,
        debugData,
    };
}

function normalizeName(name) {
    if (typeof name !== "string")
        return "Passkey";

    name = name.trim();

    if (name.length === 0)
        return "Passkey";

    return name.substring(0, 100);
}

function getPublicKey(buffer) {
    return new Uint8Array(
        buffer.buffer,
        buffer.byteOffset,
        buffer.length,
    );
}

// /api/passkeys/get -> List user passkeys or health check passkey availability
router.post(paths.dbGet, async (req, res) => {
    try {
        const user = req.user;

        if (!user) {
            return res.json({
                success: true,
                data: {
                    available: true,
                    service: `${process.env.APP_NAME} WebAuthn`,
                }
            });
        }

        const passkeys = await Passkey.find({
            account_id: user.account_id,
            parent: user.parent,
        })
        .select(
            "_id name deviceType backedUp transports createdAt lastUsedAt"
        )
        .sort({
            createdAt: -1,
        })
        .lean();

        return res.json({
            success: true,
            data: passkeys,
        });
    } catch(error) {
        console.error(error);
        return res.status(500).json({
            error: req.t("errors.generic"),
            dbError: error,
        });
    }
});

// /api/passkeys/add -> Get options for passkey creation -> Actually save and create the passkey
router.post(paths.dbCreate, async (req, res) => {
    try {
        const user = req.user;
        if (!user) return res.status(401).json({ error: req.t("errors.not_authenticated") });

        const {
            mode,
            challengeId,
            credential,
            name,
        } = req.body;

        /*
        ============================================
        Generate registration options
        ============================================
        */

        if (mode === "options") {
            const existingPasskeys = await Passkey.find({
                account_id: user.account_id,
                parent: user.parent,
            }).lean();

            const userInfo = await UserInfo.findOne({ userid: user.userid });
            if (!userInfo) return res.status(404).json({ error: req.t("errors.user_not_found") });

            const options = await generateRegistrationOptions({
                rpName: RP_NAME,
                rpID: RP_ID,
                userName: userInfo.email,
                userDisplayName: `${userInfo.name} ${userInfo.surname}`,
                userID: Buffer.from(String(user.account_id), "utf8"),
                attestationType: "none",
                authenticatorSelection: {
                    residentKey: "required",
                    userVerification: "required",
                },
                excludeCredentials: existingPasskeys.map(passkey => ({
                    id: passkey.credentialId,
                    transports: passkey.transports,
                })),
            });

            const savedChallenge = await saveChallenge({
                challenge: options.challenge,
                type: "registration",
                account_id: user.account_id,
                webauthnUserId: String(user.account_id),
            });

            return res.json({
                success: true,
                challengeId: savedChallenge,
                data: options
            });
        }

        /*
        ============================================
        Verify registration
        ============================================
        */

        if (mode === "verify") {
            if (!challengeId) return res.status(400).json({ error: "challengeId required", });
            if (!credential) return res.status(400).json({ error: "credential required" });

            const challenge = await consumeChallenge(challengeId, "registration");
            if (!challenge) return res.status(400).json({ error: "Challenge expired" });

            const verification = await verifyRegistrationResponse({
                response: credential,
                expectedChallenge: challenge.challenge,
                expectedOrigin: RP_ORIGINS,
                expectedRPID: RP_ID,
                requireUserVerification: true,
            });
            if (!verification.verified) return res.status(400).json({ error: "Registration verification failed" });

            const registration = verification.registrationInfo;

            const existing = await Passkey.findOne({ credentialId: registration.credential.id });
            if (existing) return res.status(409).json({ error: "Passkey already exists" });

            const passkey = new Passkey({
                account_id: user.account_id,
                parent: user.parent,

                credentialId: registration.credential.id,
                publicKey: Buffer.from(registration.credential.publicKey),
                counter: registration.credential.counter,
                transports: registration.credential.transports ?? [],

                deviceType: registration.credentialDeviceType,
                backedUp: registration.credentialBackedUp,
                aaguid: registration.aaguid,

                webauthnUserId: String(user.account_id),

                name: normalizeName(name),
                lastUsedAt: null,
            });
            await passkey.save();

            return res.json({
                success: true,
                data: {
                    id: passkey._id,
                    name: passkey.name,
                    transports: passkey.transports,
                    backedUp: passkey.backedUp,
                    deviceType: passkey.deviceType,
                },
            });
        }

        return res.status(400).json({ error: "Invalid mode" });
    } catch(error) {
        console.error(error);
        return res.status(500).json({ error: req.t("errors.generic"), dbError: error });
    }
});

// /api/passkeys/update -> Get login options -> Actually login with the passkey
router.post(paths.dbUpdate, async (req, res) => {
    try {
        const {
            mode,
            challengeId,
            credential,
        } = req.body;

        /*
        ============================================
        Generate login options
        ============================================
        */

        if (mode === "options") {
            const options = await generateAuthenticationOptions({
                rpID: RP_ID,
                userVerification: "required"
            });

            const savedChallenge = await saveChallenge({ 
                challenge: options.challenge,
                type: "authentication",
            });

            return res.json({
                success: true,
                challengeId: savedChallenge,
                data: options,
            });
        }

        /*
        ============================================
        Verify login
        ============================================
        */

        if (mode === "verify") {
            if (!challengeId) return res.status(400).json({ error: "challengeId required" });
            if (!credential) return res.status(400).json({ error: "credential required" });

            const challenge = await consumeChallenge( challengeId, "authentication" );
            if (!challenge) return res.status(400).json({ error: "Challenge expired" });

            const passkey = await Passkey.findOne({ credentialId: credential.id });
            if (!passkey) return res.status(404).json({ error: "Passkey not found" });

            const verification = await verifyAuthenticationResponse({
                response: credential,
                expectedChallenge: challenge.challenge,
                expectedOrigin: RP_ORIGINS,
                expectedRPID: RP_ID,
                credential: {
                    id: passkey.credentialId,
                    publicKey: getPublicKey(passkey.publicKey),
                    counter: passkey.counter,
                    transports: passkey.transports,
                },
                requireUserVerification: true
            });
            if (!verification.verified) return res.status(401).json({ error: "Authentication failed" });
            
            passkey.counter = verification.authenticationInfo.newCounter;
            passkey.lastUsedAt = new Date();
            await passkey.save();

            const login = await createLoginToken(
                passkey.account_id,
                passkey.parent,
            );
            if (!login) return res.status(404).json({ error: "Account not found" });
                
            return res.json({
                success: true,
                token: login.token,
                isNewUser: false
            });
        }

        return res.status(400).json({ error: "Invalid mode" });
    } catch(error) {
        console.error(error);
        return res.status(500).json({ error: req.t("errors.generic"), dbError: error });
    }
});

// /api/passkeys/delete -> Delete a passkey
router.post(paths.dbDelete, async (req, res) => {
    try {
        const user = req.user;
        if (!user) return res.status(401).json({ error: req.t("errors.not_authenticated") });

        const { passkeyId } = req.body;
        if (!passkeyId) return res.status(400).json({ error: "passkeyId required" });

        const passkey = await Passkey.findOne({
            _id: passkeyId,
            account_id: user.account_id,
            parent: user.parent,
        });

        if (!passkey) return res.status(404).json({ error: "Passkey not found" });
        await passkey.deleteOne();

        return res.json({ success: true });

    } catch(error) {
        console.error(error);
        return res.status(500).json({ error: req.t("errors.generic"), dbError: error.message });
    }
});

module.exports = router;