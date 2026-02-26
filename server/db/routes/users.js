const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Class = require('../models/Class');
const router = express.Router();
const paths = require('./paths.js');

// Load user data + classes (protected)
router.get(paths.dbMe, auth, async (req, res) => {
  try {
    // req.user.userid from token—validated!
    const user = await User.findOne({ userid: req.user.userid })
      .populate('classes');  // Joins classes
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Add user's classes (query separately if needed)
    const classes = await Class.find({ 
      'students.userid': req.user.userid 
    }).populate('students.userid');

    res.json({ user, classes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
