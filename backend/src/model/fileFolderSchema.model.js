const mongoose = require('mongoose');

const fileFolderSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  fileUrl: { type: String },
  fileType: { type: String },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'FileFolder', default: null },
});

const FileFolder = mongoose.model('FileFolder', fileFolderSchema);
module.exports = FileFolder;
