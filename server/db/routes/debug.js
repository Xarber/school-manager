const express = require('express');
const mongoose = require("mongoose");
const { UserInfo, UserData } = require('../models/User');
const { Debug } = require('../models/Debug');
const paths = require('./paths.js');

const router = express.Router();

router.post(paths.dbGet, async (req, res) => {
  try {
    const user = req.user; // Assuming user is set by authentication middleware
    if (!user) return res.status(401).json({ error: 'User authentication required' });

    const userInfo = await UserInfo.findOne({ _id: user.userinfo_id });;
    if (!userInfo) return res.status(404).json({ error: 'User info not found' });

    const debugData = await Debug.findOne({ _id: user.debug_id }).lean();
    if (!debugData) return res.status(404).json({ error: 'Debug data not found' });

    res.json({ success: true, data: debugData });
  } catch (error) {
    console.error('Get debug data error:', error);
    res.status(500).json({ error: 'Failed to get debug data' });
  }
});

router.post(paths.dbCreate, async (req, res) => {
    // Can't create a new debug data from here. Use authentication instead.
    res.status(400).json({ error: 'Bad request' });
});

router.post(paths.dbDelete, async (req, res) => {    
    // Can't delete a debug data from here. Use authentication instead.
    res.status(400).json({ error: 'Bad request' });
});

router.post(paths.dbUpdate, async (req, res) => {
  try {
    const user = req.user; // Assuming user is set by authentication middleware
    if (!user) return res.status(401).json({ error: 'User authentication required' });

    let debugData = await Debug.findOne({ _id: user.userid });
    if (!debugData) {
      const newDebug = new Debug({
        userid: user.userid,
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
      await newDebug.save();
      debugData = newDebug;
    }

    const { data } = req.body;
    if (!data) return res.status(400).json({ error: 'Data is required' });

    debugData.firstLaunch = data.firstLaunch || debugData.firstLaunch;
    debugData.firstLaunchDate = data.firstLaunchDate || debugData.firstLaunchDate;
    debugData.lastLaunchDate = data.lastLaunchDate || debugData.lastLaunchDate;
    debugData.launchCount = data.launchCount || debugData.launchCount;
    debugData.appVersion = data.appVersion || debugData.appVersion;
    debugData.errorLogs = (data.errorLogs && data.errorLogs.length > 0) ? debugData.errorLogs.concat(data.errorLogs) : debugData.errorLogs;
    debugData.performanceMetrics = (data.performanceMetrics && data.performanceMetrics.length > 0) ? debugData.performanceMetrics.concat(data.performanceMetrics) : debugData.performanceMetrics;
    debugData.editedAt = Date.now();

    await debugData.save();

    res.json({ success: true });
  } catch (error) {
    console.error('Update debug data error:', error);
    res.status(500).json({ error: 'Failed to update debug data' });
  }
});

module.exports = router;