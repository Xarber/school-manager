const express = require('express');
const mongoose = require("mongoose");
const { Subject } = require("../../models/Subject");
const { Class } = require("../../models/Class");
const { UserInfo, UserData } = require('../../models/User');
const paths = require('../paths.js');
const { idGenerate } = require('../../idgenerator');

const router = express.Router();

router.post(paths.dbGet, async (req, res) => {
    try {
        const user = req.user; // Assuming user is set by authentication middleware
        const { classid, subjectid } = req.body;

        if (!user) return res.status(401).json({ error: 'User authentication required' });
        if (!classid) return res.status(400).json({ error: 'Class ID required' });
        if (!subjectid) return res.status(400).json({ error: 'Subject ID required' });

        const userInfo = await UserInfo.findOne({ userid: user.userid });
        if (!userInfo) return res.status(404).json({ error: 'User info not found' });

        const subject = await Subject.findOne({ subjectid, classid }).lean();
        if (!subject) return res.status(404).json({ error: 'Subject not found' });

        res.json({ success: true, data: subject });
    } catch (error) {
        console.error('Get subject error:', error);
        res.status(500).json({ error: 'Failed to get subject' });
    }
});

router.post(paths.dbCreate, async (req, res) => {
    try {
        const user = req.user; // Assuming user is set by authentication middleware
        const { classid } = req.body;

        if (!user) return res.status(401).json({ error: 'User authentication required' });
        if (!classid) return res.status(400).json({ error: 'Class ID required' });

        const userInfo = await UserInfo.findOne({ userid: user.userid });
        if (!userInfo) return res.status(404).json({ error: 'User info not found' });
        if (userInfo.role !== 'teacher') return res.status(403).json({ error: 'Only teachers can create subjects' });

        const classInfo = await Class.findOne({ classid });
        if (!classInfo) return res.status(404).json({ error: 'Class not found' });
        if (!classInfo.teachers.includes(userInfo._id)) return res.status(403).json({ error: 'Only teachers can create subjects' });

        const { name, maxgrade, gradeType } = req.body;
        if (!name) return res.status(400).json({ error: 'Name is required' });
        if (!maxgrade) return res.status(400).json({ error: 'Max grade is required' });
        if (!gradeType) return res.status(400).json({ error: 'Grade type is required' });

        const newSubject = new Subject({
            subjectid: `subject_${idGenerate()}`,
            classid,
            name,
            teacher: [userInfo._id],
            schedule: [
                { day: 'Monday', hours: [] },
                { day: 'Tuesday', hours: [] },
                { day: 'Wednesday', hours: [] },
                { day: 'Thursday', hours: [] },
                { day: 'Friday', hours: [] },
            ],
            maxgrade,
            gradeType,
            addedAt: new Date().toISOString(),
            editedAt: Date.now(),
        });
        await newSubject.save();

        classInfo.subjects.push(newSubject._id);
        await classInfo.save();

        res.json({ success: true, data: newSubject.subjectid });
    } catch (error) {
        console.error('Create subject error:', error);
        res.status(500).json({ error: 'Failed to create subject' });
    }
});

router.post(paths.dbDelete, async (req, res) => {
    try {
        const user = req.user; // Assuming user is set by authentication middleware
        const { subjectid } = req.body;

        if (!user) return res.status(401).json({ error: 'User authentication required' });
        if (!subjectid) return res.status(400).json({ error: 'Subject ID required' });

        const userInfo = await UserInfo.findOne({ userid: user.userid });
        if (!userInfo) return res.status(404).json({ error: 'User info not found' });
        if (userInfo.role !== 'teacher') return res.status(403).json({ error: 'Only teachers can delete subjects' });

        const classInfo = await Class.findOne({ subjects: subjectid });
        if (!classInfo) return res.status(404).json({ error: 'Class not found' });
        if (!classInfo.teachers.includes(userInfo._id)) return res.status(403).json({ error: 'Only teachers can delete subjects' });

        const subjectInfo = await Subject.findOne({ subjectid });
        if (!subjectInfo) return res.status(404).json({ error: 'Subject not found' });
        if (!subjectInfo.teacher.includes(userInfo._id)) return res.status(403).json({ error: 'Only teachers of this subject can delete it' });

        //remove subject from class
        classInfo.subjects = classInfo.subjects.filter(s => s.toString() !== subjectInfo._id.toString());
        await classInfo.save();

        await Subject.deleteOne({ subjectid });

        res.json({ success: true });
    } catch (error) {
        console.error('Delete subject error:', error);
        res.status(500).json({ error: 'Failed to delete subject' });
    }
});

router.post(paths.dbUpdate, async (req, res) => {
    try {
        const user = req.user; // Assuming user is set by authentication middleware
        const { subjectid, name, maxgrade, teacher, schedule } = req.body;

        if (!user) return res.status(401).json({ error: 'User authentication required' });
        if (!subjectid) return res.status(400).json({ error: 'Subject ID required' });

        const userInfo = await UserInfo.findOne({ userid: user.userid });
        if (!userInfo) return res.status(404).json({ error: 'User info not found' });
        if (userInfo.role !== 'teacher') return res.status(403).json({ error: 'Only teachers can update subjects' });

        const subject = await Subject.findOne({ subjectid });
        if (!subject) return res.status(404).json({ error: 'Subject not found' });

        if (name !== undefined) subject.name = name;
        if (maxgrade !== undefined) subject.maxgrade = maxgrade;
        if (teacher !== undefined) subject.teacher = teacher;
        if (schedule !== undefined) subject.schedule = schedule;
        subject.editedAt = Date.now();

        if (name === undefined && maxgrade === undefined && teacher === undefined && schedule === undefined) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        await subject.save();

        res.json({ success: true, data: subject });
    } catch (error) {
        console.error('Update subject error:', error);
        res.status(500).json({ error: 'Failed to update subject' });
    }
});

module.exports = router;