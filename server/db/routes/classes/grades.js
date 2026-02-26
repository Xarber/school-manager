const express = require('express');
const mongoose = require("mongoose");
const { Grade } = require("../../models/Grade");
const { Subject } = require("../../models/Subject");
const { Class } = require("../../models/Class");
const { UserInfo, UserData } = require('../../models/User');
const paths = require('../paths.js');
const { idGenerate } = require('../../idgenerator');

const router = express.Router();

router.post(paths.dbGet, async (req, res) => {
  try {
    const user = req.user; // Assuming user is set by authentication middleware
    const { classid, subjectid } = req.body;
    const targetuserid = req.body.targetuserid || user.userid;

    if (!user) return res.status(401).json({ error: 'User authentication required' });
    if (!classid) return res.status(400).json({ error: 'Class ID required' });
    if (!subjectid) return res.status(400).json({ error: 'Subject ID required' });

    const userInfo = await UserInfo.findOne({ userid: user.userid });
    if (!userInfo) return res.status(404).json({ error: 'User info not found' });

    if (targetuserid && targetuserid !== user.userid) {
      if (userInfo.role !== 'teacher') return res.status(403).json({ error: 'Only teachers can view other students grades' });
    }

    let targetUserInfo = (targetuserid === user.userid) ? userInfo : await UserInfo.findOne({ userid: targetuserid });
    if (!targetUserInfo) return res.status(404).json({ error: 'Target user info not found' });

    const grades = await Grade.find({ classid, subjectid, userid: targetUserInfo.userid }).lean();

    res.json({ success: true, data: grades });
  } catch (error) {
    console.error('Get grades error:', error);
    res.status(500).json({ error: 'Failed to get grades' });
  }
});

router.post(paths.dbCreate, async (req, res) => {
  try {
    const user = req.user; // Assuming user is set by authentication middleware
    const { classid, subjectid, homeworkid } = req.body;
    const targetuserid = req.body.targetuserid || user.userid;

    if (!user) return res.status(401).json({ error: 'User authentication required' });
    if (!classid) return res.status(400).json({ error: 'Class ID required' });
    if (!subjectid) return res.status(400).json({ error: 'Subject ID required' });

    const userInfo = await UserInfo.findOne({ userid: user.userid });
    if (!userInfo) return res.status(404).json({ error: 'User info not found' });

    if (targetuserid && targetuserid !== user.userid) {
      if (userInfo.role !== 'teacher') return res.status(403).json({ error: 'Only teachers can change other students grades' });
    }

    let targetUserInfo = (targetuserid === user.userid) ? userInfo : await UserInfo.findOne({ userid: targetuserid });
    if (!targetUserInfo) return res.status(404).json({ error: 'Target user info not found' });

    const { grade, title, gradeTitle, type } = req.body;
    if (!grade) return res.status(400).json({ error: 'Grade value required' });

    const newGrade = new Grade({
      gradeid: `grade_${idGenerate()}`,
      classid,
      subjectid,
      homeworkid,
      user: targetUserInfo._id,
      grade,
      title: title || '',
      gradeTitle: gradeTitle || grade.toString(),
      type: type || 'other',
      addedAt: new Date().toISOString(),
    });
    await newGrade.save();

    res.json({ success: true, data: newGrade.gradeid });
  } catch (error) {
    console.error('Create grade error:', error);
    res.status(500).json({ error: 'Failed to create grade' });
  }
});

router.post(paths.dbDelete, async (req, res) => {
  try {
    const user = req.user; // Assuming user is set by authentication middleware
    const { classid, subjectid, gradeid } = req.body;
    const targetuserid = req.body.targetuserid || user.userid;

    if (!user) return res.status(401).json({ error: 'User authentication required' });
    if (!classid) return res.status(400).json({ error: 'Class ID required' });
    if (!subjectid) return res.status(400).json({ error: 'Subject ID required' });
    if (!gradeid) return res.status(400).json({ error: 'Grade ID required' });

    const userInfo = await UserInfo.findOne({ userid: user.userid });
    if (!userInfo) return res.status(404).json({ error: 'User info not found' });

    if (targetuserid && targetuserid !== user.userid) {
      if (userInfo.role !== 'teacher') return res.status(403).json({ error: 'Only teachers can delete other students grades' });
    }

    let targetUserInfo = (targetuserid === user.userid) ? userInfo : await UserInfo.findOne({ userid: targetuserid });
    if (!targetUserInfo) return res.status(404).json({ error: 'Target user info not found' });

    await Grade.deleteOne({ gradeid, classid, subjectid, user: targetUserInfo._id });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete grades error:', error);
    res.status(500).json({ error: 'Failed to delete grades' });
  }
});

router.post(paths.dbUpdate, async (req, res) => {
  try {
    const user = req.user; // Assuming user is set by authentication middleware
    const { classid, subjectid, gradeid } = req.body;
    const targetuserid = req.body.targetuserid || user.userid;

    if (!user) return res.status(401).json({ error: 'User authentication required' });
    if (!classid) return res.status(400).json({ error: 'Class ID required' });
    if (!subjectid) return res.status(400).json({ error: 'Subject ID required' });
    if (!gradeid) return res.status(400).json({ error: 'Grade ID required' });

    const userInfo = await UserInfo.findOne({ userid: user.userid });
    if (!userInfo) return res.status(404).json({ error: 'User info not found' });

    if (targetuserid && targetuserid !== user.userid) {
      if (userInfo.role !== 'teacher') return res.status(403).json({ error: 'Only teachers can update other students grades' });
    }

    let targetUserInfo = (targetuserid === user.userid) ? userInfo : await UserInfo.findOne({ userid: targetuserid });
    if (!targetUserInfo) return res.status(404).json({ error: 'Target user info not found' });

    const { grade, title, gradeTitle, type } = req.body;

    const updatedData = {};
    if (grade) updatedData.grade = grade;
    if (title) updatedData.title = title;
    if (gradeTitle) updatedData.gradeTitle = gradeTitle;
    if (type) updatedData.type = type;

    const updatedGrade = await Grade.findOneAndUpdate(
      { gradeid, classid, subjectid, user: targetUserInfo._id },
      updatedData,
      { new: true }
    );

    if (!updatedGrade) return res.status(404).json({ error: 'Grade not found' });

    res.json({ success: true });
  } catch (error) {
    console.error('Update grades error:', error);
    res.status(500).json({ error: 'Failed to update grades' });
  }
});

module.exports = router;