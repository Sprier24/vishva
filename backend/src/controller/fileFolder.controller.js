const mongoose = require('mongoose');
const FileFolder = require('../model/fileFolderSchema.model');
const fs = require('fs');
const path = require('path');
const { resolve } = require('url');
 const mime = require("mime-types");

 
const createFile = async (req, res) => {
  try {
    const { name } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

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

    if (file.parentId) {
      const parentFolder = await FileFolder.findById(file.parentId);
      if (parentFolder) {
        parentFolder.files = parentFolder.files.filter(file => file._id.toString() !== id);
        await parentFolder.save();
      }
    }

    await file.deleteOne();

    const filePath = path.join(__dirname, `../../../${file.fileUrl}`);
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

const downloadFile = async (req, res) => {
  try {
    const { id } = req.params;

    const file = await FileFolder.findById(id);
    if (!file) {
      return res.status(404).json({ success: false, message: "File not found" });
    }

    const filePath = path.resolve(__dirname, `../${file.fileUrl}`);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: "File not found on server" });
    }

    let contentType = mime.lookup(filePath) || "application/octet-stream";

    res.setHeader("Content-Disposition", `attachment; filename="${file.name}"`);
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Transfer-Encoding", "binary");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.download(filePath, file.name, (err) => {
      if (err) {
        res.status(500).json({ success: false, message: "Error downloading file" });
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


module.exports = { createFile, getFiles, deleteFile, downloadFile };
