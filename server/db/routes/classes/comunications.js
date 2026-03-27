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
    const { classid, comunicationid } = req.body;
    if (!user) return res.status(401).json({ error: req.t("errors.not_authenticated") });
    if (!classid && !comunicationid) return res.status(400).json({ error: req.t("errors.classid_or_comunicationid_required") });

    const userInfo = await UserInfo.findOne({ _id: user.userinfo_id });;
    if (!userInfo) return res.status(404).json({ error: req.t("errors.user_not_found") });
    
    let classInfo, comunicationData;

    switch (true) {
      case !!comunicationid:
        classInfo = await Class.findOne({ comunications: comunicationid });
        break;
      case !!classid:
        classInfo = await Class.findOne({ _id: classid }).populate({
          path: 'comunications',
          populate: ["sender", {path: "responses", populate: ["user"]}]
        }).lean();
        break;
    }

    if (!classInfo) return res.status(404).json({ error: req.t("errors.class_not_found") });
    if (
        !classInfo.students.some(t => t.equals(userInfo._id))
        && !classInfo.teachers.some(t => t.equals(userInfo._id))
    ) return res.status(403).json({ error: req.t("errors.class_access_denied") });
    const isUserTeacher = classInfo.teachers.some(t => t.equals(user.userinfo_id));

    if (comunicationid) {
      const comunication = await Comunication.findOne({ _id: comunicationid }).populate([
        "sender",
        {path: "responses", populate: ["user"]}
      ]).lean();
      if (!isUserTeacher) {
        const filteredResponses = comunication.responses.filter(r => r.user._id.equals(user.userinfo_id));
        if (!comunication.requiresConfirmation || filteredResponses.length) {
          comunication.responses = filteredResponses;
        }
      }
      return res.json({ success: true, data: comunication });
    }

    if (!isUserTeacher) {
      classInfo.comunications = classInfo.comunications.map(c => {
        const filteredResponses = c.responses.filter(r => r.user._id.equals(user.userinfo_id));
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
    res.status(500).json({ error: req.t("errors.request_responses.fail.get_comunications"), dbError: error });
  }
});

router.post(paths.dbCreate, async (req, res) => {
  try {
    const { classid } = req.body;
    const user = req.user; // Assuming user is set by authentication middleware
    if (!user) return res.status(401).json({ error: req.t("errors.not_authenticated") });
    if (!classid) return res.status(400).json({ error: req.t("errors.classid_required") });

    const userInfo = await UserInfo.findOne({ _id: user.userinfo_id });;
    if (!userInfo) return res.status(404).json({ error: req.t("errors.user_not_found") });

    const classInfo = await Class.findOne({ _id: classid });
    if (!classInfo) return res.status(404).json({ error: req.t("errors.class_not_found") });
    if (!classInfo.teachers.some(t => t.equals(userInfo._id))) return res.status(403).json({ error: req.t("errors.comunication_create_teacher_only") });

    const { title, content, date, time, urgency, requiresConfirmation, confirmationType } = req.body;
    if (!title || !content) return res.status(400).json({ error: req.t("errors.comunication_title_and_content_required") });
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
    res.status(500).json({ error: req.t("errors.request_responses.fail.create_comunication"), dbError: error });
  }
});

router.post(paths.dbDelete, async (req, res) => {
  try {
    const { comunicationid } = req.body;
    const user = req.user; // Assuming user is set by authentication middleware
    if (!user) return res.status(401).json({ error: req.t("errors.not_authenticated") });
    if (!comunicationid) return res.status(400).json({ error: req.t("errors.comunicationid_required") });

    const userInfo = await UserInfo.findOne({ _id: user.userinfo_id });
    if (!userInfo) return res.status(404).json({ error: req.t("errors.user_not_found") });

    const classInfo = await Class.findOne({ comunications: comunicationid });
    if (!classInfo) return res.status(404).json({ error: req.t("errors.class_not_found") });
    if (!classInfo.teachers.some(t => t.equals(user.userinfo_id))) return res.status(403).json({ error: req.t("errors.comunication_delete_teacher_only") });

    // Delete comunication (replace with actual Comunication model)
    await Comunication.deleteOne({ _id: comunicationid });

    // Remove comunication from class
    classInfo.comunications = classInfo.comunications.filter(id => id !== comunicationid);
    await classInfo.save();

    res.json({ success: true });
  } catch (error) {
    console.error('Delete comunication error:', error);
    res.status(500).json({ error: req.t("errors.request_responses.fail.delete_comunication"), dbError: error });
  }
});

router.post(paths.dbUpdate, async (req, res) => {
  try {
    const user = req.user; // Assuming user is set by authentication middleware
    const { comunicationid } = req.body;
    if (!user) return res.status(401).json({ error: req.t("errors.not_authenticated") });
    if (!comunicationid) return res.status(400).json({ error: req.t("errors.comunicationid_required") });

    const userInfo = await UserInfo.findOne({ _id: user.userinfo_id });
    if (!userInfo) return res.status(404).json({ error: req.t("errors.user_not_found") });

    const classInfo = await Class.findOne({ comunications: comunicationid });
    if (!classInfo) return res.status(404).json({ error: req.t("errors.class_not_found") });
    if (!classInfo.teachers.some(t => t.equals(user.userinfo_id))) return res.status(403).json({ error: req.t("errors.comunication_update_teacher_only") });

    const comunicationInfo = await Comunication.findOne({ _id: comunicationid });
    if (!comunicationInfo) return res.status(404).json({ error: req.t("errors.comunication_not_found") });
    if (comunicationInfo.sender.toString() !== user.userinfo_id.toString()) return res.status(403).json({ error: req.t("errors.comunication_update_sender_only") });

    // Update comunication (replace with actual Comunication model)
    const { title, content, date, time, urgency, requiresConfirmation, subjectid } = req.body;

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
    res.status(500).json({ error: req.t("errors.request_responses.fail.update_comunication"), dbError: error });
  }
});

// Custom routes for comunications
router.post('/responses' + paths.dbCreate, async (req, res) => {
  try {
    const user = req.user; // Assuming user is set by authentication middleware
    const { comunicationid } = req.body;
    if (!user) return res.status(401).json({ error: req.t("errors.not_authenticated") });
    if (!comunicationid) return res.status(400).json({ error: req.t("errors.comunicationid_required") });

    const userInfo = await UserInfo.findOne({ _id: user.userinfo_id });
    if (!userInfo) return res.status(404).json({ error: req.t("errors.user_not_found") });

    const classInfo = await Class.findOne({ comunications: comunicationid });
    if (!classInfo) return res.status(404).json({ error: req.t("errors.class_not_found") });

    if (
      !classInfo.teachers.some(t => t.equals(user.userinfo_id))
      && !classInfo.students.some(t => t.equals(user.userinfo_id))
    ) return res.status(403).json({ error: req.t("errors.class_access_denied") });
    //todo: school logic

    const comunicationInfo = await Comunication.findOne({ _id: comunicationid });
    if (!comunicationInfo) return res.status(404).json({ error: req.t("errors.comunication_not_found") });

    // Update comunication (replace with actual Comunication model)
    const { state, message } = req.body;
    if (typeof state === "undefined" && (comunicationInfo.confirmationType ?? "accept") === "accept") return res.status(400).json({ error: req.t("errors.comunication_reply_state_required") });
    if (typeof message === "undefined" && (comunicationInfo.confirmationType ?? "message") === "message") return res.status(400).json({ error: req.t("errors.comunication_reply_message_required") });

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
    res.status(500).json({ error: req.t("errors.request_responses.fail.reply_comunication"), dbError: error });
  }
});

router.post('/responses' + paths.dbDelete, async (req, res) => {
  return res.status(400).json({ error: req.t("errors.comunication_reply_update_restricted") });
});

router.post('/responses' + paths.dbUpdate, async (req, res) => {
  return res.status(400).json({ error: req.t("errors.comunication_reply_update_restricted") });
});

module.exports = router;