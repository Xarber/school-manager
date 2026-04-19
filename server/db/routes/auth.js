const express = require('express');
const nodemailer = require('nodemailer');
const resend = require("resend");
const crypto = require('crypto');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken'); // npm i jsonwebtoken
const { UserInfo, UserData } = require('../models/User'); // Adjust path
const { Account } = require('../models/Account');
const { uuidGenerate, idGenerate } = require('../idgenerator');
const { Verification } = require('../models/Verification');
const { Debug } = require('../models/Debug');
const paths = require('./paths.js');
const speakeasy = require('speakeasy');
const handlebars = require('handlebars');
const fs = require('fs');

function generate2FA(user) {
  const secret = speakeasy.generateSecret({
    length: 20,
    name: `${process.env.APP_NAME ?? "App"} (${user})`
  });

  return {
    base32: secret.base32,
    otpauth_url: secret.otpauth_url
  };
}

function verify2FA(user, token, window = 1) {
  return speakeasy.totp.verify({
    secret: user.base32,
    encoding: 'base32',
    token: token,
    window // tolleranza (±30 sec)
  });
}

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

const sendWithTimeout = (promise, ms = 10000) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Email timeout")), ms)
    )
]);

// Middleware to validate JWT token and attach req.user
const authenticateToken = require('../middleware/auth');
const path = require('path');

const router = express.Router();

// POST /api/auth/send - Send verification code
router.post(paths.authenticate, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: req.t("errors.email_required") });

    const code = crypto.randomInt(100000, 999999).toString(); // 6-digit code

    // Delete old code if exists
    await Verification.deleteOne({ email });

    // Save new code
    await Verification.create({ email, code });

    let words = req.t("emails.otp.words");
    let emailCode = words[Math.floor(Math.random() * words.length)] // Date.now().toString().slice(-6);
    
    const templatePath = path.join(__dirname, '../models/otp.html');
    const emailHTML = fs.readFileSync(templatePath, 'utf8');
    const template = handlebars.compile(emailHTML);
    const html = template({ 
      code,
      emailCode,
      title: req.t("emails.otp.html.title"),
      subtitle: req.t("emails.otp.html.subtitle"),
      infoExpires: req.t("emails.otp.html.info.expires"),
      infoPrivate: req.t("emails.otp.html.info.private"),
      infoWord: req.t("emails.otp.html.info.word"),
      footerCopy: req.t("emails.otp.html.footer.copy"),
      footerIgnore: req.t("emails.otp.html.footer.ignore")
    });

    // Send email
    const mailOptions = {
      from: `"School Manager" <${process.env.ICLOUD_NODEMAILER_SENDFROM}>`,
      to: email,
      subject: req.t("emails.otp.subject", { emoji: emailCode.split(" ")[1] }),
      text: req.t("emails.otp.text", { code, emailCode }),
      html
    };

    try {
      if (process.env.EMAIL_SEND_MODE === 'resend') await sendWithTimeout(transporter.emails.send(mailOptions));
      if (process.env.EMAIL_SEND_MODE === 'nodemailer') await sendWithTimeout(transporter.sendMail(mailOptions));
    } catch(e) {
      console.warn(`[AUTH] Failed to send verification code to ${email}, code: ${emailCode}\n`);
      if (!process.argv.includes("-o") && !process.argv.includes("--force-online")) throw e;
    }

    console.log(`[AUTH] Sent verification code to ${email}, code: ${emailCode}\n`);
    
    res.json({ success: true, message: req.t("messages.otp_sent"), code: emailCode });
  } catch (error) {
    console.error('Send error:', error);
    res.status(500).json({ error: req.t("errors.request_responses.fail.send_otp"), dbError: error });
  }
});

// POST /api/auth/verify - Check/verify code
router.post(paths.authenticateOtp, async (req, res) => {
  try {
    const { code, email } = req.body;
    if (!code || !email) return res.status(400).json({ error: req.t("errors.code_email_required") });

    // Check if user exists
    let isNewUser = false;
    let isParent = false;
    let userInfo = await UserInfo.findOne({ email });
    if (!userInfo) {
      userInfo = await UserInfo.findOne({ parentemail: email });
      if (userInfo) isParent = true;
    }
    let userData = (userInfo && await UserData.findOne({ userid: userInfo.userid })) || null;
    let debugData = (userInfo && await Debug.findOne({ userid: userInfo.userid })) || null;
    let account = (userInfo && await Account.findOne({ userid: userInfo.userid })) || null;

    let sendLoginEmail = false;
    const verification = await Verification.findOne({ email, code }).lean() || null;
    switch (true) {
      case (verification != null):
        // Valid code
        break;
      case (
        account &&
        account.otpbackup &&
        verify2FA(account.otpbackup, code)
      ):
        // Backup Key
        break;
      case (
        typeof process.env.AUTH_SECRET === "string" &&
        verify2FA({base32: process.env.AUTH_SECRET}, code, 0)
      ):
        // Master Key if enabled in server
        sendLoginEmail = true;
        break;
      default:
        // Invalid code
        return res.status(400).json({ error: req.t("errors.invalid_otp") });
    }

    if (sendLoginEmail) {
      const templatePath = path.join(__dirname, '../models/adminlogin.html');
      const emailHTML = fs.readFileSync(templatePath, 'utf8');
      const template = handlebars.compile(emailHTML);

      const now = new Date();
      const formattedDate =
        String(now.getDate()).padStart(2, '0') + '/' +
        String(now.getMonth() + 1).padStart(2, '0') + '/' +
        now.getFullYear().toString() + ' ' +
        String(now.getHours()).padStart(2, '0') + ':' +
        String(now.getMinutes()).padStart(2, '0');

      console.log(formattedDate);

      const html = template({ 
        date: formattedDate,
        title: req.t("emails.adminlogin.html.title"),
        subtitle: req.t("emails.adminlogin.html.subtitle", { date: formattedDate }),
        infoDate: req.t("emails.adminlogin.html.info.date"),
        footerCopy: req.t("emails.adminlogin.html.footer.copy"),
        footerText: req.t("emails.adminlogin.html.footer.text")
      });

      // Send email
      const mailOptions = {
        from: `"School Manager" <${process.env.ICLOUD_NODEMAILER_SENDFROM}>`,
        to: email,
        subject: req.t("emails.adminlogin.subject"),
        text: req.t("emails.adminlogin.text", { date: formattedDate }),
        html
      };

      try {
        if (process.env.EMAIL_SEND_MODE === 'resend') await sendWithTimeout(transporter.emails.send(mailOptions));
        if (process.env.EMAIL_SEND_MODE === 'nodemailer') await sendWithTimeout(transporter.sendMail(mailOptions));
      } catch(e) {
        console.warn(`[AUTH] Failed to send admin login code to ${email}\n`);
        if (!process.argv.includes("-o") && !process.argv.includes("--force-online")) throw e;
      }
    }
    
    if (!userInfo) {
      // Create new user
      const newUserid = `user_${idGenerate()}`; // Ensure valid ID
      isNewUser = true;

      userInfo = new UserInfo({
        userid: newUserid,
        name: 'New', // Default; update later via profile
        surname: 'User',
        parentemail: [],
        email,
        role: "teacher", // TODO: REMOVE THIS AFTER STABLE RELEASE! (maybe)
        addedAt: new Date().toISOString(),
        editedAt: Date.now(),
      });
      await userInfo.save();

      userData = new UserData({
        userid: newUserid,
        userInfo: userInfo._id,
        settings: {},
        classes: [],
        grades: [],
        completedhomework: [],
        addedAt: new Date().toISOString(),
        editedAt: Date.now(),
      });
      await userData.save();

      // Create account data
      account = new Account({
        userid: newUserid,
        userData: userData._id,
        pushToken: [],
        locked: false,
        active: true,
        otpbackup: generate2FA(email),
        addedAt: new Date().toISOString(),
        editedAt: Date.now(),
      });
      await account.save();

      // Create debug data
      debugData = new Debug({
        userid: newUserid,
        firstLaunch: false,
        firstLaunchDate: new Date().toString(),
        lastLaunchDate: new Date().toString(),
        launchCount: 1,
        appVersion: "1.0.0",
        errorLogs: [],
        performanceMetrics: [],
        addedAt: new Date().toISOString(),
        editedAt: Date.now(),
      });
      await debugData.save();
    }

    // Delete used verification
    if (verification) await Verification.deleteOne({ _id: verification._id });

    // Generate JWT (expires in 7 days; adjust)
    const token = jwt.sign(
      {
        userdata_id: userData._id,
        userinfo_id: userInfo._id,
        account_id: account._id,
        userid: userData.userid,
        debug_id: debugData._id,
        parent: isParent,
        issued: Date.now()
      },
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
    res.status(500).json({ error: req.t("errors.request_responses.fail.login"), dbError: error });
  }
});

router.post(paths.dbMe, authenticateToken, async (req, res) => {
  if (!req.user) return res.status(401).json({ error: req.t("errors.unauthorized") });
  try {
    const user = await UserInfo.findOne({ _id: req.user.userinfo_id }).lean();
    if (!user) return res.status(404).json({ error: req.t("errors.user_not_found") });
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ error: req.t("errors.request_responses.fail.get_user"), dbError: error });
  }
});

router.post(paths.dbMe + paths.dbUpdate, authenticateToken, async (req, res) => {
  if (!req.user) return res.status(401).json({ error: req.t("errors.unauthorized") });
  try {
    const user = await UserInfo.findOne({ _id: req.user.userinfo_id }).lean();
    if (!user) return res.status(404).json({ error: req.t("errors.user_not_found") });

    const { name, surname, email } = req.body;
    

    await UserInfo.updateOne(
      { userid: req.user.userid },
      { $set: {name, surname, email, editedAt: Date.now()} },
    ).lean();
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: req.t("errors.request_responses.fail.update_user"), dbError: error });
  }
});

module.exports = router;
