const express = require('express');
const auth = require('../middleware/auth');
const { UserData, UserInfo } = require('../models/User');
const { Class } = require('../models/Class');
const router = express.Router();
const paths = require('./paths.js');

// Load user data + classes (protected)
// router.get(paths.dbMe, auth, async (req, res) => {
//   try {
//     // req.user.userid from token—validated!
//     const user = await UserData.findOne({ _id: req.user.userdata_id })
//       .populate(['userInfo', 'classes']);  // Joins classes
//     if (!user) return res.status(404).json({ error: req.t("errors.user_not_found") });

//     // Add user's classes (query separately if needed)
//     const classes = await Class.find({ 
//       'students.userid': req.user.userinfo_id
//     }).populate('students.userid');

//     res.json({ success: true, data: { user, classes } });
//   } catch (error) {
//     res.status(500).json({ error: req.t("errors.request_responses.fail.get_user"), dbError: error });
//   }
// });

router.post(paths.dbGet, auth, async (req, res) => {
  try {
    const userInfo = await UserInfo.findOne({ _id: req.user.userinfo_id });
    if (!userInfo) return res.status(404).json({ error: req.t("errors.user_not_found") });

    const {userid, classid} = req.body;

    if (!userid) return res.status(400).json({ error: req.t("errors.userid_required") });
    if (!classid) return res.status(400).json({ error: req.t("errors.classid_required") });

    const classInfo = await Class.findOne({ _id: classid });
    if (!classInfo) return res.status(404).json({ error: req.t("errors.class_not_found") });
    if (
      !classInfo.students.some(t => t.equals(req.user.userinfo_id))
      && !classInfo.teachers.some(t => t.equals(req.user.userinfo_id))
    ) return res.status(403).json({ error: req.t("errors.class_access_denied") });
    
    if (
      !classInfo.students.some(t => t.equals(userid))
      && !classInfo.teachers.some(t => t.equals(userid))
    ) return res.status(403).json({ error: req.t("errors.user_not_found") });
    
    const userInfo2 = await UserInfo.findOne({ _id: userid });
    if (!userInfo2) return res.status(404).json({ error: req.t("errors.user_not_found") });

    res.json({ success: true, data: userInfo2 });
  } catch (error) {
    res.status(500).json({ error: req.t("errors.request_responses.fail.get_user"), dbError: error });
  }
});

module.exports = router;
