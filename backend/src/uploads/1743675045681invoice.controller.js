const Invoice = require("../model/invoiceSchema.model");
const nodemailer = require("nodemailer");
const { storeNotification } = require('./notification.controller');
const cron = require('node-cron');

const remindEvent = async () => {
    const io = require('../index'); 
        const now = new Date();
        const nowIST = new Date(now.getTime() + (5 * 60 + 30) * 60000);
        console.log('Cron job running at (IST): ', nowIST.toISOString());
    
        // console.log('Cron job running at: ', now.toISOString());
        // console.log('Current Time (UTC):', now.toISOString());
    
    try {
            // Log when the cron job runs
            const events = await Invoice.find({
            date: { $gt: now },
            status: "Unpaid", // Only fetch unpaid invoices
            });
    
            if (!events.length) {
                console.log('No unpaid events to remind');
                return;
            }
        
            for (const event of events) {
                const followUpDate = new Date(event.date);
                if (isNaN(followUpDate.getTime())) {
                    console.error(`Invalid follow-up date for event: ${event.customerName}`);
                    continue; // Skip invalid events
                }
                // const reminderMinutes = parseInt(event.reminder, 10);
                // if (isNaN(reminderMinutes) || reminderMinutes <= 0) {
                //     console.error(`Invalid reminder value for event: ${event.subject}`);
                //     continue; // Skip invalid events
                // }
    
                const oneDayBefore = new Date(followUpDate);
                oneDayBefore.setDate(oneDayBefore.getDate() - 1);
                
                // const reminderTime = new Date(followUpDate);
                // reminderTime.setMinutes(reminderTime.getMinutes() - reminderMinutes);
    
                // Debug critical date values
                console.log(`Checking unpaid event: ${event.customerName}`);
                console.log('Current Time (IST):', nowIST.toISOString());
                // console.log('Current Time (UTC):', now.toISOString());
                console.log('Follow-Up Date (UTC):', followUpDate.toISOString());
                // console.log('Reminder Time (UTC):', reminderTime.toISOString());
                console.log('One-Day-Before Reminder Time (UTC):', oneDayBefore.toISOString());
    
                //console.log('event reminder', event.reminder);
                //console.log('ReminderTime-getminutes', reminderTime.getMinutes());
                //console.log('reminderTime', reminderTime.setMinutes);
                //console.log(`Checking event: ${event.subject}, Reminder Time: ${reminderTime.toISOString()}`);
                // if (now < followUpDate) {
    
                if (nowIST >= oneDayBefore && now < followUpDate) {
                    console.log(`Reminder: ${event.customerName} has an unpaid invoice`);
                
                    // Emit reminder to the client (admins/internal users)
                    io.emit('reminder', {
                        id: event._id,
                        customerName: event.customerName,
                        amount: event.remainingAmount,
                        followUpDate: followUpDate.toISOString().split('T')[0], // Extract only the date
                    });
                
                    // Store notification in MongoDB with an internal-focused message
                    const notificationData = {
                        title: `Reminder: Unpaid Invoice for ${event.customerName}`,
                        message: `Customer ${event.customerName} has an unpaid invoice of ₹${event.remainingAmount} for the product "${event.productName}". The due date is ${followUpDate.toISOString().split('T')[0]}.`,
                    };
                
                    await storeNotification(notificationData);
                }
                 else{
                    console.log('No reminder needed');
                    
                }
            };    
        }catch(error){
            console.error('Error executing remindEvent API:', error);
        }
    }
    
    cron.schedule('* * * * *', remindEvent ); // Runs every minute
    
    const remindEventAPI = async (req, res) => {
        try {
            await remindEvent(); // Call the shared reminder logic
            res.status(200).json({
                success: true,
                message: "Reminders processed successfully.",
            });
        } catch (error) {
            console.error('Error in remindEvent API:', error.message);
            res.status(500).json({
                success: false,
                message: "Internal server error: " + error.message,
            });
        }
    };

const invoiceAdd = async (req, res) => {
    try {
        const { companyName, customerName, contactNumber, emailAddress, address, gstNumber, productName, amount, discount, gstRate, status, date, paidAmount } = req.body;

        if (!amount || !discount || !gstRate) {
            return res.status(400).json({ message: "Amount, discount, and GST rate are required" });
        }

        const discountedAmount = amount * (discount / 100);
        const gstAmount = discountedAmount * (gstRate / 100);
        const totalWithoutGst = discountedAmount;
        const totalWithGst = discountedAmount + gstAmount;
        const remainingAmount = totalWithGst - paidAmount;

        const newInvoice = new Invoice({
            companyName,
            customerName,
            contactNumber,
            emailAddress,
            address,
            gstNumber,
            productName,
            amount,
            discount,
            gstRate,
            status,
            date,
            totalWithoutGst,
            totalWithGst,
            paidAmount,
            remainingAmount
        });

        const savedInvoice = await newInvoice.save();
        res.status(201).json({ message: "Invoice added successfully", data: savedInvoice });

    } catch (error) {
        console.error("Error adding invoice:", error);
        res.status(500).json({ message: "Failed to add invoice", error: error.message });
    }
};

const updateInvoice = async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    try {
        console.log("Updating invoice with ID:", id, "and data:", updates);

        const updatedInvoice = await Invoice.findByIdAndUpdate(id, updates, {
            new: true,
            runValidators: true
        });

        if (!updatedInvoice) {
            return res.status(404).json({
                success: false,
                message: "Invoice not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Invoice updated successfully",
            data: updatedInvoice
        });
    } catch (error) {
        console.error("Error updating invoice:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error: " + error.message,
        });
    }
};

const deleteInvoice = async (req, res) => {
    const { id } = req.params;

    try {
        const deletedInvoice = await Invoice.findByIdAndDelete(id);

        if (!deletedInvoice) {
            return res.status(404).json({
                success: false,
                message: "Invoice not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Invoice deleted successfully",
            data: deletedInvoice
        });
    } catch (error) {
        console.error("Error deleting invoice:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error: " + error.message,
        });
    }
};

const getAllInvoices = async (req, res) => {
    try {
        const invoices = await Invoice.find({});
        res.status(200).json({
            success: true,
            data: invoices
        });
    } catch (error) {
        console.error("Error fetching invoices:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error: " + error.message,
        });
    }
};

const getInvoiceById = async (req, res) => {
    const { id } = req.params;

    try {
        const invoice = await Invoice.findById(id);

        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: "Invoice not found"
            });
        }

        res.status(200).json({
            success: true,
            data: invoice
        });
    } catch (error) {
        console.error("Error fetching invoice:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error: " + error.message,
        });
    }
};

const getUnpaidInvoices = async (req, res) => {

    try {
        const unpaidInvoices = await Invoice.find({ status: "Unpaid" });
        res.status(200).json({
            success: true,
            data: unpaidInvoices,
        });
    } catch (error) {
        console.error("Error fetching unpaid invoices:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error: " + error.message,
        });
    }
};

const getPaidInvoices = async (req, res) => {

    try {
        const paidInvoices = await Invoice.find({ status: 'Paid' });

        // Map to extract only the desired fields
        // const response = unpaidInvoices.map(invoice => ({
        //     companyName: invoice.companyName,
        //     withGstAmount:invoice.withGstAmount,
        //     mobile:invoice.mobile,
        //     productName: invoice.productName,
        //     endDate: invoice.date // Assuming 'date' is your end date
        // }));

        // res.status(200).json({
        //     success: true,
        //     data: response
        // });
        res.status(200).json({
            success: true,
            data: paidInvoices
        });
    } catch (error) {
        console.error("Error fetching unpaid invoices:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error: " + error.message,
        });
    }
};

const transporter = nodemailer.createTransport({
    service: "gmail",  // Or another service like SendGrid
    auth: {
        user: "purvagalani@gmail.com",  // Replace with your Gmail ID
        pass: "tefl tsvl dxuo toch",  // Replace with your Gmail App Password
    },
});

const sendEmailReminder = async (req, res) => {
    const { id } = req.params; // Extract the contact ID from the request parameters
    const { message } = req.body; // Extract the message from the request body

    // Validate the message field
    if (!message) {
        return res.status(400).json({
            success: false,
            message: "Message content is required",
        });
    }

    try {
        // Find the invoice by ID
        const invoice = await Invoice.findById(id);

        if (!invoice) {
            return res.status(404).json({ success: false, message: "Invoice not found" });
        }

        // Validate the email address
        if (!invoice.emailAddress) {
            return res.status(400).json({
                success: false,
                message: "Email address not available for this invoice",
            });
        }

        // Define the email options
        const mailOptions = {
            from: "your-email@gmail.com", // Your email address
            to: invoice.emailAddress, // Recipient's email address from the database
            subject: `Payment Reminder for Invoice #${invoice.id}`, // Subject of the email
            text: message, // The message the user wrote
        };

        // Send the email using Nodemailer
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
                message: `Email sent successfully to ${invoice.emailAddress}`,
                data: info.response, // Return the email info (optional)
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

  
  const sendWhatsAppReminder = async (req, res) => {
    const { id } = req.params;

    try {
        // Find the invoice by ID
        const invoice = await Invoice.findById(id);
        if (!invoice) {
            return res.status(404).json({ success: false, message: "Invoice not found" });
        }

        // Construct the recipient's WhatsApp number
        const countryCode = '+91';
        const customerNumber = invoice.contactNumber;
        if (!customerNumber) {
            return res.status(400).json({ success: false, message: "Customer contact number not found" });
        }
        const formattedNumber = `${countryCode}${customerNumber}`;

        // Construct the reminder message
        const message = `Hello ${invoice.customerName},\n\nThis is a reminder to pay your outstanding invoice of ₹${invoice.remainingAmount}. Please make the payment at your earliest convenience.`;

        // Simulate sending a WhatsApp message
        console.log(`Sending WhatsApp message to: ${formattedNumber}`);
        console.log(`Message: ${message}`);

        // Respond with success
        res.status(200).json({
            success: true,
            message: "WhatsApp reminder sent successfully",
        });
    } catch (error) {
        // Handle errors
        console.error("Error sending WhatsApp reminder:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error: " + error.message,
        });
    }
};


module.exports = {
    invoiceAdd,
    updateInvoice,
    deleteInvoice,
    getAllInvoices,
    getInvoiceById,
    getUnpaidInvoices,
    getPaidInvoices,
    sendEmailReminder,
    sendWhatsAppReminder,
    remindEventAPI
};