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
    //TODO
    return res.status(400).json({ error: req.t("errors.not_implemented") });
  } catch (error) {
    console.error('Get materials error:', error);
    res.status(500).json({ error: req.t("errors.request_responses.fail.get_materials"), dbError: error });
  }
});

router.post(paths.dbCreate, async (req, res) => {
  try {
    const user = req.user; // Assuming user is set by authentication middleware
    const { classid, subjectid } = req.body;

    if (!user) return res.status(401).json({ error: req.t("errors.not_authenticated") });
    if (!classid) return res.status(400).json({ error: req.t("errors.classid_required") });

    const userInfo = await UserInfo.findOne({ _id: user.userinfo_id });;
    if (!userInfo) return res.status(404).json({ error: req.t("errors.user_not_found") });

    const classInfo = await Class.findOne({ _id: classid });
    if (!classInfo) return res.status(404).json({ error: req.t("errors.class_not_found") });
    if (!classInfo.teachers.some(t => t.equals(userInfo._id))) return res.status(403).json({ error: req.t("errors.material_create_teacher_only") });

    let subjectInfo = null;
    if (subjectid) {
      subjectInfo = await Subject.findOne({ _id: subjectid });
      if (!subjectInfo) return res.status(404).json({ error: req.t("errors.subject_not_found") });
    }

    const { title, description, type, url } = req.body;
    if (!title) return res.status(400).json({ error: req.t("errors.material_title_required") });
    if (!description) return res.status(400).json({ error: req.t("errors.material_description_required") });
    if (!url) return res.status(400).json({ error: req.t("errors.material_url_required") });

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
      subjectInfo.material.push(newMaterial._id);
      await subjectInfo.save();
    }

    classInfo.material.push(newMaterial._id);
    await classInfo.save();

    res.json({ success: true, data: newMaterial._id });
  } catch (error) {
    console.error('Create material error:', error);
    res.status(500).json({ error: req.t("errors.request_responses.fail.create_material"), dbError: error });
  }
});

router.post(paths.dbDelete, async (req, res) => {
  try {
    const user = req.user; // Assuming user is set by authentication middleware
    const { materialid } = req.body;

    if (!user) return res.status(401).json({ error: req.t("errors.not_authenticated") });
    if (!materialid) return res.status(400).json({ error: req.t("errors.materialid_required") });

    const userInfo = await UserInfo.findOne({ _id: user.userinfo_id });;
    if (!userInfo) return res.status(404).json({ error: req.t("errors.user_not_found") });

    const classInfo = await Class.findOne({ material: materialid });
    if (!classInfo) return res.status(404).json({ error: req.t("errors.class_not_found") });
    if (!classInfo.teachers.some(t => t.equals(userInfo._id))) return res.status(403).json({ error: req.t("errors.material_delete_teacher_only") });

    const subjectInfo = await Subject.findOne({ material: materialid });

    //remove material from class
    classInfo.material = classInfo.material.filter(m => m.toString() !== materialid);
    await classInfo.save();
    
    //remove material from subject if exists
    if (subjectInfo) {
      subjectInfo.material = subjectInfo.material.filter(m => m.toString() !== materialid);
      await subjectInfo.save();
    }

    await Material.deleteOne({ _id: materialid });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete material error:', error);
    res.status(500).json({ error: req.t("errors.request_responses.fail.delete_material"), dbError: error });
  }
});

router.post(paths.dbUpdate, async (req, res) => {
  try {
    const user = req.user; // Assuming user is set by authentication middleware
    const { materialid, title, description, type, url } = req.body;

    if (!user) return res.status(401).json({ error: req.t("errors.not_authenticated") });
    if (!materialid) return res.status(400).json({ error: req.t("errors.materialid_required") });

    const userInfo = await UserInfo.findOne({ _id: user.userinfo_id });;
    if (!userInfo) return res.status(404).json({ error: req.t("errors.user_not_found") });

    const classInfo = await Class.findOne({ material: materialid });
    if (!classInfo) return res.status(404).json({ error: req.t("errors.class_not_found") });
    if (!classInfo.teachers.some(t => t.equals(userInfo._id))) return res.status(403).json({ error: req.t("errors.material_update_teacher_only") });

    const material = await Material.findOne({ _id: materialid });
    if (!material) return res.status(404).json({ error: req.t("errors.material_not_found") });

    if (title !== undefined) material.title = title;
    if (description !== undefined) material.description = description;
    if (type !== undefined) material.type = type;
    if (url !== undefined) material.url = url;
    material.editedAt = Date.now();

    if (title === undefined && description === undefined && type === undefined && url === undefined) {
      return res.status(400).json({ error: req.t("errors.no_fields_to_update") });
    }

    await material.save();

    res.json({ success: true, data: material });
  } catch (error) {
    console.error('Update material error:', error);
    res.status(500).json({ error: req.t("errors.request_responses.fail.update_material"), dbError: error });
  }
});

module.exports = router;