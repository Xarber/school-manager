const express = require('express');
const mongoose = require("mongoose");
const { Homework } = require("../../models/Homework");
const { Subject } = require("../../models/Subject");
const { Class } = require("../../models/Class");
const { UserInfo, UserData } = require('../../models/User');
const paths = require('../paths.js');
const { idGenerate } = require('../../idgenerator');

const router = express.Router();

router.post(paths.dbGet, async (req, res) => {
  try {
    const user = req.user; // Assuming user is set by authentication middleware
    const { classid, subjectid, homeworkid } = req.body;

    if (!user) return res.status(401).json({ error: 'User authentication required' });
    if (!classid) return res.status(400).json({ error: 'Class ID required' });
    if (!subjectid) return res.status(400).json({ error: 'Subject ID required' });
    if (!homeworkid) return res.status(400).json({ error: 'Homework ID required' });

    const userInfo = await UserInfo.findOne({ _id: user.userinfo_id });;
    if (!userInfo) return res.status(404).json({ error: 'User info not found' });

    const homework = await Homework.findOne({ homeworkid, classid, subjectid }).lean();
    if (!homework) return res.status(404).json({ error: 'Homework not found' });

    res.json({ success: true, data: homework });
  } catch (error) {
    console.error('Get homework error:', error);
    res.status(500).json({ error: 'Failed to get homework' });
  }
});

router.post(paths.dbCreate, async (req, res) => {
  try {
    const user = req.user; // Assuming user is set by authentication middleware
    const { classid, subjectid } = req.body;

    if (!user) return res.status(401).json({ error: 'User authentication required' });
    if (!classid) return res.status(400).json({ error: 'Class ID required' });
    if (!subjectid) return res.status(400).json({ error: 'Subject ID required' });

    const userInfo = await UserInfo.findOne({ _id: user.userinfo_id });;
    if (!userInfo) return res.status(404).json({ error: 'User info not found' });
    if (userInfo.role !== 'teacher') return res.status(403).json({ error: 'Only teachers can create homework' });

    const classInfo = await Class.findOne({ _id: classid });
    if (!classInfo) return res.status(404).json({ error: 'Class not found' });
    if (!classInfo.teachers.some(t => t.equals(userInfo._id))) return res.status(403).json({ error: 'Only teachers can create homework' });

    const subjectInfo = await Subject.findOne({ subjectid, classid });
    if (!subjectInfo) return res.status(404).json({ error: 'Subject not found' });
    if (!subjectInfo.teacher.some(t => t.equals(userInfo._id))) return res.status(403).json({ error: 'Only teachers can create homework' });

    const { title, description, dueDate, points } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });

    const newHomework = new Homework({
        homeworkid: `homework_${idGenerate()}`,
        classid,
        subjectid,
        title,
        description,
        dueDate,
        points: points || undefined,
        addedAt: new Date().toISOString(),
        editedAt: Date.now(),
    });
    await newHomework.save();

    //add homework to class
    classInfo.homework.push(newHomework._id);
    await classInfo.save();

    //add homework to subject
    subjectInfo.homework.push(newHomework._id);
    await subjectInfo.save();

    res.json({ success: true, data: newHomework._id });
  } catch (error) {
    console.error('Create homework error:', error);
    res.status(500).json({ error: 'Failed to create homework' });
  }
});

router.post(paths.dbDelete, async (req, res) => {
  try {
    const user = req.user; // Assuming user is set by authentication middleware
    const { homeworkid } = req.body;

    if (!user) return res.status(401).json({ error: 'User authentication required' });
    if (!homeworkid) return res.status(400).json({ error: 'Homework ID required' });

    const userInfo = await UserInfo.findOne({ _id: user.userinfo_id });;
    if (!userInfo) return res.status(404).json({ error: 'User info not found' });

    const homework = await Homework.findOne({ homeworkid });
    if (!homework) return res.status(404).json({ error: 'Homework not found' });
    if (userInfo.role !== 'teacher') return res.status(403).json({ error: 'Only teachers can delete homework' });

    const classInfo = await Class.findOne({ _id: homework.classid });
    if (!classInfo) return res.status(404).json({ error: 'Class not found' });
    if (!classInfo.teachers.some(t => t.equals(userInfo._id))) return res.status(403).json({ error: 'Only teachers can delete homework' });

    const subjectInfo = await Subject.findOne({ _id: homework.subjectid, classid: homework.classid });
    if (!subjectInfo) return res.status(404).json({ error: 'Subject not found' });
    if (!subjectInfo.teacher.some(t => t.equals(userInfo._id))) return res.status(403).json({ error: 'Only teachers can delete homework' });

    // Remove homework from class
    classInfo.homework = classInfo.homework.filter(hwId => hwId.toString() !== homework._id.toString());
    await classInfo.save();

    // Remove homework from subject
    subjectInfo.homework = subjectInfo.homework.filter(hwId => hwId.toString() !== homework._id.toString());
    await subjectInfo.save();
    
    // Delete homework
    await Homework.deleteOne({ homeworkid });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete homework error:', error);
    res.status(500).json({ error: 'Failed to delete homework' });
  }
});

router.post(paths.dbUpdate, async (req, res) => {
  try {
    const user = req.user; // Assuming user is set by authentication middleware
    const { homeworkid, title, description, dueDate, points } = req.body;

    if (!user) return res.status(401).json({ error: 'User authentication required' });
    if (!homeworkid) return res.status(400).json({ error: 'Homework ID required' });

    const userInfo = await UserInfo.findOne({ _id: user.userinfo_id });;
    if (!userInfo) return res.status(404).json({ error: 'User info not found' });

    const homework = await Homework.findOne({ homeworkid });
    if (!homework) return res.status(404).json({ error: 'Homework not found' });

    if (userInfo.role !== 'teacher') {
      return res.status(403).json({ error: 'Only teachers can update homework' });
    }

    if (title !== undefined) homework.title = title;
    if (description !== undefined) homework.description = description;
    if (dueDate !== undefined) homework.dueDate = dueDate;
    if (points !== undefined) homework.points = points;
    homework.editedAt = Date.now();

    await homework.save();

    res.json({ success: true });
  } catch (error) {
    console.error('Update homework error:', error);
    res.status(500).json({ error: 'Failed to update homework' });
  }
});

module.exports = router;