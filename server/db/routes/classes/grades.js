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

    if (!user) return res.status(401).json({ error: req.t("errors.not_authenticated") });
    if (!classid && !subjectid && !homeworkid && !examid && !userid) return res.status(400).json({ error: req.t("errors.classid_or_subjectid_or_homeworkid_or_examid_or_userid_required") });

    const userInfo = await UserInfo.findOne({ _id: user.userinfo_id });
    if (!userInfo) return res.status(404).json({ error: req.t("errors.user_not_found") });

    let targetUserInfo = (targetuserid === user.userinfo_id) ? userInfo : await UserInfo.findOne({ _id: targetuserid });
    if (!targetUserInfo) return res.status(404).json({ error: req.t("errors.target_user_not_found") });

    let classInfo, subjectInfo;

    switch (true) {
      case !!examid:
        subjectInfo = await Subject.findOne({ lessons: examid });
        if (!subjectInfo) return res.status(404).json({ error: req.t("errors.exam_not_found") });
        classInfo = await Class.findOne({ subjects: subjectInfo._id });
        break;
      case !!homeworkid:
        subjectInfo = await Subject.findOne({ homework: homeworkid });
        if (!subjectInfo) return res.status(404).json({ error: req.t("errors.homework_not_found") });
        classInfo = await Class.findOne({ subjects: subjectInfo._id });
        break;
      case !!subjectid:
        classInfo = await Class.findOne({ subjects: subjectid });
        if (!classInfo) return res.status(404).json({ error: req.t("errors.subject_not_found") });
        break;
      case !!classid:
        classInfo = await Class.findOne({ _id: classid });
        if (!classInfo) return res.status(404).json({ error: req.t("errors.class_not_found") });
        break;
      case !!userid:
        if (userid != user.userinfo_id) return res.status(400).json({ error: req.t("errors.classid_required") });
        const grades = await Grade.find({ user: targetUserInfo._id }).lean();
        return res.json({ success: true, data: grades });
    }

    if (!classInfo) return res.status(404).json({ error: req.t("errors.class_not_found") });
    if (
      !classInfo.students.some(t => t.equals(user.userinfo_id))
      && !classInfo.teachers.some(t => t.equals(user.userinfo_id))
    ) return res.status(403).json({ error: req.t("errors.class_access_denied") });
    if (
      !classInfo.students.some(t => t.equals(targetUserInfo._id))
      && !classInfo.teachers.some(t => t.equals(targetUserInfo._id))
    ) return res.status(403).json({ error: req.t("errors.target_user_not_found") });
    const isUserTeacher = classInfo.teachers.some(t => t.equals(user.userinfo_id));
    if (targetuserid && targetuserid !== user.userinfo_id && !isUserTeacher) return res.status(403).json({ error: req.t("errors.grade_target_teacher_only") });

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
    res.status(500).json({ error: req.t("errors.request_responses.fail.get_grades"), dbError: error });
  }
});

router.post(paths.dbCreate, async (req, res) => {
  try {
    const user = req.user; // Assuming user is set by authentication middleware
    const { userid, classid, subjectid, homeworkid, examid } = req.body;
    const targetuserid = userid || user.userinfo_id;

    if (!user) return res.status(401).json({ error: req.t("errors.not_authenticated") });
    if (!classid) return res.status(400).json({ error: req.t("errors.classid_required") });
    if (!subjectid) return res.status(400).json({ error: req.t("errors.subjectid_required") });

    const userInfo = await UserInfo.findOne({ _id: user.userinfo_id });
    if (!userInfo) return res.status(404).json({ error: req.t("errors.user_not_found") });

    const classInfo = await Class.findOne({ _id: classid });
    if (!classInfo) return res.status(404).json({ error: req.t("errors.class_not_found") });

    const subjectInfo = await Subject.findOne({ _id: subjectid });
    if (!subjectInfo) return res.status(404).json({ error: req.t("errors.subject_not_found") });

    // teachers always pass
    const isUserTeacher = classInfo.teachers.some(t => t.equals(user.userinfo_id));
    // blocks students from adding their own grades
    if (!isUserTeacher && !subjectInfo.allowOwnGrades) return res.status(403).json({ error: req.t("errors.grade_create_teacher_only") });
    // blocks students from adding to another student's grades
    else if (!isUserTeacher && targetuserid != user.userinfo_id) return res.status(403).json({ error: req.t("errors.grade_target_create_teacher_only") });

    let targetUserInfo = (targetuserid === user.userid) ? userInfo : await UserInfo.findOne({ _id: targetuserid });
    if (!targetUserInfo) return res.status(404).json({ error: req.t("errors.target_user_not_found") });

    const { title, description, type, grade, gradeTitle } = req.body;
    if (!title) return res.status(400).json({ error: req.t("errors.grade_title_required") });
    if (!description) return res.status(400).json({ error: req.t("errors.grade_description_required") });
    if (!grade) return res.status(400).json({ error: req.t("errors.grade_value_required") });

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
    res.status(500).json({ error: req.t("errors.request_responses.fail.create_grade"), dbError: error });
  }
});

router.post(paths.dbDelete, async (req, res) => {
  try {
    const user = req.user; // Assuming user is set by authentication middleware
    const { gradeid } = req.body;
    
    if (!gradeid) return res.status(400).json({ error: req.t("errors.gradeid_required") });

    const userInfo = await UserInfo.findOne({ _id: user.userinfo_id });;
    if (!userInfo) return res.status(404).json({ error: req.t("errors.user_not_found") });

    const grade = await Grade.findOne({ _id: gradeid });
    if (!grade) return res.status(404).json({ error: req.t("errors.grade_not_found") });
    const isOwnGrade = grade.user.equals(user.userinfo_id);

    const classInfo = await Class.findOne({ _id: grade.class });
    if (!classInfo) return res.status(404).json({ error: req.t("errors.class_not_found") });

    const subjectInfo = await Subject.findOne({ _id: grade.subject });
    if (!subjectInfo) return res.status(404).json({ error: req.t("errors.subject_not_found") });

    const isUserTeacher = classInfo.teachers.some(t => t.equals(user.userinfo_id));
    // blocks students from deleting other student's grades
    if (!isUserTeacher && !isOwnGrade) return res.status(403).json({ error: req.t("errors.grade_target_delete_teacher_only") });
    // blocks students from deleting their own grades
    if (!isUserTeacher && !subjectInfo.allowOwnGrades) return res.status(403).json({ error: req.t("errors.grade_target_delete_teacher_only") });

    await Grade.deleteOne({ _id: gradeid });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete grades error:', error);
    res.status(500).json({ error: req.t("errors.request_responses.fail.delete_grade"), dbError: error });
  }
});

router.post(paths.dbUpdate, async (req, res) => {
  try {
    const user = req.user; // Assuming user is set by authentication middleware
    const { gradeid } = req.body;
    
    if (!gradeid) return res.status(400).json({ error: req.t("errors.gradeid_required") });

    const userInfo = await UserInfo.findOne({ _id: user.userinfo_id });;
    if (!userInfo) return res.status(404).json({ error: req.t("errors.user_not_found") });

    const gradeInfo = await Grade.findOne({ _id: gradeid });
    if (!gradeInfo) return res.status(404).json({ error: req.t("errors.grade_not_found") });
    const isOwnGrade = gradeInfo.user.equals(user.userinfo_id);

    const classInfo = await Class.findOne({ _id: gradeInfo.class });
    if (!classInfo) return res.status(404).json({ error: req.t("errors.class_not_found") });

    const subjectInfo = await Subject.findOne({ _id: gradeInfo.subject });
    if (!subjectInfo) return res.status(404).json({ error: req.t("errors.subject_not_found") });

    const isUserTeacher = classInfo.teachers.some(t => t.equals(user.userinfo_id));
    // blocks students from deleting other student's grades
    if (!isUserTeacher && !isOwnGrade) return res.status(403).json({ error: req.t("errors.grade_target_update_teacher_only") });
    // blocks students from deleting their own grades
    if (!isUserTeacher && !subjectInfo.allowOwnGrades) return res.status(403).json({ error: req.t("errors.grade_target_update_teacher_only") });

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
    res.status(500).json({ error: req.t("errors.request_responses.fail.update_grade"), dbError: error });
  }
});

module.exports = router;