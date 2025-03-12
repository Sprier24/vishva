const multer = require('multer');
const path = require('path');
const FileFolder = require('../model/fileFolderSchema.model');

// Set up Multer storage to specify the upload directory
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // This is where your files will be stored on the server
  },
  filename: (req, file, cb) => {
    const fileName = Date.now() + path.extname(file.originalname); // Generate unique file name
    cb(null, fileName);
  },
});

const upload = multer({ storage });

// API to handle file upload
const createFile = async (req, res) => {
  try {
    const { name, parentId } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const fileUrl = `/uploads/${req.file.filename}`; // Ensure this matches the location of the uploaded files
    const fileType = req.file.mimetype.split('/')[0]; 

    const newFile = new FileFolder({
      name,
      type: 'file',
      fileUrl,
      fileType,
      parentId: parentId ? parentId : null,
    });

    await newFile.save();
    res.status(201).json({ success: true, data: newFile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// API to fetch files from MongoDB
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
