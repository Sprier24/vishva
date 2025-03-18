const Contact = require('../model/contactSchema.model');
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",  
    auth: {
        user: process.env.EMAIL_USER,  
        pass: process.env.EMAIL_PASS,  
    },
});

const createContact = async (req, res) => {
  const { companyName, customerName, emailAddress, contactNumber, address, gstNumber, description } = req.body;

  try {
    const newContact = new Contact({ companyName, customerName, emailAddress, contactNumber, address, gstNumber, description });
    const contact = await newContact.save();

    res.status(201).json({
      success: true,
      message: 'Contact created successfully',
      data: contact,
    });
  } catch (error) {
    console.error('Error creating contact:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error: ' + error.message,
    });
  }
};

const getAllContacts = async (req, res) => {
  try {
    const contacts = await Contact.find();
    res.status(200).json({ success: true, data: contacts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error fetching contacts' });
  }
};

const updateContact = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const updatedContact = await Contact.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!updatedContact) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Contact updated successfully',
      data: updatedContact,
    });
  } catch (error) {
    console.error('Error updating contact:', error);
    res.status(500).json({ success: false, message: 'Internal server error: ' + error.message });
  }
};

const deleteContact = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedContact = await Contact.findByIdAndDelete(id);

    if (!deletedContact) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }

    res.status(200).json({ success: true, message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).json({ success: false, message: 'Internal server error: ' + error.message });
  }
};

const sendEmailContact = async (req, res) => {
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
  createContact,
  updateContact,
  deleteContact,
  getAllContacts,
  sendEmailContact
};


