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
        const { subjectid } = req.body;

        if (!user) return res.status(401).json({ error: req.t("errors.not_authenticated") });
        if (!subjectid) return res.status(400).json({ error: req.t("errors.subjectid_required") });

        const userInfo = await UserInfo.findOne({ _id: user.userinfo_id });;
        if (!userInfo) return res.status(404).json({ error: req.t("errors.user_not_found") });

        const subject = await Subject.findOne({ _id: subjectid }).lean();
        if (!subject) return res.status(404).json({ error: req.t("errors.subject_not_found") });

        const classInfo = await Class.findOne({ subjects: subjectid });
        if (!classInfo) return res.status(404).json({ error: req.t("errors.class_not_found") });

        if (
            !classInfo.students.some(t => t.equals(userInfo._id))
            && !classInfo.teachers.some(t => t.equals(userInfo._id))
        ) return res.status(403).json({ error: req.t("errors.class_access_denied") });

        res.json({ success: true, data: subject });
    } catch (error) {
        console.error('Get subject error:', error);
        res.status(500).json({ error: req.t("errors.request_responses.fail.get_subject"), dbError: error });
    }
});

router.post(paths.dbCreate, async (req, res) => {
    try {
        const user = req.user; // Assuming user is set by authentication middleware
        const { classid } = req.body;

        if (!user) return res.status(401).json({ error: req.t("errors.not_authenticated") });
        if (!classid) return res.status(400).json({ error: req.t("errors.classid_required") });

        const userInfo = await UserInfo.findOne({ _id: user.userinfo_id });;
        if (!userInfo) return res.status(404).json({ error: req.t("errors.user_not_found") });

        const classInfo = await Class.findOne({ _id: classid });
        if (!classInfo) return res.status(404).json({ error: req.t("errors.class_not_found") });
        if (!classInfo.teachers.some(t => t.equals(userInfo._id))) return res.status(403).json({ error: req.t("errors.subject_create_teacher_only") });

        const { name, maxgrade, gradeType, allowOwnGrades } = req.body;
        if (!name) return res.status(400).json({ error: req.t("errors.subject_name_required") });
        if (!maxgrade) return res.status(400).json({ error: req.t("errors.subject_max_grade_required") });
        if (!gradeType) return res.status(400).json({ error: req.t("errors.subject_grade_type_required") });

        const newSubject = new Subject({
            // subjectid: `subject_${idGenerate()}`,
            // classid,
            name,
            teacher: [userInfo._id],
            maxgrade,
            gradeType,
            allowOwnGrades,
            addedAt: new Date().toISOString(),
            editedAt: Date.now(),
        });
        await newSubject.save();

        classInfo.subjects.push(newSubject._id);
        await classInfo.save();

        res.json({ success: true, data: newSubject._id });
    } catch (error) {
        console.error('Create subject error:', error);
        res.status(500).json({ error: req.t("errors.request_responses.fail.create_subject"), dbError: error });
    }
});

router.post(paths.dbDelete, async (req, res) => {
    try {
        const user = req.user; // Assuming user is set by authentication middleware
        const { subjectid } = req.body;

        if (!user) return res.status(401).json({ error: req.t("errors.not_authenticated") });
        if (!subjectid) return res.status(400).json({ error: req.t("errors.subjectid_required") });

        const userInfo = await UserInfo.findOne({ _id: user.userinfo_id });;
        if (!userInfo) return res.status(404).json({ error: req.t("errors.user_not_found") });

        const classInfo = await Class.findOne({ subjects: subjectid });
        if (!classInfo) return res.status(404).json({ error: req.t("errors.class_not_found") });
        if (!classInfo.teachers.some(t => t.equals(userInfo._id))) return res.status(403).json({ error: req.t("errors.subject_delete_teacher_only") });

        const subjectInfo = await Subject.findOne({ _id: subjectid });
        if (!subjectInfo) return res.status(404).json({ error: req.t("errors.subject_not_found") });

        //remove subject from class
        classInfo.subjects = classInfo.subjects.filter(s => s.toString() !== subjectInfo._id.toString());
        await classInfo.save();

        await Subject.deleteOne({ _id: subjectid });

        res.json({ success: true });
    } catch (error) {
        console.error('Delete subject error:', error);
        res.status(500).json({ error: req.t("errors.request_responses.fail.delete_subject"), dbError: error });
    }
});

router.post(paths.dbUpdate, async (req, res) => {
    try {
        const user = req.user; // Assuming user is set by authentication middleware
        const { subjectid } = req.body;

        if (!user) return res.status(401).json({ error: req.t("errors.not_authenticated") });
        if (!subjectid) return res.status(400).json({ error: req.t("errors.subjectid_required") });

        const userInfo = await UserInfo.findOne({ _id: user.userinfo_id });;
        if (!userInfo) return res.status(404).json({ error: req.t("errors.user_not_found") });

        const classInfo = await Class.findOne({ subjects: subjectid });
        if (!classInfo) return res.status(404).json({ error: req.t("errors.class_not_found") });
        if (!classInfo.teachers.some(t => t.equals(userInfo._id))) return res.status(403).json({ error: req.t("errors.subject_update_teacher_only") });

        const subject = await Subject.findOne({ _id: subjectid });
        if (!subject) return res.status(404).json({ error: req.t("errors.subject_not_found") });

        const { name, maxgrade, teacher, allowOwnGrades } = req.body;
        if (name !== undefined) subject.name = name;
        if (maxgrade !== undefined) subject.maxgrade = maxgrade;
        if (teacher !== undefined) subject.teacher = teacher;
        if (allowOwnGrades !== undefined) subject.allowOwnGrades = allowOwnGrades;
        subject.editedAt = Date.now();

        await subject.save();

        res.json({ success: true, data: subject });
    } catch (error) {
        console.error('Update subject error:', error);
        res.status(500).json({ error: req.t("errors.request_responses.fail.update_subject"), dbError: error });
    }
});

module.exports = router;