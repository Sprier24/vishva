const express = require('express');
const router = express.Router();
const pdfController = require('../../../controller/pdf.controller');

router.post('/addPdf', pdfController.upload.single('logo'), pdfController.createPdf);
router.get('/getAllPdfs', pdfController.getAllPdfs);
router.get('/getPdfById/:id', pdfController.getPdfById);
router.put('/updatePdf/:id', pdfController.updatePdf);
router.delete('/deletePdf/:id', pdfController.deletePdf);
router.get('/searchPdfsByCompanyName', pdfController.searchPdfsByCompanyName);

module.exports = router;