const express = require('express');
const mongoose = require("mongoose");
const { Material } = require("../../models/Material");
const { Subject } = require("../../models/Subject");
const { Class } = require("../../models/Class");
const { UserInfo, UserData } = require('../../models/User');
const paths = require('../paths.js');
const { idGenerate } = require('../../idgenerator');

const router = express.Router();

router.post(paths.dbGet, async (req, res) => {
  try {
    const user = req.user; // Assuming user is set by authentication middleware
    const { classid, subjectid, materialid } = req.body;

    if (!user) return res.status(401).json({ error: 'User authentication required' });
    if (!classid) return res.status(400).json({ error: 'Class ID required' });
    if (!materialid) return res.status(400).json({ error: 'Material ID required' });

    const userInfo = await UserInfo.findOne({ userid: user.userid });
    if (!userInfo) return res.status(404).json({ error: 'User info not found' });

    let searchData = { classid, materialid };
    if (subjectid) searchData.subjectid = subjectid;
    const materials = await Material.find(searchData).lean();
    res.json({ success: true, data: materials });
  } catch (error) {
    console.error('Get materials error:', error);
    res.status(500).json({ error: 'Failed to get materials' });
  }
});

router.post(paths.dbCreate, async (req, res) => {
  try {
    const user = req.user; // Assuming user is set by authentication middleware
    const { classid, subjectid } = req.body;

    if (!user) return res.status(401).json({ error: 'User authentication required' });
    if (!classid) return res.status(400).json({ error: 'Class ID required' });

    const userInfo = await UserInfo.findOne({ userid: user.userid });
    if (!userInfo) return res.status(404).json({ error: 'User info not found' });
    if (userInfo.role !== 'teacher') return res.status(403).json({ error: 'Only teachers can create materials' });

    const classInfo = await Class.findOne({ classid });
    if (!classInfo) return res.status(404).json({ error: 'Class not found' });
    if (!classInfo.teachers.includes(userInfo._id)) return res.status(403).json({ error: 'Only teachers can create materials' });

    let subjectInfo = null;
    if (subjectid) {
      subjectInfo = await Subject.findOne({ subjectid, classid });
      if (!subjectInfo) return res.status(404).json({ error: 'Subject not found' });
      if (!subjectInfo.teacher.includes(userInfo._id)) return res.status(403).json({ error: 'Only teachers of this subject can create materials' });
    }

    const { title, description, type, url } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });
    if (!description) return res.status(400).json({ error: 'Description is required' });
    if (!url) return res.status(400).json({ error: 'URL is required' });

    const newMaterial = new Material({
        materialid: `material_${idGenerate()}`,
        classid,
        subjectid,
        title,
        description,
        type: type || 'file',
        url,
        addedAt: new Date().toISOString(),
        editedAt: Date.now(),
    });
    await newMaterial.save();

    if (subjectInfo) {
      subjectInfo.materials.push(newMaterial._id);
      await subjectInfo.save();
    }

    classInfo.materials.push(newMaterial._id);
    await classInfo.save();

    res.json({ success: true, data: newMaterial.materialid });
  } catch (error) {
    console.error('Create material error:', error);
    res.status(500).json({ error: 'Failed to create material' });
  }
});

router.post(paths.dbDelete, async (req, res) => {
  try {
    const user = req.user; // Assuming user is set by authentication middleware
    const { materialid } = req.body;

    if (!user) return res.status(401).json({ error: 'User authentication required' });
    if (!materialid) return res.status(400).json({ error: 'Material ID required' });

    const userInfo = await UserInfo.findOne({ userid: user.userid });
    if (!userInfo) return res.status(404).json({ error: 'User info not found' });
    if (userInfo.role !== 'teacher') return res.status(403).json({ error: 'Only teachers can delete materials' });

    const classInfo = await Class.findOne({ materials: materialid });
    if (!classInfo) return res.status(404).json({ error: 'Class not found' });
    if (!classInfo.teachers.includes(userInfo._id)) return res.status(403).json({ error: 'Only teachers can delete materials' });

    const subjectInfo = await Subject.findOne({ materials: materialid });
    if (subjectInfo && !subjectInfo.teacher.includes(userInfo._id)) {
      return res.status(403).json({ error: 'Only teachers of this subject can delete materials' });
    }

    //remove material from class
    classInfo.materials = classInfo.materials.filter(m => m.toString() !== materialid);
    await classInfo.save();
    
    //remove material from subject if exists
    if (subjectInfo) {
      subjectInfo.materials = subjectInfo.materials.filter(m => m.toString() !== materialid);
      await subjectInfo.save();
    }

    await Material.deleteOne({ materialid });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete material error:', error);
    res.status(500).json({ error: 'Failed to delete material' });
  }
});

router.post(paths.dbUpdate, async (req, res) => {
  try {
    const user = req.user; // Assuming user is set by authentication middleware
    const { materialid, title, description, type, url } = req.body;

    if (!user) return res.status(401).json({ error: 'User authentication required' });
    if (!materialid) return res.status(400).json({ error: 'Material ID required' });

    const userInfo = await UserInfo.findOne({ userid: user.userid });
    if (!userInfo) return res.status(404).json({ error: 'User info not found' });
    if (userInfo.role !== 'teacher') return res.status(403).json({ error: 'Only teachers can update materials' });

    const material = await Material.findOne({ materialid });
    if (!material) return res.status(404).json({ error: 'Material not found' });

    if (title !== undefined) material.title = title;
    if (description !== undefined) material.description = description;
    if (type !== undefined) material.type = type;
    if (url !== undefined) material.url = url;
    material.editedAt = Date.now();

    if (title === undefined && description === undefined && type === undefined && url === undefined) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    await material.save();

    res.json({ success: true, data: material });
  } catch (error) {
    console.error('Update material error:', error);
    res.status(500).json({ error: 'Failed to update material' });
  }
});

module.exports = router;