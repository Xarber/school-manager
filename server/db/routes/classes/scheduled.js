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

    if (!user) return res.status(401).json({ error: 'User authentication required' });
    if (!lessonid) return res.status(400).json({ error: 'Lesson ID required' });

    const userInfo = await UserInfo.findOne({ _id: user.userinfo_id });
    if (!userInfo) return res.status(404).json({ error: 'User info not found' });

    let classInfo, subjectInfo;
    subjectInfo = await Subject.findOne({ lessons: lessonid });
    classInfo = await Class.findOne({ subjects: subjectInfo._id });

    if (!classInfo) return res.status(404).json({ error: 'Class not found' });
    if (!subjectInfo) return res.status(404).json({ error: 'Subject not found' });

    if (
      !classInfo.students.some(t => t.equals(user.userinfo_id))
      && !classInfo.teachers.some(t => t.equals(user.userinfo_id))
    ) return res.status(403).json({ error: 'Access denied to this class' });

    //* Get schedule for lesson (users and teachers)

    return res.json({ success: true }); //! Add data
  } catch (error) {
    console.error('Get schedule error:', error);
    res.status(500).json({ error: 'Failed to get schedule', dbError: error });
  }
});

router.post(paths.dbCreate, async (req, res) => {
  try {
    const user = req.user; // Assuming user is set by authentication middleware
    const { lessonid } = req.body;

    if (!user) return res.status(401).json({ error: 'User authentication required' });
    if (!lessonid) return res.status(400).json({ error: 'Lesson ID required' });

    const userInfo = await UserInfo.findOne({ _id: user.userinfo_id });
    if (!userInfo) return res.status(404).json({ error: 'User info not found' });

    let classInfo, subjectInfo;
    subjectInfo = await Subject.findOne({ lessons: lessonid });
    classInfo = await Class.findOne({ subjects: subjectInfo._id });

    if (!classInfo) return res.status(404).json({ error: 'Class not found' });
    if (!subjectInfo) return res.status(404).json({ error: 'Subject not found' });

    if (
      !classInfo.teachers.some(t => t.equals(user.userinfo_id))
    ) return res.status(403).json({ error: 'Only teachers can create / update schedules.' });

    //* Update or create schedule for lesson (add days, move users etc.)

    let response = { success: true };
    //if created then add data: _id to response
    return res.json(response);
  } catch (error) {
    console.error('Update schedule error:', error);
    res.status(500).json({ error: 'Failed to update schedule', dbError: error });
  }
});

router.post(paths.dbDelete, async (req, res) => {
  try {
    const user = req.user; // Assuming user is set by authentication middleware
    const { lessonid } = req.body;

    if (!user) return res.status(401).json({ error: 'User authentication required' });
    if (!lessonid) return res.status(400).json({ error: 'Lesson ID required' });

    const userInfo = await UserInfo.findOne({ _id: user.userinfo_id });
    if (!userInfo) return res.status(404).json({ error: 'User info not found' });

    let classInfo, subjectInfo;
    subjectInfo = await Subject.findOne({ lessons: lessonid });
    classInfo = await Class.findOne({ subjects: subjectInfo._id });

    if (!classInfo) return res.status(404).json({ error: 'Class not found' });
    if (!subjectInfo) return res.status(404).json({ error: 'Subject not found' });

    if (
      !classInfo.teachers.some(t => t.equals(user.userinfo_id))
    ) return res.status(403).json({ error: 'Only teachers can delete schedules.' });

    //* Clear schedule for lesson

    return res.json({ success: true });
  } catch (error) {
    console.error('Delete schedule error:', error);
    res.status(500).json({ error: 'Failed to delete schedule', dbError: error });
  }
});

router.post(paths.dbUpdate, async (req, res) => {
  try {
    const user = req.user; // Assuming user is set by authentication middleware
    const { lessonid } = req.body;

    if (!user) return res.status(401).json({ error: 'User authentication required' });
    if (!lessonid) return res.status(400).json({ error: 'Lesson ID required' });

    const userInfo = await UserInfo.findOne({ _id: user.userinfo_id });
    if (!userInfo) return res.status(404).json({ error: 'User info not found' });

    let classInfo, subjectInfo;
    subjectInfo = await Subject.findOne({ lessons: lessonid });
    classInfo = await Class.findOne({ subjects: subjectInfo._id });

    if (!classInfo) return res.status(404).json({ error: 'Class not found' });
    if (!subjectInfo) return res.status(404).json({ error: 'Subject not found' });

    if (
      !classInfo.teachers.some(t => t.equals(user.userinfo_id))
      && !classInfo.students.some(t => t.equals(user.userinfo_id))
    ) return res.status(403).json({ error: 'Access denied to this class' });

    //* Register response for schedule

    return res.json({ success: true });
  } catch (error) {
    console.error('Update schedule error:', error);
    res.status(500).json({ error: 'Failed to update schedule', dbError: error });
  }
});

module.exports = router;