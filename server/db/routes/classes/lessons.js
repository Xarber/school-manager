const express = require('express');
const mongoose = require("mongoose");
const { Lesson } = require("../../models/Lesson");
const { UserInfo, UserData } = require('../../models/User');
const { Subject } = require("../../models/Subject");
const { Class } = require("../../models/Class");
const paths = require('../paths.js');
const { idGenerate } = require('../../idgenerator');

const router = express.Router();

router.post(paths.dbGet, async (req, res) => {
  try {
    const user = req.user; // Assuming user is set by authentication middleware
    const { classid, subjectid, lessonid } = req.body;

    if (!user) return res.status(401).json({ error: req.t("errors.not_authenticated") });
    if (!classid && !subjectid && !lessonid) return res.status(400).json({ error: req.t("errors.classid_or_subjectid_or_lessonid_required") });

    const userInfo = await UserInfo.findOne({ _id: user.userinfo_id });
    if (!userInfo) return res.status(404).json({ error: req.t("errors.user_not_found") });

    let classInfo, subjectInfo;

    switch (true) {
      case !!lessonid:
        subjectInfo = await Subject.findOne({ lessons: lessonid });
        classInfo = await Class.findOne({ subjects: subjectInfo._id });
        break;
      case !!subjectid:
        subjectInfo = await Subject.findOne({ _id: subjectid });
        classInfo = await Class.findOne({ subjects: subjectid });
        break;
      case !!classid:
        classInfo = await Class.findOne({ _id: classid });
        break;
      default:
        break;
    }

    if (!classInfo) return res.status(404).json({ error: req.t("errors.class_not_found") });
    else if (!classid && !subjectInfo) return res.status(404).json({ error: req.t("errors.subject_not_found") });

    if (
      !classInfo.students.some(t => t.equals(user.userinfo_id))
      && !classInfo.teachers.some(t => t.equals(user.userinfo_id))
    ) return res.status(403).json({ error: req.t("errors.class_access_denied") });

    if (lessonid) {
      const lesson = await Lesson.findOne({ _id: lessonid }).lean();
      if (!lesson) return res.status(404).json({ error: req.t("errors.lesson_not_found") });
      return res.json({ success: true, data: lesson });
    }

    if (subjectid) {
      const subject = await Subject.findOne({ _id: subjectid }).lean();
      if (!subject) return res.status(404).json({ error: req.t("errors.subject_not_found") });
      return res.json({ success: true, data: subject.lesson || [] });
    }

    if (!classInfo.subjects || classInfo.subjects.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const subjects = await Subject.find({ _id: { $in: classInfo.subjects } })
      .populate('lessons')
      .lean();

    const result = subjects.map(subject => ({
      subjectid: subject._id,
      data: subject.lessons || []
    }));

    return res.json({ success: true, data: result });
  } catch (error) {
    console.error('Get lessons error:', error);
    res.status(500).json({ error: req.t("errors.request_responses.fail.get_lessons"), dbError: error });
  }
});

router.post(paths.dbCreate, async (req, res) => {
  try {
    const user = req.user; // Assuming user is set by authentication middleware
    const { classid, subjectid } = req.body;

    if (!user) return res.status(401).json({ error: req.t("errors.not_authenticated") });
    if (!classid) return res.status(400).json({ error: req.t("errors.classid_required") });
    if (!subjectid) return res.status(400).json({ error: req.t("errors.subjectid_required") });

    const userInfo = await UserInfo.findOne({ _id: user.userinfo_id });;
    if (!userInfo) return res.status(404).json({ error: req.t("errors.user_not_found") });

    const classInfo = await Class.findOne({ _id: classid });
    if (!classInfo) return res.status(404).json({ error: req.t("errors.class_not_found") });
    if (!classInfo.teachers.some(t => t.equals(userInfo._id))) return res.status(403).json({ error: req.t("errors.lesson_create_teacher_only") });

    const subjectInfo = await Subject.findOne({ _id: subjectid });
    if (!subjectInfo) return res.status(404).json({ error: req.t("errors.subject_not_found") });

    const { title, description, date, time, room, isExam, isScheduled } = req.body;
    if (!title) return res.status(400).json({ error: req.t("errors.lesson_title_required") });

    const newLesson = new Lesson({
        //lessonid: `lesson_${idGenerate()}`,
        title,
        description,
        date,
        time,
        teacher: userInfo._id,
        room: room || undefined,
        material: [],
        scheduled: isScheduled || false,
        isExam: isExam || false,
        addedAt: new Date().toISOString(),
        editedAt: Date.now(),
    });
    await newLesson.save();

    //add lesson to subject
    subjectInfo.lessons.push(newLesson._id);
    await subjectInfo.save();

    res.json({ success: true, data: newLesson._id });
  } catch (error) {
    console.error('Create lesson error:', error);
    res.status(500).json({ error: req.t("errors.request_responses.fail.create_lesson"), dbError: error });
  }
});

router.post(paths.dbDelete, async (req, res) => {
  try {
    const user = req.user; // Assuming user is set by authentication middleware
    const { lessonid } = req.body;

    if (!user) return res.status(401).json({ error: req.t("errors.not_authenticated") });
    if (!lessonid) return res.status(400).json({ error: req.t("errors.lessonid_required") });

    const userInfo = await UserInfo.findOne({ _id: user.userinfo_id });;
    if (!userInfo) return res.status(404).json({ error: req.t("errors.user_not_found") });

    const lesson = await Lesson.findOne({ _id: lessonid });
    if (!lesson) return res.status(404).json({ error: req.t("errors.lesson_not_found") });

    const subjectInfo = await Subject.findOne({ lessons: lessonid });
    if (!subjectInfo) return res.status(404).json({ error: req.t("errors.subject_not_found") });

    const classInfo = await Class.findOne({ subjects: subjectInfo._id });
    if (!classInfo) return res.status(404).json({ error: req.t("errors.class_not_found") });
    if (!classInfo.teachers.some(t => t.equals(userInfo._id))) return res.status(403).json({ error: req.t("errors.lesson_delete_teacher_only") });

    // Remove lesson from subject
    subjectInfo.lessons = subjectInfo.lessons.filter(lsId => lsId.toString() !== lesson._id.toString());
    await subjectInfo.save();
    
    await Lesson.deleteOne({ _id: lessonid });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete lesson error:', error);
    res.status(500).json({ error: req.t("errors.request_responses.fail.delete_lesson"), dbError: error });
  }
});

router.post(paths.dbUpdate, async (req, res) => {
  try {
    const user = req.user; // Assuming user is set by authentication middleware
    const { lessonid } = req.body;

    if (!user) return res.status(401).json({ error: req.t("errors.not_authenticated") });
    if (!lessonid) return res.status(400).json({ error: req.t("errors.lessonid_required") });

    const userInfo = await UserInfo.findOne({ _id: user.userinfo_id });;
    if (!userInfo) return res.status(404).json({ error: req.t("errors.user_not_found") });

    const lesson = await Lesson.findOne({ _id: lessonid });
    if (!lesson) return res.status(404).json({ error: req.t("errors.lesson_not_found") });

    const subjectInfo = await Subject.findOne({ lessons: lessonid });
    if (!subjectInfo) return res.status(404).json({ error: req.t("errors.subject_not_found") });

    const classInfo = await Class.findOne({ subjects: subjectInfo._id });
    if (!classInfo) return res.status(404).json({ error: req.t("errors.class_not_found") });
    if (!classInfo.teachers.some(t => t.equals(userInfo._id))) return res.status(403).json({ error: req.t("errors.lesson_update_teacher_only") });

    const { title, description, date, time, room, isExam, isScheduled } = req.body;

    if (title !== undefined) lesson.title = title;
    if (description !== undefined) lesson.description = description;
    if (date !== undefined) lesson.date = date;
    if (time !== undefined) lesson.time = time;
    if (room !== undefined) lesson.room = room;
    if (isExam !== undefined) lesson.isExam = isExam;
    if (isScheduled !== undefined) lesson.scheduled = isScheduled;
    lesson.editedAt = Date.now();

    await lesson.save();

    res.json({ success: true });
  } catch (error) {
    console.error('Update lesson error:', error);
    res.status(500).json({ error: req.t("errors.request_responses.fail.update_lesson"), dbError: error });
  }
});

module.exports = router;