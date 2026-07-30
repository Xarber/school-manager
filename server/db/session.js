const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { Session } = require("./models/Session");

const SESSION_DAYS = Math.min(Math.max(Number(process.env.SESSION_DAYS) || 30, 1), 90);

function getSessionExpiry() {
  return new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
}

function signSessionToken({ userData, userInfo, account, debugData, parent = false, sessionId }) {
  return jwt.sign(
    {
      userdata_id: userData._id,
      userinfo_id: userInfo._id,
      account_id: account._id,
      userid: userData.userid,
      debug_id: debugData._id,
      parent: Boolean(parent),
      session_id: sessionId,
    },
    process.env.JWT_SECRET,
    { expiresIn: `${SESSION_DAYS}d` },
  );
}

function getDeviceName(req) {
  const requestedName = req.get("X-Device-Name");
  if (typeof requestedName === "string" && requestedName.trim()) {
    return requestedName.trim().slice(0, 120);
  }

  const userAgent = req.get("User-Agent") || "Unknown device";
  return userAgent.slice(0, 120);
}

function getAppVersion(req) {
  const appVersion = req.get("X-App-Version");
  return typeof appVersion === "string" && appVersion.trim()
    ? appVersion.trim().slice(0, 50)
    : undefined;
}

async function createSessionToken({ account, userData, userInfo, debugData, parent = false, req }) {
  const tokenId = crypto.randomUUID();
  const expiresAt = getSessionExpiry();
  const session = await Session.create({
    account_id: account._id,
    tokenId,
    deviceName: getDeviceName(req),
    userAgent: (req.get("User-Agent") || "").slice(0, 500),
    appVersion: getAppVersion(req),
    expiresAt,
  });

  const token = signSessionToken({ userData, userInfo, account, debugData, parent, sessionId: session.tokenId });

  return { token, session, expiresAt };
}

function renewSessionToken({ session, user }) {
  const expiresAt = getSessionExpiry();
  const token = jwt.sign(
    {
      userdata_id: user.userdata_id,
      userinfo_id: user.userinfo_id,
      account_id: user.account_id,
      userid: user.userid,
      debug_id: user.debug_id,
      parent: Boolean(user.parent),
      session_id: session.tokenId,
    },
    process.env.JWT_SECRET,
    { expiresIn: `${SESSION_DAYS}d` },
  );

  return { token, expiresAt };
}

module.exports = {
  SESSION_DAYS,
  createSessionToken,
  renewSessionToken,
  getDeviceName,
  getAppVersion,
};
