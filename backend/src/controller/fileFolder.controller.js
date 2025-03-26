const mongoose = require('mongoose');
const FileFolder = require('../model/fileFolderSchema.model');
const fs = require('fs');
const path = require('path');

const createFile = async (req, res) => {
  try {
    const { name } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    // Use backticks for string interpolation
    const fileUrl = `uploads/${req.file.filename}`; 
    const fileType = req.file.mimetype.split("/")[0]; 

    const newFile = new FileFolder({
      name,
      type: "file",
      fileUrl,
      fileType
    });

    await newFile.save();
    res.status(201).json({ success: true, data: newFile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getFiles = async (req, res) => {
  try {
    const files = await FileFolder.find({ type: 'file' }).exec();
    
    res.json({ success: true, data: files.map(file => ({ ...file.toObject(), id: file._id })) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteFile = async (req, res) => {
  try {
    const { id } = req.params;

    const file = await FileFolder.findById(id);
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    // If the file is part of a folder, make sure the parent folder doesn't reference it anymore.
    if (file.parentId) {
      const parentFolder = await FileFolder.findById(file.parentId);
      if (parentFolder) {
        parentFolder.files = parentFolder.files.filter(file => file._id.toString() !== id);
        await parentFolder.save(); // Save changes to the parent folder (if needed)
      }
    }

    // Delete the file from the database
    await file.deleteOne();

    // Delete the file from the filesystem
    const filePath = path.join(__dirname, `../../../uploads/${file.fileUrl}`);
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error('Error deleting file from the filesystem:', err);
      } else {
        console.log('File deleted from the filesystem');
      }
    });

    res.status(200).json({ success: true, message: 'File deleted permanently' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


module.exports = { createFile, getFiles, deleteFile };
