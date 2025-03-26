const mongoose = require('mongoose');

const pdfSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  contactNumber: { type: String, required: true },
  emailAddress: { type: String, required: true },
  gstNumber: { type: String, required: true },
  logo: { type: String } // Store the image path
});

const  pdf = mongoose.model('pdfs', pdfSchema);
module.exports = pdf
