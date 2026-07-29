const express = require('express');
const mongoose = require("mongoose");
const { UserInfo, UserData } = require('../models/User');
const { Debug } = require('../models/Debug');
const paths = require('./paths.js');

const router = express.Router();

router.post(paths.dbGet, async (req, res) => {
  try {
    const user = req.user; // Assuming user is set by authentication middleware
    if (!user) return res.status(401).json({ error: req.t("errors.not_authenticated") });

    const userInfo = await UserInfo.findOne({ _id: user.userinfo_id });;
    if (!userInfo) return res.status(404).json({ error: req.t("errors.user_not_found") });

    const debugData = await Debug.findOne({ _id: user.debug_id }).lean();
    if (!debugData) return res.status(404).json({ error: req.t("errors.debug_not_found") });

    res.json({ success: true, data: debugData });
  } catch (error) {
    console.error('Get debug data error:', error);
    res.status(500).json({ error: req.t("errors.request_responses.fail.get_debug_data"), dbError: error});
  }
});

router.post(paths.dbCreate, async (req, res) => {
    // Can't create a new debug data from here. Use authentication instead.
    res.status(400).json({ error: req.t("errors.bad_request") });
});

router.post(paths.dbDelete, async (req, res) => {    
    // Can't delete a debug data from here. Use authentication instead.
    res.status(400).json({ error: req.t("errors.bad_request") });
});

router.post(paths.dbUpdate, async (req, res) => {
  try {
    const user = req.user; // Assuming user is set by authentication middleware
    if (!user) return res.status(401).json({ error: req.t("errors.not_authenticated") });

    let debugData = await Debug.findOne({ _id: user.debug_id });
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

    const { firstLaunch, firstLaunchDate, lastLaunchDate, launchCount, appVersion, errorLogs, performanceMetrics } = req.body;

    const data = {
      firstLaunch,
      firstLaunchDate,
      lastLaunchDate,
      launchCount,
      appVersion,
      errorLogs,
      performanceMetrics
    };
    if (!data) return res.status(400).json({ error: req.t("errors.data_required") });
    if (errorLogs !== undefined && !Array.isArray(errorLogs)) return res.status(400).json({ error: req.t("errors.bad_request") });
    if (performanceMetrics !== undefined && !Array.isArray(performanceMetrics)) return res.status(400).json({ error: req.t("errors.bad_request") });

    debugData.firstLaunch = data.firstLaunch || debugData.firstLaunch;
    debugData.firstLaunchDate = data.firstLaunchDate || debugData.firstLaunchDate;
    debugData.lastLaunchDate = data.lastLaunchDate || debugData.lastLaunchDate;
    debugData.launchCount = data.launchCount || debugData.launchCount;
    debugData.appVersion = data.appVersion || debugData.appVersion;
    const newErrorLogs = (data.errorLogs || [])
      .filter(value => typeof value === 'string')
      .map(value => value.slice(0, 10_000))
      .slice(-25);
    const newPerformanceMetrics = (data.performanceMetrics || []).slice(-25);
    debugData.errorLogs = debugData.errorLogs.concat(newErrorLogs).slice(-100);
    debugData.performanceMetrics = debugData.performanceMetrics.concat(newPerformanceMetrics).slice(-100);
    debugData.editedAt = Date.now();

    await debugData.save();

    res.json({ success: true });
  } catch (error) {
    console.error('Update debug data error:', error);
    res.status(500).json({ error: req.t("errors.request_responses.fail.update_debug_data"), dbError: error });
  }
});

module.exports = router;
