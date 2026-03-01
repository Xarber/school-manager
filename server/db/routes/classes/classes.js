const express = require('express');
const mongoose = require("mongoose");
const { UserInfo, UserData } = require('../../models/User');
const { Class } = require('../../models/Class');
const paths = require('../paths.js');
const { idGenerate } = require('../../idgenerator');

const router = express.Router();

router.post(paths.dbGet, async (req, res) => {
  try {
    const user = req.user; // Assuming user is set by authentication middleware
    const { classid } = req.body;
    if (!user) return res.status(401).json({ error: 'User authentication required' });
    if (!classid) return res.status(400).json({ error: 'Class ID required' });

    const userInfo = await UserInfo.findOne({ userid: user.userid });
    if (!userInfo) return res.status(404).json({ error: 'User info not found' });

    // Fetch class info (replace with actual Class model)
    const classInfo = await Class.findOne({ classid }).lean();
    if (!classInfo) return res.status(404).json({ error: 'Class not found' });
    if (
        !classInfo.students.includes(userInfo._id)
        && !classInfo.teachers.includes(userInfo._id)
    ) return res.status(403).json({ error: 'Access denied to this class' });

    res.json({ success: true, data: classInfo });
  } catch (error) {
    console.error('Get class error:', error);
    res.status(500).json({ error: 'Failed to get class' });
  }
});

router.post(paths.dbCreate, async (req, res) => {
  try {
    const { name, notes, description } = req.body;
    const user = req.user; // Assuming user is set by authentication middleware
    if (!user) return res.status(401).json({ error: 'User authentication required' });
    if (!name) return res.status(400).json({ error: 'Class name is required' });

    const userInfo = await UserInfo.findOne({ userid: user.userid });
    if (!userInfo) return res.status(404).json({ error: 'User info not found' });
    if (userInfo.role !== 'teacher') return res.status(403).json({ error: 'Only teachers can create classes' });

    const userData = await UserData.findOne({ userid: user.userid });
    if (!userData) return res.status(404).json({ error: 'User data not found' });

    if (!Array.isArray(notes)) {
      if (typeof notes === "string") notes = [notes];
      else notes = [];
    }
    if (description) notes.push(description);

    // Create new class (replace with actual Class model)
    const newClass = new Class({
      classid: `class_${idGenerate()}`,
      name,
      teachers: [userInfo._id], // Assuming user is the teacher creating the class
      students: [],
      schedule: [
        {day: "Monday", hours: []},
        {day: "Tuesday", hours: []},
        {day: "Wednesday", hours: []},
        {day: "Thursday", hours: []},
        {day: "Friday", hours: []},
        {day: "Saturday", hours: []},
        {day: "Sunday", hours: []},
      ],
      comunications: [],
      subjects: [],
      notes: notes,
      addedAt: new Date().toISOString(),
      editedAt: Date.now(),
    });
    await newClass.save();

    // Add class to user classes
    userData.classes.push(newClass._id);
    await userInfo.save();

    res.json({ success: true, data: newClass.classid });
  } catch (error) {
    console.error('Create class error:', error);
    res.status(500).json({ error: 'Failed to create class' });
  }
});

router.post(paths.dbDelete, async (req, res) => {
  try {
    const { classid } = req.body;
    const user = req.user; // Assuming user is set by authentication middleware
    if (!user) return res.status(401).json({ error: 'User authentication required' });
    if (!classid) return res.status(400).json({ error: 'Class ID required' });  

    const userData = await UserData.findOne({ userid: user.userid });
    if (!userData) return res.status(404).json({ error: 'User data not found' });
    if (userData.role !== 'teacher') return res.status(403).json({ error: 'Only teachers can delete classes' });

    const classInfo = await Class.findOne({ classid });
    if (!classInfo) return res.status(404).json({ error: 'Class not found' });
    if (!classInfo.teachers.includes(user._id)) return res.status(403).json({ error: 'Only teachers can delete classes' });

    // Delete class (replace with actual Class model)
    await Class.deleteOne({ classid });

    res.json({ success: true });    
  } catch (error) {
    console.error('Delete class error:', error);
    res.status(500).json({ error: 'Failed to delete class' });
  }
});

router.post(paths.dbUpdate, async (req, res) => {
  try {
    const user = req.user; // Assuming user is set by authentication middleware
    const { classid, name, schedule, notes } = req.body;
    if (!user) return res.status(401).json({ error: 'User authentication required' });
    if (!classid) return res.status(400).json({ error: 'Class ID required' });

    const userData = await UserData.findOne({ userid: user.userid });
    if (!userData) return res.status(404).json({ error: 'User data not found' });
    if (userData.role !== 'teacher') return res.status(403).json({ error: 'Only teachers can update classes' });

    const classInfo = await Class.findOne({ classid });
    if (!classInfo) return res.status(404).json({ error: 'Class not found' });
    if (!classInfo.teachers.includes(user._id)) return res.status(403).json({ error: 'Only teachers can update classes' });

    // Update class (replace with actual Class model)
    const updateData = {};
    if (name) updateData.name = name;
    if (schedule) updateData.schedule = schedule;
    if (notes) updateData.notes = notes;
    updateData.editedAt = Date.now();

    await Class.updateOne({ classid }, { $set: updateData });

    res.json({ success: true });
  } catch (error) {
    console.error('Update class error:', error);
    res.status(500).json({ error: 'Failed to update class' });
  }
});

module.exports = router;