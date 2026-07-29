const express = require('express');
const multer = require('multer');
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');

const { UserInfo } = require('../../models/User');
const { Class } = require('../../models/Class');
const { File } = require('../../models/File');
const paths = require('../paths.js');

const router = express.Router();
const FILES_DIRECTORY = path.join(__dirname, '..', '..', 'files');
const MAX_FILE_SIZE = Math.min(Math.max(Number(process.env.UPLOAD_LIMIT) || 25, 1), 50) * 1024 * 1024;
const ALLOWED_TYPES = new Set(['application/pdf', 'image/png', 'image/jpeg', 'video/mp4']);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  fileFilter: (req, file, callback) => {
    callback(null, ALLOWED_TYPES.has(file.mimetype));
  },
});

function uploadsEnabled() {
  return String(process.env.ALLOW_UPLOADS).toLowerCase() === 'true';
}

function safeDownloadName(name) {
  return String(name || 'download').replace(/[\r\n"\\/]/g, '_').slice(0, 120);
}

async function getClassMember(req, res, requireTeacher = false) {
  if (!req.user) {
    res.status(401).json({ error: req.t('errors.not_authenticated') });
    return null;
  }

  const userInfo = await UserInfo.findById(req.user.userinfo_id);
  if (!userInfo) {
    res.status(404).json({ error: req.t('errors.user_not_found') });
    return null;
  }

  const classid = req.body?.classid;
  if (typeof classid !== 'string' || !classid) {
    res.status(400).json({ error: req.t('errors.classid_required') });
    return null;
  }

  const classData = await Class.findById(classid);
  if (!classData) {
    res.status(404).json({ error: req.t('errors.class_not_found') });
    return null;
  }

  const isTeacher = classData.teachers.some(id => id.equals(userInfo._id));
  const isStudent = classData.students.some(id => id.equals(userInfo._id));
  if ((requireTeacher && !isTeacher) || (!requireTeacher && !isTeacher && !isStudent)) {
    res.status(403).json({ error: requireTeacher ? req.t('errors.file_upload_teacher_only') : req.t('errors.class_access_denied') });
    return null;
  }

  return { userInfo, classData };
}

router.post(paths.dbGet, async (req, res) => {
  try {
    const member = await getClassMember(req, res);
    if (!member) return;

    const fileid = req.body?.fileid;
    if (typeof fileid !== 'string' || !fileid) return res.status(400).json({ error: req.t('errors.fileid_required') });

    const fileData = await File.findById(fileid);
    if (!fileData) return res.status(404).json({ error: req.t('errors.file_not_found') });
    if (!member.classData.files.some(id => id.equals(fileData._id))) {
      return res.status(403).json({ error: req.t('errors.file_access_denied') });
    }

    const filePath = path.join(FILES_DIRECTORY, fileData._id.toString());
    await fsp.access(filePath, fs.constants.R_OK);
    res.setHeader('Content-Type', fileData.mimetype);
    res.setHeader('Content-Disposition', `attachment; filename="${safeDownloadName(fileData.name)}"`);
    fs.createReadStream(filePath).on('error', error => res.destroy(error)).pipe(res);
  } catch (error) {
    console.error('File download error:', error);
    res.status(500).json({ error: req.t('errors.request_responses.fail.get_file'), dbError: error });
  }
});

router.post(paths.dbCreate, upload.single('file'), async (req, res) => {
  try {
    if (!uploadsEnabled()) return res.status(403).json({ error: req.t('errors.file_uploads_disabled') });

    const member = await getClassMember(req, res, true);
    if (!member) return;
    const file = req.file;
    if (!file) return res.status(400).json({ error: req.t('errors.file_not_found') });
    if (!ALLOWED_TYPES.has(file.mimetype)) return res.status(400).json({ error: 'This file type is not allowed.' });

    const doc = await File.create({
      name: safeDownloadName(file.originalname),
      mimetype: file.mimetype,
      size: file.size,
      author: member.userInfo._id,
      addedAt: new Date().toISOString(),
      editedAt: Date.now(),
    });

    try {
      await fsp.mkdir(FILES_DIRECTORY, { recursive: true });
      await fsp.writeFile(path.join(FILES_DIRECTORY, doc._id.toString()), file.buffer, { flag: 'wx' });
      await Class.updateOne({ _id: member.classData._id }, { $addToSet: { files: doc._id } });
    } catch (error) {
      await fsp.unlink(path.join(FILES_DIRECTORY, doc._id.toString())).catch(() => {});
      await File.deleteOne({ _id: doc._id });
      throw error;
    }

    return res.json({ success: true, data: doc._id });
  } catch (error) {
    console.error('File upload error:', error);
    return res.status(500).json({ error: req.t('errors.request_responses.fail.create_file'), dbError: error });
  }
});

router.post(paths.dbDelete, async (req, res) => {
  try {
    const member = await getClassMember(req, res, true);
    if (!member) return;

    const fileid = req.body?.fileid;
    if (typeof fileid !== 'string' || !fileid) return res.status(400).json({ error: req.t('errors.fileid_required') });

    const fileData = await File.findById(fileid);
    if (!fileData) return res.status(404).json({ error: req.t('errors.file_not_found') });
    if (!member.classData.files.some(id => id.equals(fileData._id))) {
      return res.status(403).json({ error: req.t('errors.file_access_denied') });
    }

    const filePath = path.join(FILES_DIRECTORY, fileData._id.toString());
    await fsp.unlink(filePath).catch(error => {
      if (error.code !== 'ENOENT') throw error;
    });
    await Promise.all([
      File.deleteOne({ _id: fileData._id }),
      Class.updateOne({ _id: member.classData._id }, { $pull: { files: fileData._id } }),
    ]);

    return res.json({ success: true });
  } catch (error) {
    console.error('Delete file error:', error);
    return res.status(500).json({ error: req.t('errors.request_responses.fail.delete_file'), dbError: error });
  }
});

router.post(paths.dbUpdate, (req, res) => {
  res.status(500).json({ error: req.t('errors.not_implemented') });
});

module.exports = router;
