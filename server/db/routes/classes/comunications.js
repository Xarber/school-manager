const express = require('express');
const mongoose = require("mongoose");
const { Comunication } = require("../../models/Comunication");
const { Class } = require("../../models/Class");
const { UserInfo, UserData } = require('../../models/User');
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
    const classInfo = await Class.findOne({ classid }).populate({
      path: 'comunications',
      populate: { path: 'sender' }
    }).lean();
    if (!classInfo) return res.status(404).json({ error: 'Class not found' });
    if (
        !classInfo.students.includes(userInfo._id)
        && !classInfo.teachers.includes(userInfo._id)
    ) return res.status(403).json({ error: 'Access denied to this class' });

    res.json({ success: true, data: classInfo.comunications });
  } catch (error) {
    console.error('Get comunications error:', error);
    res.status(500).json({ error: 'Failed to get comunications' });
  }
});

router.post(paths.dbCreate, async (req, res) => {
  try {
    const { classid } = req.body;
    const user = req.user; // Assuming user is set by authentication middleware
    if (!user) return res.status(401).json({ error: 'User authentication required' });
    if (!classid) return res.status(400).json({ error: 'Class ID is required' });

    const userInfo = await UserInfo.findOne({ userid: user.userid });
    if (!userInfo) return res.status(404).json({ error: 'User info not found' });
    if (userInfo.role !== 'teacher') return res.status(403).json({ error: 'Only teachers can create comunications' });

    const classInfo = await Class.findOne({ classid });
    if (!classInfo) return res.status(404).json({ error: 'Class not found' });
    if (!classInfo.teachers.includes(userInfo._id)) return res.status(403).json({ error: 'Only teachers can create comunications' });

    const { title, content, date, time, urgency, requiresConfirmation } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'Title and content are required' });
    const { subjectid } = req.body;

    const newComunication = new Comunication({
      comunicationid: `com_${idGenerate()}`,
      classid,
      subjectid: subjectid || undefined,
      title,
      content,
      date: date || undefined,
      time: time || undefined,
      urgency: urgency || 'low',
      requiresConfirmation: requiresConfirmation || false,
      sender: userInfo._id,
      addedAt: new Date().toISOString(),
      editedAt: Date.now(),
    });
    await newComunication.save();

    // add comunication to class
    classInfo.comunications.push(newComunication._id);
    await classInfo.save();

    res.json({ success: true, data: newComunication._id });
  } catch (error) {
    console.error('Create comunication error:', error);
    res.status(500).json({ error: 'Failed to create comunication' });
  }
});

router.post(paths.dbDelete, async (req, res) => {
  try {
    const { classid, comunicationid } = req.body;
    const user = req.user; // Assuming user is set by authentication middleware
    if (!user) return res.status(401).json({ error: 'User authentication required' });
    if (!classid) return res.status(400).json({ error: 'Class ID required' });
    if (!comunicationid) return res.status(400).json({ error: 'Comunication ID required' });

    const userData = await UserData.findOne({ userid: user.userid });
    if (!userData) return res.status(404).json({ error: 'User data not found' });
    if (userData.role !== 'teacher') return res.status(403).json({ error: 'Only teachers can delete comunications' });

    const classInfo = await Class.findOne({ classid });
    if (!classInfo) return res.status(404).json({ error: 'Class not found' });
    if (!classInfo.teachers.includes(user._id)) return res.status(403).json({ error: 'Only teachers can delete comunications' });

    // Delete comunication (replace with actual Comunication model)
    await Comunication.deleteOne({ comunicationid });

    // Remove comunication from class
    classInfo.comunications = classInfo.comunications.filter(id => id !== comunicationid);
    await classInfo.save();

    res.json({ success: true });
  } catch (error) {
    console.error('Delete comunication error:', error);
    res.status(500).json({ error: 'Failed to delete comunication' });
  }
});

router.post(paths.dbUpdate, async (req, res) => {
  try {
    const user = req.user; // Assuming user is set by authentication middleware
    const { classid, comunicationid } = req.body;
    if (!user) return res.status(401).json({ error: 'User authentication required' });
    if (!classid) return res.status(400).json({ error: 'Class ID required' });
    if (!comunicationid) return res.status(400).json({ error: 'Comunication ID required' });

    const userData = await UserData.findOne({ userid: user.userid });
    if (!userData) return res.status(404).json({ error: 'User data not found' });
    if (userData.role !== 'teacher') return res.status(403).json({ error: 'Only teachers can update comunications' });

    const classInfo = await Class.findOne({ classid });
    if (!classInfo) return res.status(404).json({ error: 'Class not found' });
    if (!classInfo.teachers.includes(user._id)) return res.status(403).json({ error: 'Only teachers can update comunications' });

    const comunicationInfo = await Comunication.findOne({ comunicationid });
    if (!comunicationInfo) return res.status(404).json({ error: 'Comunication not found' });
    if (comunicationInfo.sender.toString() !== user._id.toString()) return res.status(403).json({ error: 'Only the sender can update this comunication' });

    // Update comunication (replace with actual Comunication model)
    const { title, content, date, time, urgency, requiresConfirmation, subjectid } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'Title and content are required' });

    if (title) comunicationInfo.title = title;
    if (content) comunicationInfo.content = content;
    if (date) comunicationInfo.date = date;
    if (time) comunicationInfo.time = time;
    if (urgency) comunicationInfo.urgency = urgency;
    if (requiresConfirmation !== undefined) comunicationInfo.requiresConfirmation = requiresConfirmation;
    if (subjectid !== undefined) comunicationInfo.subjectid = subjectid;
    comunicationInfo.editedAt = Date.now();

    await comunicationInfo.save();

    res.json({ success: true });
  } catch (error) {
    console.error('Update comunication error:', error);
    res.status(500).json({ error: 'Failed to update comunication' });
  }
});

module.exports = router;