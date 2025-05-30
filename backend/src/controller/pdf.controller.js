const mongoose = require('mongoose');
const Owner = require('../model/pdfSchema.model');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads')); 
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); 
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, 
});

const createPdf = async (req, res) => {
  try {
    const { companyName, contactNumber, emailAddress, gstNumber } = req.body;
    const logo = req.file ? `/uploads/${req.file.filename}` : ''; 

    const newPdf = new Owner({
      companyName,
      contactNumber,
      emailAddress,
      gstNumber,
      logo,
    });

    await newPdf.save();
    res.status(201).json({
      success: true,
      message: 'PDF profile created successfully',
      data: newPdf,
    });
  } catch (error) {
    console.error('Error creating PDF profile:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error: ' + error.message,
    });
  }
};

const getAllPdfs = async (req, res) => {
  try {
    const pdfs = await Owner.find({});
    if (pdfs.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No PDF profiles found',
      });
    }
    res.status(200).json({
      success: true,
      data: pdfs,
    });
  } catch (error) {
    console.error('Error fetching PDFs:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error: ' + error.message,
    });
  }
};

const getPdfById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: "ID is required" });
    }

    const pdfProfile = await PdfModel.findById(id); 
    if (!pdfProfile) {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }

    res.status(200).json(pdfProfile);
  } catch (error) {
    console.error("Error fetching PDF:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


const updatePdf = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid PDF ID',
      });
    }

    const updatedPdf = await Owner.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!updatedPdf) {
      return res.status(404).json({
        success: false,
        message: 'PDF profile not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'PDF profile updated successfully',
      data: updatedPdf,
    });
  } catch (error) {
    console.error('Error updating PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error: ' + error.message,
    });
  }
};

const deletePdf = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedPdf = await Owner.findByIdAndDelete(id);
    if (!deletedPdf) {
      return res.status(404).json({
        success: false,
        message: 'PDF profile not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'PDF profile deleted successfully',
      data: deletedPdf,
    });
  } catch (error) {
    console.error('Error deleting PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error: ' + error.message,
    });
  }
};

const searchPdfsByCompanyName = async (req, res) => {
  const { companyName } = req.query;
  try {
    const pdfs = await Owner.find({ companyName: new RegExp(companyName, 'i') });
    if (pdfs.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No PDFs found for this company name',
      });
    }
    res.status(200).json({
      success: true,
      data: pdfs,
    });
  } catch (error) {
    console.error('Error searching PDFs:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error: ' + error.message,
    });
  }
};

module.exports = {
  upload,
  createPdf,
  getAllPdfs,
  getPdfById,
  updatePdf,
  deletePdf,
  searchPdfsByCompanyName,
};