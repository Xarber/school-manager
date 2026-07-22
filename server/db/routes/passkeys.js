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
const { PasskeyExchange } = require("../models/PasskeyExchange");

const { Account } = require("../models/Account");
const { UserInfo, UserData } = require("../models/User");
const { Debug } = require("../models/Debug");

const paths = require("./paths");

const router = express.Router();

const RP_NAME = process.env.RP_NAME || "School Manager";
const RP_ID = process.env.RP_ID;

const RP_ORIGINS = process.env.RP_ORIGINS
    .split(",")
    .map(origin => origin.trim())
    .filter(Boolean);

const CHALLENGE_TIMEOUT = 1000 * 60 * 5;
const EXCHANGE_TIMEOUT = 1000 * 60 * 30;
const APP_SCHEME = process.env.APP_SCHEME || "schoolmanager";
const PASSKEY_WEB_ORIGIN = (process.env.PASSKEY_WEB_ORIGIN || RP_ORIGINS[0]).replace(/\/$/, "");
const AAGUID_CATALOG_URL = "https://raw.githubusercontent.com/passkeydeveloper/passkey-authenticator-aaguids/refs/heads/main/aaguid.json";
const AAGUID_CATALOG_TTL = 1000 * 60 * 60 * 24;

let aaguidCatalog = null;
let aaguidCatalogExpiresAt = 0;

async function getAuthenticatorName(aaguid) {
    if (typeof aaguid !== "string" || !aaguid) return null;

    if (!aaguidCatalog || Date.now() >= aaguidCatalogExpiresAt) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);

        try {
            const response = await fetch(AAGUID_CATALOG_URL, { signal: controller.signal });
            if (!response.ok) throw new Error(`AAGUID catalog returned ${response.status}`);

            const catalog = await response.json();
            if (!catalog || typeof catalog !== "object" || Array.isArray(catalog)) {
                throw new Error("AAGUID catalog has an invalid format");
            }

            if (Object.keys(catalog).length === 0) {
                console.warn("[PASSKEYS] AAGUID catalog is empty");
            }

            aaguidCatalog = catalog;
            aaguidCatalogExpiresAt = Date.now() + AAGUID_CATALOG_TTL;
        } catch (error) {
            console.warn("[PASSKEYS] Could not refresh AAGUID catalog", error.message);
        } finally {
            clearTimeout(timeout);
        }
    }

    const entry = aaguidCatalog?.[aaguid.toLowerCase()];
    return typeof entry?.name === "string" ? entry.name : null;
}

function hashExchangeCode(code) {
    return crypto.createHash("sha256").update(code).digest("hex");
}

function createExchangeCode() {
    return crypto.randomBytes(32).toString("base64url");
}

function validateCallbackUrl(callbackUrl, action) {
    try {
        const parsed = new URL(callbackUrl);
        return parsed.protocol === `${APP_SCHEME}:`
            && parsed.hostname === "passkeys"
            && parsed.pathname === `/${action}`;
    } catch {
        return false;
    }
}

async function createExchange({ action, purpose, account_id = null, parent = false, callbackUrl = null, codeChallenge }) {
    const code = createExchangeCode();
    const exchange = await PasskeyExchange.create({
        codeHash: hashExchangeCode(code),
        action,
        purpose,
        account_id,
        parent,
        callbackUrl,
        codeChallenge,
        expiresAt: new Date(Date.now() + EXCHANGE_TIMEOUT),
    });

    return { code, exchange };
}

async function consumeExchangeCode(code, purpose, action = null, codeChallenge = null) {
    if (typeof code !== "string" || !code) return null;

    const query = {
        codeHash: hashExchangeCode(code),
        purpose,
        consumedAt: null,
        expiresAt: { $gt: new Date() },
    };
    if (action) query.action = action;
    if (codeChallenge) query.codeChallenge = codeChallenge;

    return PasskeyExchange.findOneAndUpdate(
        query,
        { $set: { consumedAt: new Date() } },
        { new: true },
    );
}

async function saveChallenge({
    challenge,
    type,
    account_id = null,
    parent = false,
    webauthnUserId = null,
    exchange_id = null,
}) {
    const challengeId = crypto.randomUUID();

    await PasskeyChallenge.create({
        challengeId,
        challenge,
        type,
        account_id,
        parent,
        webauthnUserId,
        exchange_id,
        expiresAt: new Date(Date.now() + CHALLENGE_TIMEOUT),
    });

    return challengeId;
}

async function createAppResultExchange(browserExchange, account_id, parent = false) {
    return createExchange({
        action: browserExchange.action,
        purpose: "app",
        account_id,
        parent,
        callbackUrl: browserExchange.callbackUrl,
        codeChallenge: browserExchange.codeChallenge,
    });
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

async function getRegistrationUser(user) {
    if (!user?.account_id) return null;
    if (user.userid) return user;

    const account = await Account.findById(user.account_id);
    if (!account) return null;

    return {
        ...user,
        userid: account.userid,
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

// App -> browser exchange. For registration, the authenticated account is
// captured here so the browser never needs a second account login.
router.post("/exchange/start", async (req, res) => {
    try {
        const { action, callbackUrl, codeChallenge } = req.body;
        if (action !== "add" && action !== "login") {
            return res.status(400).json({ error: "Invalid passkey action" });
        }
        if (!validateCallbackUrl(callbackUrl, action)) {
            return res.status(400).json({ error: "Invalid callback URL" });
        }
        if (typeof codeChallenge !== "string" || !/^[a-f0-9]{64}$/.test(codeChallenge)) {
            return res.status(400).json({ error: "Invalid code challenge" });
        }
        if (action === "add" && !req.user) {
            return res.status(401).json({ error: req.t("errors.not_authenticated") });
        }

        const { code } = await createExchange({
            action,
            purpose: "browser",
            account_id: action === "add" ? req.user.account_id : null,
            parent: action === "add" ? req.user.parent : false,
            callbackUrl,
            codeChallenge,
        });

        const browserUrl = new URL(`/passkeys/${action}`, PASSKEY_WEB_ORIGIN);
        browserUrl.searchParams.set("exchangeCode", code);

        browserUrl.searchParams.set(
            "exchangeApi",
            process.env.PASSKEY_API_ORIGIN ||
                `${req.protocol}://${req.get("host")}`,
        );

        return res.json({
            success: true,
            browserUrl: browserUrl.toString(),
            expiresIn: EXCHANGE_TIMEOUT / 1000,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: req.t("errors.generic") });
    }
});

// Browser -> app exchange. The browser result code is atomically consumed.
router.post("/exchange/complete", async (req, res) => {
    try {
        const { action, exchangeCode, codeVerifier } = req.body;
        if (action !== "add" && action !== "login") {
            return res.status(400).json({ error: "Invalid passkey action" });
        }
        if (action === "add" && !req.user) {
            return res.status(401).json({ error: req.t("errors.not_authenticated") });
        }

        if (typeof codeVerifier !== "string" || codeVerifier.length < 43) {
            return res.status(400).json({ error: "Invalid code verifier" });
        }
        const codeChallenge = hashExchangeCode(codeVerifier);

        const exchange = await consumeExchangeCode(exchangeCode, "app", action, codeChallenge);
        if (!exchange) {
            return res.status(400).json({ error: "Exchange code is invalid, expired, or already used" });
        }

        if (exchange.action === "add") {
            if (String(req.user.account_id) !== String(exchange.account_id)
                || Boolean(req.user.parent) !== Boolean(exchange.parent)) {
                return res.status(403).json({ error: "Exchange code belongs to another account" });
            }
            return res.json({ success: true, action: "add" });
        }

        const login = await createLoginToken(exchange.account_id, exchange.parent);
        if (!login) return res.status(404).json({ error: "Account not found" });

        return res.json({
            success: true,
            action: "login",
            token: login.token,
            email: login.userInfo.email,
            isNewUser: false,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: req.t("errors.generic") });
    }
});

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
        const {
            mode,
            challengeId,
            credential,
            exchangeCode,
        } = req.body;

        /*
        ============================================
        Generate registration options
        ============================================
        */

        if (mode === "options") {
            const browserExchange = exchangeCode
                ? await consumeExchangeCode(exchangeCode, "browser", "add")
                : null;
            if (exchangeCode && !browserExchange) {
                return res.status(400).json({ error: "Exchange code is invalid, expired, or already used" });
            }

            const user = await getRegistrationUser(browserExchange
                ? { account_id: browserExchange.account_id, parent: browserExchange.parent }
                : req.user);
            if (!user) return res.status(401).json({ error: req.t("errors.not_authenticated") });

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
                parent: user.parent,
                webauthnUserId: String(user.account_id),
                exchange_id: browserExchange?._id ?? null,
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

            const browserExchange = challenge.exchange_id
                ? await PasskeyExchange.findOne({
                    _id: challenge.exchange_id,
                    action: "add",
                    purpose: "browser",
                    consumedAt: { $ne: null },
                    expiresAt: { $gt: new Date() },
                })
                : null;
            if (challenge.exchange_id && !browserExchange) {
                return res.status(400).json({ error: "Exchange expired" });
            }
            const user = await getRegistrationUser(browserExchange
                ? { account_id: challenge.account_id, parent: challenge.parent }
                : req.user);
            if (!user) return res.status(401).json({ error: req.t("errors.not_authenticated") });
            if (!browserExchange && (String(user.account_id) !== String(challenge.account_id)
                || Boolean(user.parent) !== Boolean(challenge.parent))) {
                return res.status(403).json({ error: "Challenge belongs to another account" });
            }

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

            const suggestedName = await getAuthenticatorName(registration.aaguid);

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

                name: normalizeName(suggestedName || "Passkey"),
                lastUsedAt: null,
            });
            await passkey.save();

            if (browserExchange) {
                const result = await createAppResultExchange(
                    browserExchange,
                    user.account_id,
                    user.parent,
                );
                return res.json({
                    success: true,
                    exchangeCode: result.code,
                    callbackUrl: browserExchange.callbackUrl,
                });
            }

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
            exchangeCode,
        } = req.body;

        /*
        ============================================
        Generate login options
        ============================================
        */

        if (mode === "options") {
            const browserExchange = exchangeCode
                ? await consumeExchangeCode(exchangeCode, "browser", "login")
                : null;
            if (exchangeCode && !browserExchange) {
                return res.status(400).json({ error: "Exchange code is invalid, expired, or already used" });
            }

            const options = await generateAuthenticationOptions({
                rpID: RP_ID,
                userVerification: "required"
            });

            const savedChallenge = await saveChallenge({ 
                challenge: options.challenge,
                type: "authentication",
                exchange_id: browserExchange?._id ?? null,
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

            if (challenge.exchange_id) {
                const browserExchange = await PasskeyExchange.findOne({
                    _id: challenge.exchange_id,
                    action: "login",
                    purpose: "browser",
                    consumedAt: { $ne: null },
                    expiresAt: { $gt: new Date() },
                });
                if (!browserExchange) return res.status(400).json({ error: "Exchange expired" });

                const result = await createAppResultExchange(
                    browserExchange,
                    passkey.account_id,
                    passkey.parent,
                );
                return res.json({
                    success: true,
                    exchangeCode: result.code,
                    callbackUrl: browserExchange.callbackUrl,
                });
            }

            const login = await createLoginToken(
                passkey.account_id,
                passkey.parent,
            );
            if (!login) return res.status(404).json({ error: "Account not found" });
                
            return res.json({
                success: true,
                token: login.token,
                email: login.userInfo.email,
                isNewUser: false
            });
        }

        return res.status(400).json({ error: "Invalid mode" });
    } catch(error) {
        console.error(error);
        return res.status(500).json({ error: req.t("errors.generic"), dbError: error });
    }
});

// /api/passkeys/rename -> Rename a passkey owned by the current account
router.post("/rename", async (req, res) => {
    try {
        const user = req.user;
        if (!user) return res.status(401).json({ error: req.t("errors.not_authenticated") });

        const { passkeyId, name } = req.body;
        if (!passkeyId) return res.status(400).json({ error: "passkeyId required" });
        if (typeof name !== "string") return res.status(400).json({ error: "name required" });

        const passkey = await Passkey.findOne({
            _id: passkeyId,
            account_id: user.account_id,
            parent: user.parent,
        });

        if (!passkey) return res.status(404).json({ error: "Passkey not found" });

        passkey.name = normalizeName(name);
        await passkey.save();

        return res.json({ success: true, name: passkey.name });
    } catch(error) {
        console.error(error);
        return res.status(500).json({ error: req.t("errors.generic"), dbError: error.message });
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
