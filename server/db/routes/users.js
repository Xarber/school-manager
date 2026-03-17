const express = require('express');
const auth = require('../middleware/auth');
const { UserData } = require('../models/User');
const { Class } = require('../models/Class');
const router = express.Router();
const paths = require('./paths.js');

// Load user data + classes (protected)
router.get(paths.dbMe, auth, async (req, res) => {
  try {
    // req.user.userid from token—validated!
    const user = await UserData.findOne({ _id: req.user.userdata_id })
      .populate(['userInfo', 'classes']);  // Joins classes
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Add user's classes (query separately if needed)
    const classes = await Class.find({ 
      'students.userid': req.user.userinfo_id
    }).populate('students.userid');

    res.json({ success: true, data: { user, classes } });
  } catch (error) {
    res.status(500).json({ error: "Failed to get user data", dbError: error });
  }
});

module.exports = router;
