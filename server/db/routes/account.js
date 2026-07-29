const express = require('express');
const mongoose = require("mongoose");
const { UserInfo, UserData } = require('../models/User');
const { Account } = require('../models/Account');
const { Session } = require('../models/Session');
const { getAppVersion, getDeviceName } = require('../session');
const paths = require('./paths.js');

const router = express.Router();

router.post(paths.dbGet, async (req, res) => {
  try {
    const user = req.user; // Assuming user is set by authentication middleware
    if (!user) return res.status(401).json({ error: req.t("errors.not_authenticated") });

    let populate = ["userInfo"];
    const userData = await UserData.findOne({ _id: user.userdata_id }).populate(populate).exec();
    if (!userData) return res.status(404).json({ error: req.t("errors.user_not_found") });

    res.json({ success: true, data: userData });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: req.t("errors.request_responses.fail.get_user"), dbError: error });
  }
});

router.post(paths.dbCreate, async (req, res) => {
    // Can't create a new user from here. Use authentication instead.
    res.status(400).json({ error: req.t("errors.bad_request") });
});

router.post(paths.dbDelete, async (req, res) => {
    //todo: delete user account (with authentication)
    res.status(400).json({ error: req.t("errors.not_implemented") });
});

router.post(paths.dbUpdate, async (req, res) => {
  try {
    const user = req.user; // Assuming user is set by authentication middleware
    if (!user) return res.status(401).json({ error: req.t("errors.not_authenticated") });

    const userData = await UserData.findOne({ _id: user.userdata_id });
    if (!userData) return res.status(404).json({ error: req.t("errors.user_not_found") });

    const userInfo = await UserInfo.findOne({ _id: user.userinfo_id });
    if (!userInfo) return res.status(404).json({ error: req.t("errors.user_not_found") });

    let fullname = req.body.name;
    const { birthday, settings } = req.body;
    const { name, surname, email } = req.body.userInfo || {};
    if (name && surname) fullname = `${name} ${surname}`;

    // Update user data
    if (birthday) userData.birthday = birthday;
    if (settings) userData.settings = {...userData.settings, ...settings};
    if (name) userData.name = fullname;
    userData.editedAt = Date.now();

    await userData.save();

    // Update user info
    if (name) userInfo.name = name;
    if (surname) userInfo.surname = surname;
    if (email !== undefined && (typeof email !== 'string' || email.trim().toLowerCase() !== userInfo.email)) {
      return res.status(400).json({ error: 'Email changes require verification.' });
    }
    userInfo.editedAt = Date.now();

    await userInfo.save();

    res.json({ success: true });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: req.t("errors.request_responses.fail.update_user"), dbError: error });
  }
});

// Account specific routes

router.post('/sessions/current/metadata', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: req.t('errors.not_authenticated') });

    const session = await Session.findOneAndUpdate(
      {
        account_id: req.user.account_id,
        tokenId: req.user.session_id,
        revokedAt: null,
        expiresAt: { $gt: new Date() },
      },
      {
        $set: {
          deviceName: getDeviceName(req),
          appVersion: getAppVersion(req),
          lastUsedAt: new Date(),
        },
      },
      { new: true },
    );

    if (!session) return res.status(404).json({ error: 'Session not found' });
    return res.json({ success: true, appVersion: session.appVersion });
  } catch (error) {
    console.error('Update session metadata error:', error);
    return res.status(500).json({ error: req.t('errors.generic'), dbError: error });
  }
});

router.post('/sessions', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: req.t('errors.not_authenticated') });

    const sessions = await Session.find({
      account_id: req.user.account_id,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    }).sort({ lastUsedAt: -1 }).lean();

    return res.json({
      success: true,
      data: sessions.map(session => ({
        _id: String(session._id),
        account_id: String(session.account_id),
        tokenId: session.tokenId,
        deviceName: session.deviceName,
        userAgent: session.userAgent,
        appVersion: session.appVersion,
        createdAt: session.createdAt,
        lastUsedAt: session.lastUsedAt,
        expiresAt: session.expiresAt,
        revokedAt: session.revokedAt,
        revokedReason: session.revokedReason,
        current: session.tokenId === req.user.session_id,
      })),
    });
  } catch (error) {
    console.error('List sessions error:', error);
    return res.status(500).json({ error: req.t('errors.generic'), dbError: error });
  }
});

router.post('/sessions/revoke', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: req.t('errors.not_authenticated') });
    const sessionId = req.body?.sessionId;
    if (typeof sessionId !== 'string' || !sessionId) {
      return res.status(400).json({ error: req.t('errors.bad_request') });
    }

    const session = await Session.findOneAndUpdate(
      {
        account_id: req.user.account_id,
        tokenId: sessionId,
        revokedAt: null,
      },
      { $set: { revokedAt: new Date(), revokedReason: 'user' } },
      { new: true },
    );
    if (!session) return res.status(404).json({ error: 'Session not found' });

    return res.json({ success: true, current: session.tokenId === req.user.session_id });
  } catch (error) {
    console.error('Revoke session error:', error);
    return res.status(500).json({ error: req.t('errors.generic'), dbError: error });
  }
});

router.post(paths.accountRegisterForPushNotifications, async (req, res) => {
    try {
        const user = req.user; // Assuming user is set by authentication middleware
        if (!user) return res.status(401).json({ error: req.t("errors.not_authenticated") });

        const { pushToken } = req.body;
        if (!pushToken) return res.status(400).json({ error: req.t("errors.push_token_required") });

        const account = await Account.findOne({ _id: user.account_id });
        if (!account) return res.status(404).json({ error: req.t("errors.account_not_found") });

        if (!account.pushToken.includes(pushToken)) {
            account.editedAt = Date.now();
            account.pushToken.push(pushToken);
            await account.save();
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Register push token error:', error);
        res.status(500).json({ error: req.t("errors.request_responses.fail.register_push_token"), dbError: error });
    }
});

router.post(paths.accountUnregisterForPushNotifications, async (req, res) => {
    try {
        const user = req.user; // Assuming user is set by authentication middleware
        if (!user) return res.status(401).json({ error: req.t("errors.not_authenticated") });

        const { pushToken } = req.body;
        if (!pushToken) return res.status(400).json({ error: req.t("errors.push_token_required") });

        const account = await Account.findOne({ _id: user.account_id });
        if (!account) return res.status(404).json({ error: req.t("errors.account_not_found") });

        account.pushToken = account.pushToken.filter(token => token !== pushToken);
        account.editedAt = Date.now();
        await account.save();

        res.json({ success: true });
    } catch (error) {
        console.error('Unregister push token error:', error);
        res.status(500).json({ error: req.t("errors.request_responses.fail.unregister_push_token"), dbError: error });
    }
});

module.exports = router;
