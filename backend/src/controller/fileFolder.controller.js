const FileFolder = require('../model/fileFolderSchema.model');
const multer = require('multer');
const path = require('path');

const createFile = async (req, res) => {
  try {
    const { name } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    
    const fileUrl = `/uploads/${req.file.filename}`;
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
    
    res.json({ success: true, data: files });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createFile,
  getFiles
};