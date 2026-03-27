const express = require('express');
const mongoose = require("mongoose");
const { Lesson } = require("../../models/Lesson");
const { UserInfo, UserData } = require('../../models/User');
const { Subject } = require("../../models/Subject");
const { Class } = require("../../models/Class");
const paths = require('../paths.js');
const { idGenerate } = require('../../idgenerator');

const router = express.Router();

router.post(paths.dbGet, async (req, res) => {
  try {
    const user = req.user; // Assuming user is set by authentication middleware
    const { lessonid } = req.body;

    if (!user) return res.status(401).json({ error: req.t("errors.not_authenticated") });
    if (!lessonid) return res.status(400).json({ error: req.t("errors.lessonid_required") });

    const userInfo = await UserInfo.findOne({ _id: user.userinfo_id });
    if (!userInfo) return res.status(404).json({ error: req.t("errors.user_not_found") });

    let classInfo, subjectInfo;
    subjectInfo = await Subject.findOne({ lessons: lessonid });
    classInfo = await Class.findOne({ subjects: subjectInfo._id });

    if (!classInfo) return res.status(404).json({ error: req.t("errors.class_not_found") });
    if (!subjectInfo) return res.status(404).json({ error: req.t("errors.subject_not_found") });

    if (
      !classInfo.students.some(t => t.equals(user.userinfo_id))
      && !classInfo.teachers.some(t => t.equals(user.userinfo_id))
    ) return res.status(403).json({ error: req.t("errors.class_access_denied") });

    //* Get schedule for lesson (users and teachers)

    return res.json({ success: true }); //! Add data
  } catch (error) {
    console.error('Get schedule error:', error);
    res.status(500).json({ error: req.t("errors.request_responses.fail.get_schedule"), dbError: error });
  }
});

router.post(paths.dbCreate, async (req, res) => {
  try {
    const user = req.user; // Assuming user is set by authentication middleware
    const { lessonid } = req.body;

    if (!user) return res.status(401).json({ error: req.t("errors.not_authenticated") });
    if (!lessonid) return res.status(400).json({ error: req.t("errors.lessonid_required") });

    const userInfo = await UserInfo.findOne({ _id: user.userinfo_id });
    if (!userInfo) return res.status(404).json({ error: req.t("errors.user_not_found") });

    let classInfo, subjectInfo;
    subjectInfo = await Subject.findOne({ lessons: lessonid });
    classInfo = await Class.findOne({ subjects: subjectInfo._id });

    if (!classInfo) return res.status(404).json({ error: req.t("errors.class_not_found") });
    if (!subjectInfo) return res.status(404).json({ error: req.t("errors.subject_not_found") });

    if (
      !classInfo.teachers.some(t => t.equals(user.userinfo_id))
    ) return res.status(403).json({ error: req.t("errors.schedule_update_teacher_only") });

    //* Update or create schedule for lesson (add days, move users etc.)

    let response = { success: true };
    //if created then add data: _id to response
    return res.json(response);
  } catch (error) {
    console.error('Update schedule error:', error);
    res.status(500).json({ error: req.t("errors.request_responses.fail.update_schedule"), dbError: error });
  }
});

router.post(paths.dbDelete, async (req, res) => {
  try {
    const user = req.user; // Assuming user is set by authentication middleware
    const { lessonid } = req.body;

    if (!user) return res.status(401).json({ error: req.t("errors.not_authenticated") });
    if (!lessonid) return res.status(400).json({ error: req.t("errors.lessonid_required") });

    const userInfo = await UserInfo.findOne({ _id: user.userinfo_id });
    if (!userInfo) return res.status(404).json({ error: req.t("errors.user_not_found") });

    let classInfo, subjectInfo;
    subjectInfo = await Subject.findOne({ lessons: lessonid });
    classInfo = await Class.findOne({ subjects: subjectInfo._id });

    if (!classInfo) return res.status(404).json({ error: req.t("errors.class_not_found") });
    if (!subjectInfo) return res.status(404).json({ error: req.t("errors.subject_not_found") });

    if (
      !classInfo.teachers.some(t => t.equals(user.userinfo_id))
    ) return res.status(403).json({ error: req.t("errors.schedule_delete_teacher_only") });

    //* Clear schedule for lesson

    return res.json({ success: true });
  } catch (error) {
    console.error('Delete schedule error:', error);
    res.status(500).json({ error: req.t("errors.request_responses.fail.delete_schedule"), dbError: error });
  }
});

router.post(paths.dbUpdate, async (req, res) => {
  try {
    const user = req.user; // Assuming user is set by authentication middleware
    const { lessonid } = req.body;

    if (!user) return res.status(401).json({ error: req.t("errors.not_authenticated") });
    if (!lessonid) return res.status(400).json({ error: req.t("errors.lessonid_required") });

    const userInfo = await UserInfo.findOne({ _id: user.userinfo_id });
    if (!userInfo) return res.status(404).json({ error: req.t("errors.user_not_found") });

    let classInfo, subjectInfo;
    subjectInfo = await Subject.findOne({ lessons: lessonid });
    classInfo = await Class.findOne({ subjects: subjectInfo._id });

    if (!classInfo) return res.status(404).json({ error: req.t("errors.class_not_found") });
    if (!subjectInfo) return res.status(404).json({ error: req.t("errors.subject_not_found") });

    if (
      !classInfo.teachers.some(t => t.equals(user.userinfo_id))
      && !classInfo.students.some(t => t.equals(user.userinfo_id))
    ) return res.status(403).json({ error: req.t("errors.class_access_denied") });

    //* Register response for schedule

    return res.json({ success: true });
  } catch (error) {
    console.error('Update schedule error:', error);
    res.status(500).json({ error: req.t("errors.request_responses.fail.update_schedule"), dbError: error });
  }
});

module.exports = router;