const jwt = require('jsonwebtoken');
const { Session } = require('../models/Session');
const { Account } = require('../models/Account');

module.exports = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (typeof decoded.session_id !== 'string') return next();

    const session = await Session.findOne({
      tokenId: decoded.session_id,
      account_id: decoded.account_id,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    });
    if (!session) return next();

    const account = await Account.findById(decoded.account_id).select('active locked');
    if (!account || account.locked || !account.active) return next();

    if (Date.now() - session.lastUsedAt.getTime() > 5 * 60 * 1000) {
      session.lastUsedAt = new Date();
      await session.save();
    }
    req.user = decoded;
    return next();  // Pass to next (load data)
  } catch (err) {
    return next();
  }
};
