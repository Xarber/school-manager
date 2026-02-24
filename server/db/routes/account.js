const express = require('express');
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const { UserInfo, UserData } = require('../models/User');
const paths = require('./paths.json');
dotenv.config();

const router = express.Router();

router.post(paths.dbGet, async (req, res) => {
  try {
    const user = req.user; // Assuming user is set by authentication middleware
    if (!user) return res.status(401).json({ error: 'User authentication required' });

    const userData = await UserData.findOne({ userid: user.userid }).populate('userInfo').lean();
    if (!userData) return res.status(404).json({ error: 'User data not found' });

    res.json({ success: true, data: userData });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
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

    const userData = await UserData.findOne({ userid: user.userid });
    if (!userData) return res.status(404).json({ error: 'User data not found' });

    const userInfo = await UserInfo.findOne({ userid: user.userid });
    if (!userInfo) return res.status(404).json({ error: 'User info not found' });

    let fullname = req.body.name;
    const { birthday, settings } = req.body;
    const { name, surname, email } = req.body.userInfo || {};
    if (name && surname) fullname = `${name} ${surname}`;

    // Update user data
    const updateData = {};
    if (birthday) updateData.birthday = birthday;
    if (settings) updateData.settings = settings;
    if (name) updateData.name = fullname;

    await UserData.updateOne({ userid: user.userid }, { $set: updateData });

    // Update user info
    const updateInfo = {};
    if (name) updateInfo.name = name;
    if (surname) updateInfo.surname = surname;
    if (email) updateInfo.email = email;

    await UserInfo.updateOne({ userid: user.userid }, { $set: updateInfo });

    res.json({ success: true });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

module.exports = router;