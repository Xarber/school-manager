const express = require('express');
const mongoose = require("mongoose");
const { UserInfo, UserData } = require('../../models/User');
const paths = require('./paths.js');

const router = express.Router();

const multer = require('multer');
const { Class } = require('../../models/Class.js');
const { File } = require('../../models/File.js');
const fs = require("fs/promises");
const path = require("path");

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: (process.env.UPLOAD_LIMIT ?? 50) * 1024 * 1024 } // 50 MB default
});

router.post(paths.dbGet, async (req, res) => {
  try {
    const user = req.user; // Assuming user is set by authentication middleware
    if (!user) return res.status(401).json({ error: 'User authentication required' });

    const userInfo = await UserData.findOne({ _id: user.userinfo_id });
    if (!userInfo) return res.status(404).json({ error: 'User info not found' });

    const { classid } = req.body;
    if (!classid) return res.status(400).json({ error: 'Class ID required' });

    const classData = await Class.findOne({ _id: classid });
    if (!classData) return res.status(404).json({ error: 'Class not found' });
    if (
        !classInfo.students.some(t => t.equals(userInfo._id))
        && !classInfo.teachers.some(t => t.equals(userInfo._id))
    ) return res.status(403).json({ error: 'Access denied to this class' });

    const { fileid } = req.body;
    if (!fileid) return res.status(400).json({ error: 'File ID required' });

    const fileData = await File.findOne({ _id: fileid });
    if (!fileData) return res.status(404).json({ error: 'File not found' });
    if (!classData.files.some(t => t.equals(fileData._id))) return res.status(403).json({ error: 'Access denied to this file' });

    const filename = fileData._id.toString();
    const filePath = path.join(__dirname, '..', '..', 'files', filename);

    await fs.access(filePath, fs.constants.R_OK);

    const inlineTypes = ["application/pdf", "image/png", "image/jpeg", "video/mp4"];

    if (inlineTypes.includes(fileData.mimetype)) {
        res.setHeader("Content-Disposition", `inline; filename="${fileData.name}"`);
        fs.createReadStream(filePath).pipe(res);
    } else {
        res.download(
            filePath,
            fileData.name,
            { headers: { "Content-Type": fileData.mimetype } }
        );
    }
  } catch (error) {
    console.error('File download error:', error);
    res.status(500).json({ error: 'Failed to download file', dbError: error });
  }
});

router.post(paths.dbCreate, upload.single('file'), async (req, res) => {
  try {
    const uploadsEnabled = Boolean(process.env.ALLOW_UPLOADS) ?? false;

    if (!uploadsEnabled) return res.status(403).json({ error: 'File uploads are disabled' });

    const user = req.user; // Assuming user is set by authentication middleware
    if (!user) return res.status(401).json({ error: 'User authentication required' });

    const userInfo = await UserData.findOne({ _id: user.userinfo_id });
    if (!userInfo) return res.status(404).json({ error: 'User info not found' });

    const { classid } = req.body;
    if (!classid) return res.status(400).json({ error: 'Class ID required' });
    const classData = await Class.findOne({ _id: classid });
    if (!classData) return res.status(404).json({ error: 'Class not found' });
    if (!classData.teachers.some(t => t.equals(userInfo._id))) return res.status(403).json({ error: 'Only teachers can upload files' });

    const file = req.file;
    if (!file) return res.status(400).json({ error: 'File not found' });

    const doc = await File.create({
        name: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        author: userInfo._id,
        addedAt: Date.now(),
        editedAt: Date.now()
    });
    const filename = doc._id;
    const uploadPath = path.join(__dirname, '..', '..', 'files', filename);
    await fs.writeFile(uploadPath, file.buffer);
    await doc.save();

    classData.files.push(doc._id);
    await classData.save();

    res.json({ success: true, data: doc._id });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'Failed to upload file', dbError: error });
  }
});

router.post(paths.dbDelete, async (req, res) => {
  try {
    const user = req.user; // Assuming user is set by authentication middleware
    if (!user) return res.status(401).json({ error: 'User authentication required' });

    const userInfo = await UserData.findOne({ _id: user.userinfo_id });
    if (!userInfo) return res.status(404).json({ error: 'User info not found' });

    const { classid } = req.body;
    if (!classid) return res.status(400).json({ error: 'Class ID required' });
    const classData = await Class.findOne({ _id: classid });
    if (!classData) return res.status(404).json({ error: 'Class not found' });
    if (!classData.teachers.some(t => t.equals(userInfo._id))) return res.status(403).json({ error: 'Only teachers can delete files' });

    const { fileid } = req.body;
    if (!fileid) return res.status(400).json({ error: 'File ID required' });

    const fileData = await File.findOne({ _id: fileid });
    if (!fileData) return res.status(404).json({ error: 'File not found' });
    if (!classData.files.some(t => t.equals(fileData._id))) return res.status(403).json({ error: 'Access denied to this file' });

    const filename = fileData._id.toString();
    const filePath = path.join(__dirname, '..', '..', 'files', filename);

    await fs.access(filePath, fs.constants.R_OK);
    await fs.unlink(filePath);
    await File.deleteOne({ _id: fileid });
    await classData.files.pull(fileid);
    await classData.save();

    res.json({ success: true });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ error: 'Failed to delete file', dbError: error });
  }
});

router.post(paths.dbUpdate, async (req, res) => {
    res.status(500).json({ error: 'Not implemented' });
});

module.exports = router;