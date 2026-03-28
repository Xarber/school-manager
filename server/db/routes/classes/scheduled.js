const express = require('express');
const mongoose = require("mongoose");
const { Lesson } = require("../../models/Lesson");
const { UserInfo, UserData } = require('../../models/User');
const { Subject } = require("../../models/Subject");
const { Class } = require("../../models/Class");
const paths = require('../paths.js');
const { idGenerate } = require('../../idgenerator');
const { ScheduledLesson } = require('../../models/Scheduled.js');

const router = express.Router();

router.post(paths.dbGet, async (req, res) => {
  try {
    const user = req.user; // Assuming user is set by authentication middleware
    const { lessonid } = req.body;

    if (!user) return res.status(401).json({ error: req.t("errors.not_authenticated") });
    if (!lessonid) return res.status(400).json({ error: req.t("errors.lessonid_required") });

    const userInfo = await UserInfo.findOne({ _id: user.userinfo_id });
    if (!userInfo) return res.status(404).json({ error: req.t("errors.user_not_found") });

    let classInfo, subjectInfo, lessonInfo;
    subjectInfo = await Subject.findOne({ lessons: lessonid });
    if (!subjectInfo) return res.status(404).json({ error: req.t("errors.subject_not_found") });

    classInfo = await Class.findOne({ subjects: subjectInfo._id });
    if (!classInfo) return res.status(404).json({ error: req.t("errors.class_not_found") });

    lessonInfo = await Lesson.findOne({ _id: lessonid }).populate('schedule');
    if (!lessonInfo) return res.status(404).json({ error: req.t("errors.lesson_not_found") });

    const isTeacher = classInfo.teachers.some(t => t.equals(user.userinfo_id));
    if (
      !classInfo.students.some(t => t.equals(user.userinfo_id))
      && !isTeacher
    ) return res.status(403).json({ error: req.t("errors.class_access_denied") });

    //* Get schedule for lesson (users and teachers)
    if (isTeacher) {
      return res.json({ success: true, data: lessonInfo.schedule });
    } else {
      let data = lessonInfo.schedule.toObject();

      // Filter out data.dates.students that are not the user
      data.dates = data.dates.map(date => {
        const students = date.students.map(s => {
          if (s.equals(user.userinfo_id)) return s;
          return 1;
        });
        return { ...date.toObject(), students };
      });

      return res.json({ success: true, data });
    }
  } catch (error) {
    console.error('Get schedule error:', error);
    res.status(500).json({ error: req.t("errors.request_responses.fail.get_schedule"), dbError: error });
  }
});

router.post(paths.dbCreate, async (req, res) => {
  try {
    const user = req.user; // Assuming user is set by authentication middleware
    const { lessonid } = req.body;

    if (!user) return res.status(401).json({ error: req.t("errors.not_authenticated") });
    if (!lessonid) return res.status(400).json({ error: req.t("errors.lessonid_required") });

    const userInfo = await UserInfo.findOne({ _id: user.userinfo_id });
    if (!userInfo) return res.status(404).json({ error: req.t("errors.user_not_found") });

    let classInfo, subjectInfo, lessonInfo;
    subjectInfo = await Subject.findOne({ lessons: lessonid });
    if (!subjectInfo) return res.status(404).json({ error: req.t("errors.subject_not_found") });

    classInfo = await Class.findOne({ subjects: subjectInfo._id });
    if (!classInfo) return res.status(404).json({ error: req.t("errors.class_not_found") });

    lessonInfo = await Lesson.findOne({ _id: lessonid });
    if (!lessonInfo) return res.status(404).json({ error: req.t("errors.lesson_not_found") });

    if (
      !classInfo.teachers.some(t => t.equals(user.userinfo_id))
    ) return res.status(403).json({ error: req.t("errors.schedule_update_teacher_only") });

    //* Update or create schedule for lesson (add days, move users etc.)

    const { dates, lock, exclude } = req.body;
    if (!dates) return res.status(400).json({ error: req.t("errors.schedule_dates_required") });
    
    let parsedDates;
    try {
      parsedDates = dates.map(d => {
        if (!d.day) throw new Error(req.t("errors.schedule_dates_day_required"));
        if (d.availability === undefined || isNaN(d.availability) || d.availability < -1)
          throw new Error(req.t("errors.schedule_dates_availability_required"));

        return {
          day: new Date(d.day),
          students: d.students || [],
          availability: d.availability,
          addedAt: new Date().toISOString(),
          editedAt: Date.now(),
        };
      });
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }
    
    let scheduleData = await ScheduledLesson.findOne({ _id: lessonInfo.schedule });
    let created = false;
    if (!scheduleData) {
      scheduleData = new ScheduledLesson({
        dates: parsedDates,
        lock: lock || false,
        exclude: exclude || [],
        addedAt: new Date().toISOString(),
        editedAt: Date.now(),
      });
      lessonInfo.schedule = scheduleData._id;
      lessonInfo.scheduled = true;
      await lessonInfo.save();
      created = true;
    }
    scheduleData.dates = parsedDates;
    if (lock !== undefined) scheduleData.lock = lock;
    if (exclude !== undefined) scheduleData.exclude = exclude;
    scheduleData.editedAt = Date.now();
    await scheduleData.save();

    let response = { success: true };
    if (created) response.data = scheduleData._id;
    return res.json(response);
  } catch (error) {
    console.error('Update schedule error:', error);
    res.status(500).json({ error: req.t("errors.request_responses.fail.update_schedule"), dbError: error });
  }
});

router.post(paths.dbDelete, async (req, res) => {
  try {
    const user = req.user; // Assuming user is set by authentication middleware
    const { lessonid } = req.body;

    if (!user) return res.status(401).json({ error: req.t("errors.not_authenticated") });
    if (!lessonid) return res.status(400).json({ error: req.t("errors.lessonid_required") });

    const userInfo = await UserInfo.findOne({ _id: user.userinfo_id });
    if (!userInfo) return res.status(404).json({ error: req.t("errors.user_not_found") });

    let classInfo, subjectInfo, lessonInfo;

    subjectInfo = await Subject.findOne({ lessons: lessonid });
    if (!subjectInfo) return res.status(404).json({ error: req.t("errors.subject_not_found") });

    classInfo = await Class.findOne({ subjects: subjectInfo._id });
    if (!classInfo) return res.status(404).json({ error: req.t("errors.class_not_found") });

    lessonInfo = await Lesson.findOne({ _id: lessonid });
    if (!lessonInfo) return res.status(404).json({ error: req.t("errors.lesson_not_found") });

    if (
      !classInfo.teachers.some(t => t.equals(user.userinfo_id))
    ) return res.status(403).json({ error: req.t("errors.schedule_delete_teacher_only") });

    let scheduleData = await ScheduledLesson.findOne({ _id: lessonInfo.schedule });
    if (!scheduleData) return res.status(404).json({ error: req.t("errors.schedule_not_found") });
    scheduleData.exclude = [];
    scheduleData.dates = scheduleData.dates.map(d => ({ ...d.toObject(), students: [] }));
    await scheduleData.save();

    return res.json({ success: true });
  } catch (error) {
    console.error('Delete schedule error:', error);
    res.status(500).json({ error: req.t("errors.request_responses.fail.delete_schedule"), dbError: error });
  }
});

router.post(paths.dbUpdate, async (req, res) => {
  try {
    const user = req.user; // Assuming user is set by authentication middleware
    const { lessonid } = req.body;

    if (!user) return res.status(401).json({ error: req.t("errors.not_authenticated") });
    if (!lessonid) return res.status(400).json({ error: req.t("errors.lessonid_required") });

    const userInfo = await UserInfo.findOne({ _id: user.userinfo_id });
    if (!userInfo) return res.status(404).json({ error: req.t("errors.user_not_found") });

    let classInfo, subjectInfo, lessonInfo;

    subjectInfo = await Subject.findOne({ lessons: lessonid });
    if (!subjectInfo) return res.status(404).json({ error: req.t("errors.subject_not_found") });

    classInfo = await Class.findOne({ subjects: subjectInfo._id });
    if (!classInfo) return res.status(404).json({ error: req.t("errors.class_not_found") });

    lessonInfo = await Lesson.findOne({ _id: lessonid });
    if (!lessonInfo) return res.status(404).json({ error: req.t("errors.lesson_not_found") });

    if (
      !classInfo.teachers.some(t => t.equals(user.userinfo_id))
      && !classInfo.students.some(t => t.equals(user.userinfo_id))
    ) return res.status(403).json({ error: req.t("errors.class_access_denied") });

    let scheduleData = await ScheduledLesson.findOne({ _id: lessonInfo.schedule });
    if (!scheduleData) return res.status(404).json({ error: req.t("errors.schedule_not_found") });
    if (scheduleData.lock) return res.status(403).json({ error: req.t("errors.schedule_update_teacher_only") });

    const { day } = req.body;
    if (!day) return res.status(400).json({ error: req.t("errors.schedule_dates_day_required") });

    let dateData = scheduleData.dates.find(d => new Date(d.day).getTime() === new Date(day).getTime());
    if (!dateData) return res.status(404).json({ error: req.t("errors.schedule_dates_day_required") });

    if (scheduleData.dates.find(d => d.students.some(s => s.equals(user.userinfo_id)))) return res.status(403).json({ error: req.t("errors.schedule_update_teacher_only") });
    if (dateData.students.some(s => s.equals(user.userinfo_id))) {
      return res.status(403).json({ error: req.t("errors.schedule_update_teacher_only") });
    }
    
    scheduleData.dates = scheduleData.dates.map(d => {
      if (new Date(d.day).getTime() !== new Date(day).getTime()) return d;
      
      return {
        ...d.toObject(),
        students: [...d.students, user.userinfo_id]
      }
    });
    await scheduleData.save();

    return res.json({ success: true });
  } catch (error) {
    console.error('Update schedule error:', error);
    res.status(500).json({ error: req.t("errors.request_responses.fail.update_schedule"), dbError: error });
  }
});

module.exports = router;