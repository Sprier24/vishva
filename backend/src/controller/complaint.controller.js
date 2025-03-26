const Complaint = require('../model/complaintSchema.model');const { storeNotification } = require('./notification.controller');
const cron = require('node-cron');
const nodemailer = require("nodemailer");
const multer = require('multer');

const createComplaint = async (req, res) => {
  try {
    const { companyName, complainerName, contactNumber, emailAddress, subject, date, caseStatus, priority, caseOrigin,} = req.body;

    const newComplaint = new Complaint({
      companyName,
      complainerName,
      contactNumber,
      emailAddress,
      subject,
      date,
      caseStatus: caseStatus || 'Pending',
      priority: priority || 'Medium',
      caseOrigin,
    });

    const savedComplaint = await newComplaint.save();

    return res.status(201).json({
      success: true,
      message: 'Complaint created successfully',
      complaint: savedComplaint, 
    });
  } catch (error) {
    console.error('Error creating complaint:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error: ' + error.message,
    });
  }
};

const getAllComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find(); 
    res.status(200).json({
      success: true,
      complaints,
    });
  } catch (error) {
    console.error('Error fetching complaints:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error: ' + error.message,
    });
  }
};

const updateComplaint = async (req, res) => {
  const { id } = req.params; 
  const updatedData = req.body; 

  try {
    const complaint = await Complaint.findById(id);

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    Object.keys(updatedData).forEach((key) => {
      complaint[key] = updatedData[key];
    });

    await complaint.save();

    res.status(200).json({ success: true, message: 'Complaint updated successfully!', data: complaint });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update complaint' });
  }
};

const deleteComplaint = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedComplaint = await Complaint.findByIdAndDelete(id);
    if (!deletedComplaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Complaint deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting complaint:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error: ' + error.message,
    });
  }
};

const transporter = nodemailer.createTransport({
    service: "gmail",  
    auth: {
        user: process.env.EMAIL_USER,  
        pass: process.env.EMAIL_PASS,  
    },
});

const sendEmailComplaint = async (req, res) => {
  const { to, subject = "(No Subject)", message = "(No Message)" } = req.body; 
  const attachments = req.files; 

  if (!to) {
      return res.status(400).json({
          success: false,
          message: "The recipient's email (to) is required.",
      });
  }

  try {
      const mailOptions = {
          from: "purvagalani@gmail.com",
          to: to,
          subject: subject || "(No Subject)", 
          html: message || "(No Message)", 
          attachments: attachments
              ? attachments.map(file => ({
                    filename: file.originalname,
                    path: file.path,
                }))
              : [], 
      };

      transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
              console.error("Error sending email:", error.message);
              return res.status(500).json({
                  success: false,
                  message: "Error sending email: " + error.message,
              });
          }

          console.log("Email sent successfully: " + info.response);
          res.status(200).json({
              success: true,
              message: `Email sent successfully to ${to}`,
              data: info.response,
          });
      });
  } catch (error) {
      console.error("Error sending email:", error.message);
      res.status(500).json({
          success: false,
          message: "Internal server error: " + error.message,
      });
  }
};

module.exports = {
  createComplaint,
  getAllComplaints,
  updateComplaint,
  deleteComplaint,
  sendEmailComplaint
};
