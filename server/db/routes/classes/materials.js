const express = require('express');
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const { Material } = require("../../models/Material");
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
    });
    await newMaterial.save();

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