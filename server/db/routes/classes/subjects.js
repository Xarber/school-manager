const express = require('express');
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const { Subject } = require("../../models/Subject");
const { Class } = require("../../models/Class");
const { UserInfo, UserData } = require('../../models/User');
const paths = require('../paths.json');
const { idGenerate } = require('../../idgenerator');
dotenv.config();

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

        const { title, description } = req.body;
        if (!title) return res.status(400).json({ error: 'Title is required' });
        if (!description) return res.status(400).json({ error: 'Description is required' });

        const newSubject = new Subject({
            subjectid: `subject_${idGenerate()}`,
            classid,
            title,
            description,
            addedAt: new Date().toISOString(),
        });
        await newSubject.save();

        res.json({ success: true, data: newSubject.subjectid });
    } catch (error) {
        console.error('Create subject error:', error);
        res.status(500).json({ error: 'Failed to create subject' });
    }
});

router.post(paths.dbUpdate, async (req, res) => {
    try {
        const user = req.user; // Assuming user is set by authentication middleware
        const { subjectid, title, description } = req.body;

        if (!user) return res.status(401).json({ error: 'User authentication required' });
        if (!subjectid) return res.status(400).json({ error: 'Subject ID required' });

        const userInfo = await UserInfo.findOne({ userid: user.userid });
        if (!userInfo) return res.status(404).json({ error: 'User info not found' });
        if (userInfo.role !== 'teacher') return res.status(403).json({ error: 'Only teachers can update subjects' });

        const subject = await Subject.findOne({ subjectid });
        if (!subject) return res.status(404).json({ error: 'Subject not found' });

        if (title !== undefined) subject.title = title;
        if (description !== undefined) subject.description = description;

        if (title === undefined && description === undefined) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        await subject.save();

        res.json({ success: true, data: subject });
    } catch (error) {
        console.error('Update subject error:', error);
        res.status(500).json({ error: 'Failed to update subject' });
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

        await Subject.deleteOne({ subjectid });

        res.json({ success: true });
    } catch (error) {
        console.error('Delete subject error:', error);
        res.status(500).json({ error: 'Failed to delete subject' });
    }
});

module.exports = router;