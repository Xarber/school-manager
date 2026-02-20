const express = require('express');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken'); // npm i jsonwebtoken
const { UserInfo, UserData } = require('../models/User'); // Adjust path
const dotenv = require("dotenv");
const { uuidGenerate, idGenerate } = require('../idgenerator');
const { Verification } = require('../models/Verification');
dotenv.config();

const transporter = nodemailer.createTransport({
  host: 'smtp.mail.me.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.ICLOUD_NODEMAILER_USER,
    pass: process.env.ICLOUD_NODEMAILER_PWD
  }
});

// Middleware to validate JWT token and attach req.user
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  if (!token) return res.status(401).json({ error: 'Access token required' });

  // Replace with your JWT verify logic (jwt.verify)
  // For example: const jwt = require('jsonwebtoken'); const decoded = jwt.verify(token, process.env.JWT_SECRET);
  // Assume token contains { userid: 'user123' }
  // For demo, mock decode (replace with real)
  let decoded;
  try {
    // Mock: in real, jwt.verify(token, secret)
    decoded = { userid: 'demo-userid-from-token' }; // Extract from actual token
  } catch (err) {
    return res.status(403).json({ error: 'Invalid token' });
  }
  req.user = decoded;
  next();
};

const router = express.Router();

// POST /api/auth/send - Send verification code
router.post('/send', authenticateToken, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const code = crypto.randomBytes(3).toString('hex').toUpperCase(); // 6-char hex code

    // Delete old code if exists
    await Verification.deleteOne({ email });

    // Save new code
    await Verification.create({ email, code });

    // Send email
    const mailOptions = {
      from: `"School Manager" <${process.env.ICLOUD_NODEMAILER_SENDFROM}>`,
      to: email,
      subject: 'Your Verification Code',
      text: `Your verification code is: ${code}. It expires in 5 minutes.`
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: 'Verification code sent' });
  } catch (error) {
    console.error('Send error:', error);
    res.status(500).json({ error: 'Failed to send code' });
  }
});

// POST /api/auth/verify - Check/verify code
router.post('/verify', async (req, res) => {
  try {
    const { code, email } = req.body;
    if (!code || !email) return res.status(400).json({ error: 'Code and email required' });

    const verification = await Verification.findOne({ email, code }).lean();
    if (!verification) return res.status(400).json({ error: 'Invalid or expired code' });

    const { userid } = verification;

    // Check if user exists
    let isNewUser = false;
    let userInfo = await UserInfo.findOne({ email });
    let userData = await UserData.findOne({ userid });

    if (!userInfo || !userData) {
      // Create new user
      const newUserid = userid || idGenerate(); // Ensure valid ID
      isNewUser = true;

      userInfo = new UserInfo({
        userid: newUserid,
        name: 'New', // Default; update later via profile
        surname: 'User',
        email,
        role: 'student'
      });
      await userInfo.save();

      userData = new UserData({
        userid: newUserid,
        name: 'New User',
        birthday: '',
        userInfo: userInfo._id,
        settings: {
          theme: 'system',
          notifications: false,
          language: 'en',
          activeClassId: '',
          calendarSync: {
            enabled: false,
            homework: false,
            schedule: false,
            comunications: false,
            exams: false
          }
        },
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
      isNewUser,
      user: {
        userid: userData.userid,
        email: userInfo.email,
        name: userInfo.name,
        surname: userInfo.surname,
        role: userInfo.role
      }
    });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;