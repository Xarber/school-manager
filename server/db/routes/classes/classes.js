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
    if (!user) return res.status(401).json({ error: req.t("errors.not_authenticated") });
    if (!classid) return res.status(400).json({ error: req.t("errors.classid_required") });

    const userInfo = await UserInfo.findOne({ _id: user.userinfo_id }).lean();
    if (!userInfo) return res.status(404).json({ error: req.t("errors.user_not_found") });

    // Fetch class info (replace with actual Class model)
    const classInfo = await Class.findOne({ _id: classid }).lean();
    if (!classInfo) return res.status(404).json({ error: req.t("errors.class_not_found") });
    if (
        !classInfo.students.some(t => t.equals(userInfo._id))
        && !classInfo.teachers.some(t => t.equals(userInfo._id))
    ) return res.status(403).json({ error: req.t("errors.class_access_denied") });

    let populate = ["teachers", "students"];
    await Class.populate(classInfo, populate);

    res.json({ success: true, data: classInfo });
  } catch (error) {
    console.error('Get class error:', error);
    res.status(500).json({ error: req.t("errors.request_responses.fail.get_class"), dbError: error });
  }
});

router.post(paths.dbCreate, async (req, res) => {
  try {
    const { name, description } = req.body;
    let { notes } = req.body;
    const user = req.user; // Assuming user is set by authentication middleware
    if (!user) return res.status(401).json({ error: req.t("errors.not_authenticated") });
    if (!name) return res.status(400).json({ error: req.t("errors.class_name_required") });

    const userData = await UserData.findOne({ _id: user.userdata_id });
    if (!userData) return res.status(404).json({ error: req.t("errors.user_not_found") });

    const userInfo = await UserInfo.findOne({ _id: user.userinfo_id });
    if (!userInfo) return res.status(404).json({ error: req.t("errors.user_not_found") });
    if (userInfo.role !== 'teacher') return res.status(403).json({ error: req.t("errors.class_create_teacher_only") });

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
        {day: 1, hours: [], addedAt: new Date().toISOString(), editedAt: Date.now()},
        {day: 2, hours: [], addedAt: new Date().toISOString(), editedAt: Date.now()},
        {day: 3, hours: [], addedAt: new Date().toISOString(), editedAt: Date.now()},
        {day: 4, hours: [], addedAt: new Date().toISOString(), editedAt: Date.now()},
        {day: 5, hours: [], addedAt: new Date().toISOString(), editedAt: Date.now()},
        {day: 6, hours: [], addedAt: new Date().toISOString(), editedAt: Date.now()},
        {day: 0, hours: [], addedAt: new Date().toISOString(), editedAt: Date.now()},
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
    res.status(500).json({ error: req.t("errors.request_responses.fail.create_class"), dbError: error });
  }
});

router.post(paths.dbDelete, async (req, res) => {
  try {
    const { classid } = req.body;
    const user = req.user; // Assuming user is set by authentication middleware
    if (!user) return res.status(401).json({ error: req.t("errors.not_authenticated") });
    if (!classid) return res.status(400).json({ error: req.t("errors.classid_required") });  

    const userInfo = await UserInfo.findOne({ _id: user.userinfo_id });
    if (!userInfo) return res.status(404).json({ error: req.t("errors.user_not_found") });

    const classInfo = await Class.findOne({ _id: classid });
    if (!classInfo) return res.status(404).json({ error: req.t("errors.class_not_found") });
    if (!classInfo.teachers.some(t => t.equals(user.userinfo_id))) return res.status(403).json({ error: req.t("errors.class_delete_teacher_only") });

    // Delete class (replace with actual Class model)
    await Class.deleteOne({ _id: classid });

    res.json({ success: true });    
  } catch (error) {
    console.error('Delete class error:', error);
    res.status(500).json({ error: req.t("errors.request_responses.fail.delete_class"), dbError: error });
  }
});

router.post(paths.dbUpdate, async (req, res) => {
  try {
    const user = req.user; // Assuming user is set by authentication middleware
    const { classid,  } = req.body;
    if (!user) return res.status(401).json({ error: req.t("errors.not_authenticated") });
    if (!classid) return res.status(400).json({ error: req.t("errors.classid_required") });

    const userInfo = await UserInfo.findOne({ _id: user.userinfo_id });
    if (!userInfo) return res.status(404).json({ error: req.t("errors.user_not_found") });

    const classInfo = await Class.findOne({ _id: classid });
    if (!classInfo) return res.status(404).json({ error: req.t("errors.class_not_found") });
    if (!classInfo.teachers.some(t => t.equals(user.userinfo_id))) return res.status(403).json({ error: req.t("errors.class_update_teacher_only") });

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
    res.status(500).json({ error: req.t("errors.request_responses.fail.update_class"), dbError: error });
  }
});

module.exports = router;