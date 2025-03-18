const express = require('express');
const multer = require('multer');
const path = require('path');
const fileController = require('../../../controller/fileFolder.controller');
const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../../uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + file.originalname);
  }
});
const upload = multer({ storage: storage });

router.post('/upload', upload.single('file'), fileController.createFile);
router.get('/files', fileController.getFiles);

module.exports = router;
