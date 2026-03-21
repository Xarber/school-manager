const express = require('express');
const mongoose = require("mongoose");
const { UserInfo, UserData } = require('../models/User');
const { Account } = require('../models/Account');
const paths = require('./paths.js');

const router = express.Router();

router.post(paths.dbGet, async (req, res) => {
  try {
    const user = req.user; // Assuming user is set by authentication middleware
    if (!user) return res.status(401).json({ error: 'User authentication required' });

    let populate = ["userInfo"];
    const userData = await UserData.findOne({ _id: user.userdata_id }).populate(populate).exec();
    if (!userData) return res.status(404).json({ error: 'User data not found' });

    res.json({ success: true, data: userData });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user', dbError: error });
  }
});

router.post(paths.dbCreate, async (req, res) => {
    // Can't create a new user from here. Use authentication instead.
    res.status(400).json({ error: 'Bad request' });
});

router.post(paths.dbDelete, async (req, res) => {
    //todo: delete user account (with authentication)
    res.status(400).json({ error: 'Not implemented' });
});

router.post(paths.dbUpdate, async (req, res) => {
  try {
    const user = req.user; // Assuming user is set by authentication middleware
    if (!user) return res.status(401).json({ error: 'User authentication required' });

    const userData = await UserData.findOne({ _id: user.userdata_id });
    if (!userData) return res.status(404).json({ error: 'User data not found' });

    const userInfo = await UserInfo.findOne({ _id: user.userinfo_id });
    if (!userInfo) return res.status(404).json({ error: 'User info not found' });

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
    if (email) userInfo.email = email;
    userInfo.editedAt = Date.now();

    await userInfo.save();

    res.json({ success: true });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user', dbError: error });
  }
});

// Account specific routes

router.post(paths.accountRegisterForPushNotifications, async (req, res) => {
    try {
        const user = req.user; // Assuming user is set by authentication middleware
        if (!user) return res.status(401).json({ error: 'User authentication required' });

        const { pushToken } = req.body;
        if (!pushToken) return res.status(400).json({ error: 'Push token is required' });

        const account = await Account.findOne({ _id: user.account_id });
        if (!account) return res.status(404).json({ error: 'Account not found' });

        if (!account.pushToken.includes(pushToken)) {
            account.editedAt = Date.now();
            account.pushToken.push(pushToken);
            await account.save();
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Register push token error:', error);
        res.status(500).json({ error: 'Failed to register push token', dbError: error });
    }
});

router.post(paths.accountUnregisterForPushNotifications, async (req, res) => {
    try {
        const user = req.user; // Assuming user is set by authentication middleware
        if (!user) return res.status(401).json({ error: 'User authentication required' });

        const { pushToken } = req.body;
        if (!pushToken) return res.status(400).json({ error: 'Push token is required' });

        const account = await Account.findOne({ _id: user.account_id });
        if (!account) return res.status(404).json({ error: 'Account not found' });

        account.pushToken = account.pushToken.filter(token => token !== pushToken);
        account.editedAt = Date.now();
        await account.save();

        res.json({ success: true });
    } catch (error) {
        console.error('Unregister push token error:', error);
        res.status(500).json({ error: 'Failed to unregister push token', dbError: error });
    }
});

module.exports = router;