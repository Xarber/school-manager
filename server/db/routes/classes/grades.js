const express = require('express');
const mongoose = require("mongoose");
const { Grade } = require("../../models/Grade");
const { Subject } = require("../../models/Subject");
const { Class } = require("../../models/Class");
const { UserInfo, UserData } = require('../../models/User');
const paths = require('../paths.js');
const { idGenerate } = require('../../idgenerator');
const { describe } = require('node:test');

const router = express.Router();

router.post(paths.dbGet, async (req, res) => {
  try {
    const user = req.user; // Assuming user is set by authentication middleware
    const { userid, classid, subjectid, homeworkid, examid } = req.body;
    const targetuserid = userid || user.userinfo_id;

    if (!user) return res.status(401).json({ error: 'User authentication required' });
    if (!classid && !subjectid && !homeworkid && !examid && !userid) return res.status(400).json({ error: 'Class ID or Subject ID or Homework ID or Exam ID or User ID required' });

    const userInfo = await UserInfo.findOne({ _id: user.userinfo_id });
    if (!userInfo) return res.status(404).json({ error: 'User info not found' });

    let targetUserInfo = (targetuserid === user.userinfo_id) ? userInfo : await UserInfo.findOne({ _id: targetuserid });
    if (!targetUserInfo) return res.status(404).json({ error: 'Target user info not found' });

    let classInfo, subjectInfo;

    switch (true) {
      case !!examid:
        subjectInfo = await Subject.findOne({ lessons: examid });
        if (!subjectInfo) return res.status(404).json({ error: 'Exam not found' });
        classInfo = await Class.findOne({ subjects: subjectInfo._id });
        break;
      case !!homeworkid:
        subjectInfo = await Subject.findOne({ homework: homeworkid });
        if (!subjectInfo) return res.status(404).json({ error: 'Homework not found' });
        classInfo = await Class.findOne({ subjects: subjectInfo._id });
        break;
      case !!subjectid:
        classInfo = await Class.findOne({ subjects: subjectid });
        if (!classInfo) return res.status(404).json({ error: 'Subject not found' });
        break;
      case !!classid:
        classInfo = await Class.findOne({ _id: classid });
        if (!classInfo) return res.status(404).json({ error: 'Class not found' });
        break;
      case !!userid:
        if (userid != user.userinfo_id) return res.status(400).json({ error: 'Class ID required to search another student\'s grades.' });
        const grades = await Grade.find({ user: targetUserInfo._id }).lean();
        return res.json({ success: true, data: grades });
      default:
        return res.status(400).json({ error: 'Error.' });
    }

    if (!classInfo) return res.status(404).json({ error: 'Class not found' });
    if (
      !classInfo.students.some(t => t.equals(user.userinfo_id))
      && !classInfo.teachers.some(t => t.equals(user.userinfo_id))
    ) return res.status(403).json({ error: 'Access denied to this class' });
    if (
      !classInfo.students.some(t => t.equals(targetUserInfo._id))
      && !classInfo.teachers.some(t => t.equals(targetUserInfo._id))
    ) return res.status(403).json({ error: 'Target user is not in this class' });
    const isUserTeacher = classInfo.teachers.some(t => t.equals(user.userinfo_id));
    if (targetuserid && targetuserid !== user.userinfo_id && !isUserTeacher) return res.status(403).json({ error: 'Only teachers can view another student\'s grades' });

    let searchInfo = {};
    searchInfo.user = targetUserInfo._id;
    if (classid) searchInfo.class = classid;
    if (subjectid) searchInfo.subject = subjectid;
    if (homeworkid) searchInfo.homework = homeworkid;
    if (examid) searchInfo.exam = examid;
    const grades = await Grade.find(searchInfo).lean();

    res.json({ success: true, data: grades });
  } catch (error) {
    console.error('Get grades error:', error);
    res.status(500).json({ error: 'Failed to get grades', dbError: error });
  }
});

router.post(paths.dbCreate, async (req, res) => {
  try {
    const user = req.user; // Assuming user is set by authentication middleware
    const { userid, classid, subjectid, homeworkid, examid } = req.body;
    const targetuserid = userid || user.userinfo_id;

    if (!user) return res.status(401).json({ error: 'User authentication required' });
    if (!classid) return res.status(400).json({ error: 'Class ID required' });
    if (!subjectid) return res.status(400).json({ error: 'Subject ID required' });

    const userInfo = await UserInfo.findOne({ _id: user.userinfo_id });
    if (!userInfo) return res.status(404).json({ error: 'User info not found' });

    const classInfo = await Class.findOne({ _id: classid });
    if (!classInfo) return res.status(404).json({ error: 'Class not found' });

    const subjectInfo = await Subject.findOne({ _id: subjectid });
    if (!subjectInfo) return res.status(404).json({ error: 'Subject not found' });

    // teachers always pass
    const isUserTeacher = classInfo.teachers.some(t => t.equals(user.userinfo_id));
    // blocks students from adding their own grades
    if (!isUserTeacher && !subjectInfo.allowOwnGrades) return res.status(403).json({ error: 'Only teachers can add grades.' });
    // blocks students from adding to another student's grades
    else if (!isUserTeacher && targetuserid != user.userinfo_id) return res.status(403).json({ error: 'Only teachers can add to another student\'s grades.' });

    let targetUserInfo = (targetuserid === user.userid) ? userInfo : await UserInfo.findOne({ _id: targetuserid });
    if (!targetUserInfo) return res.status(404).json({ error: 'Target user info not found' });

    const { title, description, type, grade, gradeTitle } = req.body;
    if (!title) return res.status(400).json({ error: 'Title required' });
    if (!description) return res.status(400).json({ error: 'Description required' });
    if (!grade) return res.status(400).json({ error: 'Grade value required' });

    const newGrade = new Grade({
      class: classid,
      subject: subjectid,
      homework: homeworkid,
      exam: examid,
      user: targetUserInfo._id,
      title: title,
      description: description,
      type: type || "other",
      grade,
      gradeTitle: gradeTitle || grade.toString(),
      addedAt: new Date().toISOString(),
      editedAt: Date.now(),
    });
    await newGrade.save();

    res.json({ success: true, data: newGrade._id });
  } catch (error) {
    console.error('Create grade error:', error);
    res.status(500).json({ error: 'Failed to create grade', dbError: error });
  }
});

router.post(paths.dbDelete, async (req, res) => {
  try {
    const user = req.user; // Assuming user is set by authentication middleware
    const { gradeid } = req.body;
    
    if (!gradeid) return res.status(400).json({ error: 'Grade ID required' });

    const userInfo = await UserInfo.findOne({ _id: user.userinfo_id });;
    if (!userInfo) return res.status(404).json({ error: 'User info not found' });

    const grade = await Grade.findOne({ _id: gradeid });
    if (!grade) return res.status(404).json({ error: 'Grade not found' });
    const isOwnGrade = grade.user.equals(user.userinfo_id);

    const classInfo = await Class.findOne({ _id: grade.class });
    if (!classInfo) return res.status(404).json({ error: 'Class not found' });

    const subjectInfo = await Subject.findOne({ _id: grade.subject });
    if (!subjectInfo) return res.status(404).json({ error: 'Subject not found' });

    const isUserTeacher = classInfo.teachers.some(t => t.equals(user.userinfo_id));
    // blocks students from deleting other student's grades
    if (!isUserTeacher && !isOwnGrade) return res.status(403).json({ error: 'Only teachers can delete another student\'s grade.' });
    // blocks students from deleting their own grades
    if (!isUserTeacher && !subjectInfo.allowOwnGrades) return res.status(403).json({ error: 'Only teachers can delete another student\'s grade.' });

    await Grade.deleteOne({ _id: gradeid });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete grades error:', error);
    res.status(500).json({ error: 'Failed to delete grades', dbError: error });
  }
});

router.post(paths.dbUpdate, async (req, res) => {
  try {
    const user = req.user; // Assuming user is set by authentication middleware
    const { gradeid } = req.body;
    
    if (!gradeid) return res.status(400).json({ error: 'Grade ID required' });

    const userInfo = await UserInfo.findOne({ _id: user.userinfo_id });;
    if (!userInfo) return res.status(404).json({ error: 'User info not found' });

    const gradeInfo = await Grade.findOne({ _id: gradeid });
    if (!gradeInfo) return res.status(404).json({ error: 'Grade not found' });
    const isOwnGrade = gradeInfo.user.equals(user.userinfo_id);

    const classInfo = await Class.findOne({ _id: gradeInfo.class });
    if (!classInfo) return res.status(404).json({ error: 'Class not found' });

    const subjectInfo = await Subject.findOne({ _id: gradeInfo.subject });
    if (!subjectInfo) return res.status(404).json({ error: 'Subject not found' });

    const isUserTeacher = classInfo.teachers.some(t => t.equals(user.userinfo_id));
    // blocks students from deleting other student's grades
    if (!isUserTeacher && !isOwnGrade) return res.status(403).json({ error: 'Only teachers can update another student\'s grade.' });
    // blocks students from deleting their own grades
    if (!isUserTeacher && !subjectInfo.allowOwnGrades) return res.status(403).json({ error: 'Only teachers can update another student\'s grade.' });

    const { title, description, type, grade, gradeTitle } = req.body;
    if (title) gradeInfo.title = title;
    if (description) gradeInfo.description = description;
    if (type) gradeInfo.type = type;
    if (grade) gradeInfo.grade = grade;
    if (gradeTitle) gradeInfo.gradeTitle = gradeTitle;
    gradeInfo.editedAt = Date.now();
    await gradeInfo.save();

    res.json({ success: true });
  } catch (error) {
    console.error('Update grades error:', error);
    res.status(500).json({ error: 'Failed to update grades', dbError: error });
  }
});

module.exports = router;