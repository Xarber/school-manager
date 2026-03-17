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

    const userInfo = await UserInfo.findOne({ _id: user.userinfo_id }).lean();
    if (!userInfo) return res.status(404).json({ error: 'User info not found' });

    // Fetch class info (replace with actual Class model)
    const classInfo = await Class.findOne({ _id: classid }).lean();
    if (!classInfo) return res.status(404).json({ error: 'Class not found' });
    if (
        !classInfo.students.some(t => t.equals(userInfo._id))
        && !classInfo.teachers.some(t => t.equals(userInfo._id))
    ) return res.status(403).json({ error: 'Access denied to this class' });

    req.body.populate = req.body.populate ?? [];
    let populate = ["teachers", "students", ...req.body.populate];
    await Class.populate(classInfo, populate);

    res.json({ success: true, data: classInfo });
  } catch (error) {
    console.error('Get class error:', error);
    res.status(500).json({ error: 'Failed to get class', dbError: error });
  }
});

router.post(paths.dbCreate, async (req, res) => {
  try {
    const { name, description } = req.body;
    let { notes } = req.body;
    const user = req.user; // Assuming user is set by authentication middleware
    if (!user) return res.status(401).json({ error: 'User authentication required' });
    if (!name) return res.status(400).json({ error: 'Class name is required' });

    const userData = await UserData.findOne({ _id: user.userdata_id });
    if (!userData) return res.status(404).json({ error: 'User data not found' });

    const userInfo = await UserInfo.findOne({ _id: user.userinfo_id });
    if (!userInfo) return res.status(404).json({ error: 'User info not found' });
    if (userInfo.role !== 'teacher') return res.status(403).json({ error: 'Only teachers can create classes' });

    if (!Array.isArray(notes)) {
      if (typeof notes === "string") notes = [notes];
      else notes = [];
    }
    if (description) notes.push(description);

    // Create new class (replace with actual Class model)
    const newClass = new Class({
      //classid: `class_${idGenerate()}`,
      name,
      teachers: [userInfo._id], // Assuming user is the teacher creating the class
      students: [],
      schedule: [
        {day: "Monday", hours: [], addedAt: new Date().toISOString(), editedAt: Date.now()},
        {day: "Tuesday", hours: [], addedAt: new Date().toISOString(), editedAt: Date.now()},
        {day: "Wednesday", hours: [], addedAt: new Date().toISOString(), editedAt: Date.now()},
        {day: "Thursday", hours: [], addedAt: new Date().toISOString(), editedAt: Date.now()},
        {day: "Friday", hours: [], addedAt: new Date().toISOString(), editedAt: Date.now()},
        {day: "Saturday", hours: [], addedAt: new Date().toISOString(), editedAt: Date.now()},
        {day: "Sunday", hours: [], addedAt: new Date().toISOString(), editedAt: Date.now()},
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
    await userData.save();

    res.json({ success: true, data: newClass._id });
  } catch (error) {
    console.error('Create class error:', error);
    res.status(500).json({ error: 'Failed to create class', dbError: error });
  }
});

router.post(paths.dbDelete, async (req, res) => {
  try {
    const { classid } = req.body;
    const user = req.user; // Assuming user is set by authentication middleware
    if (!user) return res.status(401).json({ error: 'User authentication required' });
    if (!classid) return res.status(400).json({ error: 'Class ID required' });  

    const userInfo = await UserInfo.findOne({ _id: user.userinfo_id });
    if (!userInfo) return res.status(404).json({ error: 'User info not found' });
    // if (userInfo.role !== 'teacher') return res.status(403).json({ error: 'Only teachers can delete classes' });

    const classInfo = await Class.findOne({ _id: classid });
    if (!classInfo) return res.status(404).json({ error: 'Class not found' });
    if (!classInfo.teachers.some(t => t.equals(user.userinfo_id))) return res.status(403).json({ error: 'Only teachers can delete classes' });

    // Delete class (replace with actual Class model)
    await Class.deleteOne({ _id: classid });

    res.json({ success: true });    
  } catch (error) {
    console.error('Delete class error:', error);
    res.status(500).json({ error: 'Failed to delete class', dbError: error });
  }
});

router.post(paths.dbUpdate, async (req, res) => {
  try {
    const user = req.user; // Assuming user is set by authentication middleware
    const { classid,  } = req.body;
    if (!user) return res.status(401).json({ error: 'User authentication required' });
    if (!classid) return res.status(400).json({ error: 'Class ID required' });

    const userInfo = await UserInfo.findOne({ _id: user.userinfo_id });
    if (!userInfo) return res.status(404).json({ error: 'User info not found' });
    // if (userInfo.role !== 'teacher') return res.status(403).json({ error: 'Only teachers can update classes' });

    const classInfo = await Class.findOne({ _id: classid });
    if (!classInfo) return res.status(404).json({ error: 'Class not found' });
    if (!classInfo.teachers.some(t => t.equals(user.userinfo_id))) return res.status(403).json({ error: 'Only teachers can update classes' });

    // Update class (replace with actual Class model)
    const { name, schedule, notes } = req.body;
    if (name) classInfo.name = name;
    if (schedule) classInfo.schedule = schedule;
    if (notes) classInfo.notes = notes;
    classInfo.editedAt = Date.now();

    await classInfo.save();

    res.json({ success: true });
  } catch (error) {
    console.error('Update class error:', error);
    res.status(500).json({ error: 'Failed to update class', dbError: error });
  }
});

module.exports = router;