const express = require('express');
const mongoose = require("mongoose");
const { Comunication } = require("../../models/Comunication");
const { Class } = require("../../models/Class");
const { UserInfo, UserData } = require('../../models/User');
const paths = require('../paths.js');
const { idGenerate } = require('../../idgenerator');
const { ComunicationResponse } = require('../../models/ComunicationResponse.js');

const router = express.Router();

router.post(paths.dbGet, async (req, res) => {
  try {
    const user = req.user; // Assuming user is set by authentication middleware
    const { classid } = req.body;
    if (!user) return res.status(401).json({ error: 'User authentication required' });
    if (!classid) return res.status(400).json({ error: 'Class ID required' });

    const userInfo = await UserInfo.findOne({ _id: user.userinfo_id });;
    if (!userInfo) return res.status(404).json({ error: 'User info not found' });
    
    const classInfo = await Class.findOne({ _id: classid }).populate({
      path: 'comunications',
      populate: ["sender", {path: "responses", populate: ["user"]}]
    }).lean();

    if (!classInfo) return res.status(404).json({ error: 'Class not found' });
    const isUserTeacher = classInfo.teachers.some(t => t.equals(user.userinfo_id));
    if (
        !classInfo.students.some(t => t.equals(userInfo._id))
        && !classInfo.teachers.some(t => t.equals(userInfo._id))
    ) return res.status(403).json({ error: 'Access denied to this class' });

    if (!isUserTeacher) {
      classInfo.comunications = classInfo.comunications.map(c => {
        const filteredResponses = c.responses.filter(r => r.sender._id.equals(user.userinfo_id));
        if (!c.requiresConfirmation || filteredResponses.length) {
          c.responses = filteredResponses;
          return c;
        }
        return null;
      }).filter(Boolean);
    }

    res.json({ success: true, data: classInfo.comunications });
  } catch (error) {
    console.error('Get comunications error:', error);
    res.status(500).json({ error: 'Failed to get comunications', dbError: error });
  }
});

router.post(paths.dbCreate, async (req, res) => {
  try {
    const { classid } = req.body;
    const user = req.user; // Assuming user is set by authentication middleware
    if (!user) return res.status(401).json({ error: 'User authentication required' });
    if (!classid) return res.status(400).json({ error: 'Class ID is required' });

    const userInfo = await UserInfo.findOne({ _id: user.userinfo_id });;
    if (!userInfo) return res.status(404).json({ error: 'User info not found' });
    // if (userInfo.role !== 'teacher') return res.status(403).json({ error: 'Only teachers can create comunications' });

    const classInfo = await Class.findOne({ _id: classid });
    if (!classInfo) return res.status(404).json({ error: 'Class not found' });
    if (!classInfo.teachers.some(t => t.equals(userInfo._id))) return res.status(403).json({ error: 'Only teachers can create comunications' });

    const { title, content, date, time, urgency, requiresConfirmation, confirmationType } = req.body;
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
      confirmationType: confirmationType || "accept",
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
    res.status(500).json({ error: 'Failed to create comunication', dbError: error });
  }
});

router.post(paths.dbDelete, async (req, res) => {
  try {
    const { comunicationid } = req.body;
    const user = req.user; // Assuming user is set by authentication middleware
    if (!user) return res.status(401).json({ error: 'User authentication required' });
    if (!comunicationid) return res.status(400).json({ error: 'Comunication ID required' });

    const userInfo = await UserInfo.findOne({ _id: user.userinfo_id });
    if (!userInfo) return res.status(404).json({ error: 'User info not found' });
    // if (userInfo.role !== 'teacher') return res.status(403).json({ error: 'Only teachers can delete comunications' });

    const classInfo = await Class.findOne({ comunications: comunicationid });
    if (!classInfo) return res.status(404).json({ error: 'Class not found' });
    if (!classInfo.teachers.some(t => t.equals(user.userinfo_id))) return res.status(403).json({ error: 'Only teachers can delete comunications' });

    // Delete comunication (replace with actual Comunication model)
    await Comunication.deleteOne({ _id: comunicationid });

    // Remove comunication from class
    classInfo.comunications = classInfo.comunications.filter(id => id !== comunicationid);
    await classInfo.save();

    res.json({ success: true });
  } catch (error) {
    console.error('Delete comunication error:', error);
    res.status(500).json({ error: 'Failed to delete comunication', dbError: error });
  }
});

router.post(paths.dbUpdate, async (req, res) => {
  try {
    const user = req.user; // Assuming user is set by authentication middleware
    const { comunicationid } = req.body;
    if (!user) return res.status(401).json({ error: 'User authentication required' });
    if (!comunicationid) return res.status(400).json({ error: 'Comunication ID required' });

    const userInfo = await UserInfo.findOne({ _id: user.userinfo_id });
    if (!userInfo) return res.status(404).json({ error: 'User info not found' });
    // if (userInfo.role !== 'teacher') return res.status(403).json({ error: 'Only teachers can update comunications' });

    const classInfo = await Class.findOne({ comunications: comunicationid });
    if (!classInfo) return res.status(404).json({ error: 'Class not found' });
    if (!classInfo.teachers.some(t => t.equals(user.userinfo_id))) return res.status(403).json({ error: 'Only teachers can update comunications' });

    const comunicationInfo = await Comunication.findOne({ _id: comunicationid });
    if (!comunicationInfo) return res.status(404).json({ error: 'Comunication not found' });
    if (comunicationInfo.sender.toString() !== user.userinfo_id.toString()) return res.status(403).json({ error: 'Only the sender can update this comunication' });

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
    res.status(500).json({ error: 'Failed to update comunication', dbError: error });
  }
});

// Custom routes for comunications
router.post('/responses' + paths.dbCreate, async (req, res) => {
  try {
    const user = req.user; // Assuming user is set by authentication middleware
    const { comunicationid } = req.body;
    if (!user) return res.status(401).json({ error: 'User authentication required' });
    if (!comunicationid) return res.status(400).json({ error: 'Comunication ID required' });

    const userInfo = await UserInfo.findOne({ _id: user.userinfo_id });
    if (!userInfo) return res.status(404).json({ error: 'User info not found' });
    // if (userInfo.role !== 'teacher') return res.status(403).json({ error: 'Only teachers can update comunications' });

    const classInfo = await Class.findOne({ comunications: comunicationid });
    if (!classInfo) return res.status(404).json({ error: 'Class not found' });

    if (
      !classInfo.teachers.some(t => t.equals(user.userinfo_id))
      && !classInfo.students.some(t => t.equals(user.userinfo_id))
    ) return res.status(403).json({ error: 'Access denied to this class' });
    //todo: school logic

    const comunicationInfo = await Comunication.findOne({ _id: comunicationid });
    if (!comunicationInfo) return res.status(404).json({ error: 'Comunication not found' });

    // Update comunication (replace with actual Comunication model)
    const { state, message } = req.body;
    if (typeof state === "undefined" && (comunicationInfo.confirmationType ?? "accept") === "accept") return res.status(400).json({ error: 'State required.' });
    if (typeof message === "undefined" && (comunicationInfo.confirmationType ?? "message") === "message") return res.status(400).json({ error: 'Message required.' });

    const newResponse = new ComunicationResponse({
      user: user.userinfo_id,
      state: state,
      message: message,
      addedAt: new Date().toISOString(),
      editedAt: Date.now(),
    });
    newResponse.save();

    comunicationInfo.responses ??= [];
    comunicationInfo.responses.push(newResponse._id);

    await comunicationInfo.save();

    res.json({ success: true });
  } catch (error) {
    console.error('Reply to comunication error:', error);
    res.status(500).json({ error: 'Failed to reply to comunication', dbError: error });
  }
});

router.post('/responses' + paths.dbDelete, async (req, res) => {
  return res.status(400).json({ error: 'Can\'t delete or update responses.' });
});

router.post('/responses' + paths.dbUpdate, async (req, res) => {
  return res.status(400).json({ error: 'Can\'t delete or update responses.' });
});

module.exports = router;