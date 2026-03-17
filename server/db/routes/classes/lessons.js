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

    if (!user) return res.status(401).json({ error: 'User authentication required' });
    if (!classid && !subjectid && !lessonid) return res.status(400).json({ error: 'Class ID or Subject ID or Lesson ID required' });

    const userInfo = await UserInfo.findOne({ _id: user.userinfo_id });
    if (!userInfo) return res.status(404).json({ error: 'User info not found' });

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

    if (!classInfo) return res.status(404).json({ error: 'Class not found' });
    else if (!classid && !subjectInfo) return res.status(404).json({ error: 'Subject not found' });

    if (
      !classInfo.students.some(t => t.equals(user.userinfo_id))
      && !classInfo.teachers.some(t => t.equals(user.userinfo_id))
    ) return res.status(403).json({ error: 'Access denied to this class' });

    if (lessonid) {
      const lesson = await Lesson.findOne({ _id: lessonid }).lean();
      if (!lesson) return res.status(404).json({ error: 'Lesson not found' });
      return res.json({ success: true, data: lesson });
    }

    if (subjectid) {
      const subject = await Subject.findOne({ _id: subjectid }).lean();
      if (!subject) return res.status(404).json({ error: 'Subject not found' });
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
    res.status(500).json({ error: 'Failed to get lessons', dbError: error });
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

    const classInfo = await Class.findOne({ _id: classid });
    if (!classInfo) return res.status(404).json({ error: 'Class not found' });
    if (!classInfo.teachers.some(t => t.equals(userInfo._id))) return res.status(403).json({ error: 'Only teachers can create lessons' });

    const subjectInfo = await Subject.findOne({ _id: subjectid });
    if (!subjectInfo) return res.status(404).json({ error: 'Subject not found' });
    //if (!subjectInfo.teacher.some(t => t.equals(userInfo._id))) return res.status(403).json({ error: 'Only teachers can create lessons' });

    const { title, description, date, time, room, isExam, isScheduled } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });

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
    res.status(500).json({ error: 'Failed to create lesson', dbError: error });
  }
});

router.post(paths.dbDelete, async (req, res) => {
  try {
    const user = req.user; // Assuming user is set by authentication middleware
    const { lessonid } = req.body;

    if (!user) return res.status(401).json({ error: 'User authentication required' });
    if (!lessonid) return res.status(400).json({ error: 'Lesson ID required' });

    const userInfo = await UserInfo.findOne({ _id: user.userinfo_id });;
    if (!userInfo) return res.status(404).json({ error: 'User info not found' });

    const lesson = await Lesson.findOne({ _id: lessonid });
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });

    const subjectInfo = await Subject.findOne({ lessons: lessonid });
    if (!subjectInfo) return res.status(404).json({ error: 'Subject not found' });

    const classInfo = await Class.findOne({ subjects: subjectInfo._id });
    if (!classInfo) return res.status(404).json({ error: 'Class not found' });
    if (!classInfo.teachers.some(t => t.equals(userInfo._id))) return res.status(403).json({ error: 'Only teachers can delete lessons' });

    // Remove lesson from subject
    subjectInfo.lessons = subjectInfo.lessons.filter(lsId => lsId.toString() !== lesson._id.toString());
    await subjectInfo.save();
    
    await Lesson.deleteOne({ _id: lessonid });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete lesson error:', error);
    res.status(500).json({ error: 'Failed to delete lesson', dbError: error });
  }
});

router.post(paths.dbUpdate, async (req, res) => {
  try {
    const user = req.user; // Assuming user is set by authentication middleware
    const { lessonid } = req.body;

    if (!user) return res.status(401).json({ error: 'User authentication required' });
    if (!lessonid) return res.status(400).json({ error: 'Lesson ID required' });

    const userInfo = await UserInfo.findOne({ _id: user.userinfo_id });;
    if (!userInfo) return res.status(404).json({ error: 'User info not found' });

    const lesson = await Lesson.findOne({ _id: lessonid });
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });

    const subjectInfo = await Subject.findOne({ lessons: lessonid });
    if (!subjectInfo) return res.status(404).json({ error: 'Subject not found' });

    const classInfo = await Class.findOne({ subjects: subjectInfo._id });
    if (!classInfo) return res.status(404).json({ error: 'Class not found' });
    if (!classInfo.teachers.some(t => t.equals(userInfo._id))) return res.status(403).json({ error: 'Only teachers can update lessons' });

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
    res.status(500).json({ error: 'Failed to update lesson', dbError: error });
  }
});

module.exports = router;