const express = require('express');
const mongoose = require("mongoose");
const { Lesson } = require("../../models/Lesson");
const { UserInfo, UserData } = require('../../models/User');
const paths = require('../paths.json');
const { idGenerate } = require('../../idgenerator');

const router = express.Router();

router.post(paths.dbGet, async (req, res) => {
  try {
    const user = req.user; // Assuming user is set by authentication middleware
    const { classid, subjectid, lessonid } = req.body;

    if (!user) return res.status(401).json({ error: 'User authentication required' });
    if (!classid) return res.status(400).json({ error: 'Class ID required' });
    if (!subjectid) return res.status(400).json({ error: 'Subject ID required' });
    if (!lessonid) return res.status(400).json({ error: 'Lesson ID required' });

    const userInfo = await UserInfo.findOne({ userid: user.userid });
    if (!userInfo) return res.status(404).json({ error: 'User info not found' });

    const lesson = await Lesson.findOne({ lessonid, classid, subjectid }).lean();
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });

    res.json({ success: true, data: lesson });
  } catch (error) {
    console.error('Get lesson error:', error);
    res.status(500).json({ error: 'Failed to get lesson' });
  }
});

router.post(paths.dbCreate, async (req, res) => {
  try {
    const user = req.user; // Assuming user is set by authentication middleware
    const { classid, subjectid } = req.body;    

    if (!user) return res.status(401).json({ error: 'User authentication required' });    
    if (!classid) return res.status(400).json({ error: 'Class ID required' });
    if (!subjectid) return res.status(400).json({ error: 'Subject ID required' });    

    const userInfo = await UserInfo.findOne({ userid: user.userid });
    if (!userInfo) return res.status(404).json({ error: 'User info not found' });
    if (userInfo.role !== 'teacher') return res.status(403).json({ error: 'Only teachers can create lessons' });

    const subjectInfo = await Subject.findOne({ subjectid, classid });
    if (!subjectInfo) return res.status(404).json({ error: 'Subject not found' });
    if (!subjectInfo.teacher.includes(userInfo._id)) return res.status(403).json({ error: 'Only teachers of this subject can create lessons' });

    const { title, description, date, time, room, isExam } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });

    const newLesson = new Lesson({
        lessonid: `lesson_${idGenerate()}`,
        classid,
        subjectid,
        title,
        description,
        date,
        time,
        teacher: userInfo._id,
        scheduled: date && time && new Date(`${date}T${time}`).getTime() > Date.now() ? true : false,
        room: room || undefined,
        isExam: isExam || false,
        addedAt: new Date().toISOString(),
    });
    await newLesson.save();

    //add lesson to subject
    subjectInfo.lessons.push(newLesson._id);
    await subjectInfo.save();

    res.json({ success: true, data: newLesson.lessonid });
  } catch (error) {
    console.error('Create lesson error:', error);
    res.status(500).json({ error: 'Failed to create lesson' });
  }
});

router.post(paths.dbDelete, async (req, res) => {
  try {
    const user = req.user; // Assuming user is set by authentication middleware
    const { lessonid } = req.body;

    if (!user) return res.status(401).json({ error: 'User authentication required' });
    if (!lessonid) return res.status(400).json({ error: 'Lesson ID required' });

    const userInfo = await UserInfo.findOne({ userid: user.userid });
    if (!userInfo) return res.status(404).json({ error: 'User info not found' });

    const lesson = await Lesson.findOne({ lessonid });
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });
    if (userInfo.role !== 'teacher') return res.status(403).json({ error: 'Only teachers can delete lessons' });

    const subjectInfo = await Subject.findOne({ subjectid: lesson.subjectid, classid: lesson.classid });    
    if (!subjectInfo) return res.status(404).json({ error: 'Subject not found' });
    if (!subjectInfo.teacher.includes(userInfo._id)) return res.status(403).json({ error: 'Only teachers of this subject can delete lessons' });
    
    //remove lesson from subject
    subjectInfo.lessons = subjectInfo.lessons.filter(l => l.toString() !== lesson._id.toString());
    await subjectInfo.save();

    await Lesson.deleteOne({ lessonid });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete lesson error:', error);
    res.status(500).json({ error: 'Failed to delete lesson' });
  }
});

router.post(paths.dbUpdate, async (req, res) => {
  try {
    const user = req.user; // Assuming user is set by authentication middleware
    const { lessonid, title, description, date, time, room, isExam } = req.body;

    if (!user) return res.status(401).json({ error: 'User authentication required' });
    if (!lessonid) return res.status(400).json({ error: 'Lesson ID required' });

    const userInfo = await UserInfo.findOne({ userid: user.userid });
    if (!userInfo) return res.status(404).json({ error: 'User info not found' });

    const lesson = await Lesson.findOne({ lessonid });
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });

    if (userInfo.role !== 'teacher') {
      return res.status(403).json({ error: 'Only teachers can update lesson' });
    }

    if (title !== undefined) lesson.title = title;
    if (description !== undefined) lesson.description = description;
    if (date !== undefined) lesson.date = date;
    if (time !== undefined) lesson.time = time;
    if (room !== undefined) lesson.room = room;
    if (isExam !== undefined) lesson.isExam = isExam;
    lesson.scheduled = lesson.date && lesson.time && new Date(`${lesson.date}T${lesson.time}`).getTime() > new Date(lesson.addedAt).getTime() ? true : false;

    if (title === undefined && description === undefined && date === undefined && time === undefined && room === undefined && isExam === undefined) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    await lesson.save();

    res.json({ success: true });
  } catch (error) {
    console.error('Update lesson error:', error);
    res.status(500).json({ error: 'Failed to update lesson' });
  }
});

module.exports = router;