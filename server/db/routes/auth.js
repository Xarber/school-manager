const express = require('express');
const nodemailer = require('nodemailer');
const resend = require("resend");
const crypto = require('crypto');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken'); // npm i jsonwebtoken
const { UserInfo, UserData } = require('../models/User'); // Adjust path
const { uuidGenerate, idGenerate } = require('../idgenerator');
const { Verification } = require('../models/Verification');
const paths = require('./paths.js');

let transporter;

if (process.env.EMAIL_SEND_MODE === 'resend') {
  transporter = new resend.Resend(process.env.RESEND_API_KEY);
} else if (process.env.EMAIL_SEND_MODE === 'nodemailer') {
  transporter = nodemailer.createTransport({
    host: 'smtp.mail.me.com',
    port: 587,
    secure: false,

    auth: {
      user: process.env.ICLOUD_NODEMAILER_USER,
      pass: process.env.ICLOUD_NODEMAILER_PWD
    },
    requireTLS: true
  });
}

// Middleware to validate JWT token and attach req.user
const authenticateToken = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/send - Send verification code
router.post(paths.authenticate, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const code = crypto.randomInt(100000, 999999).toString(); // 6-digit code

    // Delete old code if exists
    await Verification.deleteOne({ email });

    // Save new code
    await Verification.create({ email, code });

    // Send email
    const mailOptions = {
      from: `"School Manager" <${process.env.ICLOUD_NODEMAILER_SENDFROM}>`,
      to: email,
      subject: 'Your Verification Code',
      text: `Your verification code is: ${code}. It expires in 5 minutes.\nIf you did not request this, please ignore this email.`,
      html: `<p>Your verification code is: <strong>${code}</strong>.</p><p>It expires in 5 minutes.</p><p>If you did not request this, please ignore this email.</p>`
    };

    if (process.env.EMAIL_SEND_MODE === 'resend') await transporter.emails.send(mailOptions);
    if (process.env.EMAIL_SEND_MODE === 'nodemailer') await transporter.sendMail(mailOptions);
    
    res.json({ success: true, message: 'Verification code sent' });
  } catch (error) {
    console.error('Send error:', error);
    res.status(500).json({ error: 'Failed to send code' });
  }
});

// POST /api/auth/verify - Check/verify code
router.post(paths.authenticateOtp, async (req, res) => {
  try {
    const { code, email } = req.body;
    if (!code || !email) return res.status(400).json({ error: 'Code and email required' });

    const verification = await Verification.findOne({ email, code }).lean();
    if (!verification) return res.status(400).json({ error: 'Invalid or expired code' });

    // Check if user exists
    let isNewUser = false;
    let userInfo = await UserInfo.findOne({ email });
    let userData = (userInfo && await UserData.findOne({ userid: userInfo.userid })) || null;

    if (!userInfo) {
      // Create new user
      const newUserid = `user_${idGenerate()}`; // Ensure valid ID
      isNewUser = true;

      userInfo = new UserInfo({
        userid: newUserid,
        name: 'New', // Default; update later via profile
        surname: 'User',
        email
      });
      await userInfo.save();

      userData = new UserData({
        userid: newUserid,
        userInfo: userInfo._id,
        settings: {},
        classes: [],
        grades: [],
        completedhomework: []
      });
      await userData.save();
    }

    // Delete used verification
    await Verification.deleteOne({ _id: verification._id });

    // Generate JWT (expires in 7 days; adjust)
    const token = jwt.sign(
      { userid: userData.userid },
      process.env.JWT_SECRET,
      { expiresIn: '365d' }
    );

    res.json({
      success: true,
      token,
      isNewUser
    });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post(paths.dbMe, authenticateToken, async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const user = await UserInfo.findOne({ userid: req.user.userid }).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post(paths.dbMe + paths.dbUpdate, authenticateToken, async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const user = await UserInfo.findOne({ userid: req.user.userid }).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { name, surname, email } = req.body;
    

    await UserInfo.updateOne(
      { userid: req.user.userid },
      { $set: {...req.body, userid: req.user.userid} }, // Block updating userid
    ).lean();
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;