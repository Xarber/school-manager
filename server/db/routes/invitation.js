const express = require('express');
const mongoose = require("mongoose");
const { UserInfo, UserData } = require('../models/User');
const { Invitation } = require('../models/Invitation');
const { Class } = require('../models/Class');
const { invitationGenerate } = require('../idgenerator');
const paths = require('./paths.js');

const router = express.Router();

router.post(paths.dbGet, async (req, res) => {
    // Get Invitation info
    try {
        const user = req.user; // Assuming user is set by authentication middleware
        if (!user) return res.status(401).json({ error: 'User authentication required' });

        const userData = await UserData.findOne({ _id: user.userdata_id }).populate(["userInfo"]).exec();
        if (!userData) return res.status(404).json({ error: 'User data not found' });

        const { code } = req.body;
        if (!code) return res.status(400).json({ error: 'Invitation code is required' });

        const invitation = await Invitation.findOne({ code: code.toUpperCase() }).populate("author");
        if (!invitation) return res.status(404).json({ error: 'Invitation not found' });
        if (invitation.maxUsage != -1 && invitation.used >= invitation.maxUsage) return res.status(400).json({ error: 'Invitation has expired' });
        if (invitation.joinAs == 'teacher' && userData.userInfo.role == 'student') return res.status(403).json({ error: "You can\'t use a teacher invite to join as a student" });

        switch (invitation.for) {
            case "class": 
                const classInfo = await Class.findOne({ _id: invitation.targetid }).populate(["teachers"]).exec();
                if (!classInfo) return res.status(404).json({ error: 'Invalid invitation' });
                return res.json({ success: true, data: {_id: classInfo._id, for: invitation.for, joinAs: invitation.joinAs, name: classInfo.name, notes: classInfo.notes, teachers: classInfo.teachers, students: classInfo.students.length, author: {name: invitation.author.name, surname: invitation.author.surname}} });
            default: 
                return res.status(500).json({ error: 'Invitation type not supported' });
        }
    } catch (error) {
        console.error('Get invitation error:', error);
        res.status(500).json({ error: 'Failed to get invitation', dbError: error });
    }
});

router.post(paths.dbCreate, async (req, res) => {
    // New invitation
    try {
        const user = req.user; // Assuming user is set by authentication middleware
        if (!user) return res.status(401).json({ error: 'User authentication required' });

        const userData = await UserData.findOne({ _id: user.userdata_id });
        if (!userData) return res.status(404).json({ error: 'User data not found' });

        const { maxUsage, joinAs, targetid } = req.body;
        const code = invitationGenerate();
        if (!joinAs) return res.status(400).json({ error: 'Join as is required' });
        if (!req.body.for) return res.status(400).json({ error: 'For is required' });
        if (!targetid) return res.status(400).json({ error: 'Target ID is required' });

        switch (req.body.for) {
            case "class": 
                const classInfo = await Class.findOne({ _id: targetid });
                if (!classInfo) return res.status(404).json({ error: 'Invalid invitation' });
                if (!classInfo.teachers.some(t => t.equals(user.userinfo_id))) return res.status(403).json({ error: 'Only teachers can create invitations for classes' });
                break;
            default: 
                return res.status(500).json({ error: 'Invitation type not supported' });
        }

        const invitation = new Invitation({
            code: code,
            maxUsage: maxUsage,
            joinAs: joinAs,
            for: req.body.for,
            targetid: targetid,
            author: user.userinfo_id
        });
        await invitation.save();

        res.json({ success: true, data: code });
    } catch (error) {
        console.error('Create invitation error:', error);
        res.status(500).json({ error: 'Failed to create invitation', dbError: error });
    }
});

router.post(paths.dbDelete, async (req, res) => {
    // Disable invitation by setting maxUsage to 0
    try {
        const user = req.user; // Assuming user is set by authentication middleware
        if (!user) return res.status(401).json({ error: 'User authentication required' });

        const userData = await UserData.findOne({ _id: user.userdata_id });
        if (!userData) return res.status(404).json({ error: 'User data not found' });

        const { code } = req.body;
        if (!code) return res.status(400).json({ error: 'Invitation code is required' });

        const invitation = await Invitation.findOne({ code: code.toUpperCase() });
        if (!invitation) return res.status(404).json({ error: 'Invitation not found' });
        if (invitation.author != user.userinfo_id) return res.status(403).json({ error: 'Only the creator of the invitation can delete it' });

        invitation.maxUsage = 0;
        await invitation.save();

        res.json({ success: true });
    } catch (error) {
        console.error('Delete invitation error:', error);
        res.status(500).json({ error: 'Failed to delete invitation', dbError: error });
    }
});

router.post(paths.dbUpdate, async (req, res) => {
    // Use invite
    try {
        const user = req.user; // Assuming user is set by authentication middleware
        if (!user) return res.status(401).json({ error: 'User authentication required' });

        const userData = await UserData.findOne({ _id: user.userdata_id }).populate(["userInfo"]).exec();
        if (!userData) return res.status(404).json({ error: 'User data not found' });

        const { code } = req.body;
        if (!code) return res.status(400).json({ error: 'Invitation code is required' });

        const invitation = await Invitation.findOne({ code: code.toUpperCase() });
        if (!invitation) return res.status(404).json({ error: 'Invitation not found' });
        if (invitation.maxUsage != -1 && invitation.used >= invitation.maxUsage) return res.status(400).json({ error: 'Invitation has expired' });
        if (invitation.joinAs == 'teacher' && userData.userInfo.role == 'student') return res.status(403).json({ error: "You can\'t use a teacher invite to join as a student" });

        switch (invitation.for) {
            case "class": 
                const classInfo = await Class.findOne({ _id: invitation.targetid });
                if (!classInfo) return res.status(404).json({ error: 'Invalid invitation' });
                if (userData.classes.some(c => c.equals(classInfo._id))) return res.status(400).json({ error: 'You are already in this class' });

                if (invitation.joinAs === 'teacher') {
                    classInfo.teachers.push(user.userinfo_id);
                } else {
                    classInfo.students.push(user.userinfo_id);
                }
                await classInfo.save();

                userData.classes.push(classInfo._id);
                await userData.save();

                break;
            default: 
                return res.status(500).json({ error: 'Invitation type not supported' });
        }

        invitation.used += 1;
        await invitation.save();

        res.json({ success: true });
    } catch (error) {
        console.error('Use invitation error:', error);
        res.status(500).json({ error: 'Failed to use invitation', dbError: error });
    }
});

module.exports = router;