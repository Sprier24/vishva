const Deal = require("../model/dealSchema.model");
const Contact = require("../model/contactSchema.model");
const Account = require("../model/accountSchema.model");
const Invoice = require("../model/invoiceSchema.model");
const Lead = require("../model/leadSchema.model");
const Scheduled = require("../model/scheduledSchema.model");
const Task = require("../model/taskSchema.model");
const Complaint = require('../model/complaintSchema.model');

const Search = async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) return res.status(400).json({ message: "Query is required" });
    const regex = new RegExp(query, "i");
    const dateQuery = !isNaN(Date.parse(query)) ? new Date(query) : null;
    const isNumeric = !isNaN(query);
    const leads = await Lead.find({
      $or: [
        { companyName: regex },
        { customerName: regex },
        { emailAddress: regex },
        { contactNumber: regex },
        { address: regex },
        { productName: regex },
        { gstNumber: regex },
        { status: regex },
        { notes: regex },
        ...(isNumeric ? [{ amount: Number(query) }] : []),
        ...(dateQuery  ? [{ date: { $gte: dateQuery, $lte: new Date(dateQuery.getTime() + 86400000) } }, { endDate: { $gte: dateQuery, $lte: new Date(dateQuery.getTime() + 86400000) } }] : [])
      ]
    }).limit(5);
    const invoices = await Invoice.find({
      $or: [
        { companyName: regex },
        { customerName: regex },
        { emailAddress: regex },
        { contactNumber: regex },
        { address: regex },
        { gstNumber: regex },
        { productName: regex },
        { status: regex },
        ...(isNumeric ? [{ amount: Number(query) }, { discount: Number(query) }, { gstRate: Number(query) }, { totalWithoutGst: Number(query) }, { totalWithGst: Number(query) }, { paidAmount: Number(query) }, { remainingAmount: Number(query) }] : []),
        ...(dateQuery  ? [{ date: { $gte: dateQuery, $lte: new Date(dateQuery.getTime() + 86400000) } }, { endDate: { $gte: dateQuery, $lte: new Date(dateQuery.getTime() + 86400000) } }] : [])
      ]
    }).limit(5)
    // const reminder = await Invoice.find({ $or: [{ companyName: regex },{ customerName: regex }, { emailAddress: regex }, { contactNumber: regex }, { address: regex } , {gstNumber : regex} , {customerName: regex} , {productName: regex} , {amount : regex} , {status : regex}] }).limit(5);
    const deals = await Deal.find({
      $or: [
        { companyName: regex },
        { customerName: regex },
        { emailAddress: regex },
        { contactNumber: regex },
        { address: regex },
        { productName: regex },
        { gstNumber: regex },
        { status: regex },
        { notes: regex },
        ...(isNumeric ? [{ amount: Number(query) }] : []),
        ...(dateQuery  ? [{ date: { $gte: dateQuery, $lte: new Date(dateQuery.getTime() + 86400000) } }, { endDate: { $gte: dateQuery, $lte: new Date(dateQuery.getTime() + 86400000) } }] : [])
      ]
    }).limit(5);    
    const tasks = await Task.find({ 
      $or: [
        { name: regex },
        { subject: regex }, 
        { assigned: regex }, 
        { relatedTo: regex },  
        { status: regex }, 
        { priority: regex }, 
        { notes: regex},
        ...(dateQuery  ? [{ taskDate: { $gte: dateQuery, $lte: new Date(dateQuery.getTime() + 86400000) } }, { dueDate: { $gte: dateQuery, $lte: new Date(dateQuery.getTime() + 86400000) } }] : [])
      ]
    }).limit(5);
    const complaint = await Complaint.find({
      $or: [
        { complainerName: regex },
        { companyName:regex} , 
        { contactNumber: regex }, 
        { emailAddress: regex } ,
        { subject:regex } ,  
        { caseStatus:regex } , 
        { priority:regex } , 
        { caseOrigin:regex },
        ...(dateQuery  ? [{ date: { $gte: dateQuery, $lte: new Date(dateQuery.getTime() + 86400000) } }] : [])
      ] 
    }).limit(5);
    const contacts = await Contact.find({ 
      $or: [
        { companyName: regex },
        { customerName: regex }, 
        { emailAddress: regex }, 
        { contactNumber: regex }, 
        { address: regex } , 
        { gstNumber : regex}, 
        { description : regex}
      ] 
    }).limit(5);
    const accounts = await Account.find({ 
      $or: [ 
        {accountHolderName: regex}, 
        {accountNumber: regex}, 
        {bankName: regex}, 
        {accountType: regex}, 
        {IFSCCode: regex},
        {UpiId: regex}
      ] 
    }).limit(5);
    const schedules = await Scheduled.find({ 
      $or: [
        { subject: regex }, 
        { assignedUser: regex }, 
        { customer: regex }, 
        { location: regex }, 
        { status: regex }, 
        { eventType: regex }, 
        { priority: regex }, 
        { description: regex }, 
        { recurrence: regex }, 
        ...(dateQuery  ? [{ date: { $gte: dateQuery, $lte: new Date(dateQuery.getTime() + 86400000) } }] : [])
      ] 
    }).limit(5);

    let suggestions = [];
    if (leads.length > 0) suggestions.push({ page: "Leads", path: "/lead/table" });
    if (invoices.length > 0) suggestions.push({ page: "Invoices", path: "/invoice/table" });
    // if (reminder.length > 0) suggestions.push({ page: "Reminders", path: "/reminder" });
    if (deals.length > 0) suggestions.push({ page: "Deals", path: "/deal/table" });
    if (tasks.length > 0) suggestions.push({ page: "Tasks", path: "/task/table" });
    if (complaint.length > 0) suggestions.push({ page: "Complaint", path: "/complaint/table" });
    if (contacts.length > 0) suggestions.push({ page: "Contacts", path: "/contact/table" });
    if (accounts.length > 0) suggestions.push({ page: "Accounts", path: "/Account/table" });
    if (schedules.length > 0) suggestions.push({ page: "Schedules", path: "/Scheduled/table" });

    res.json({  deals, contacts, accounts, invoices, leads, schedules, tasks, complaint, suggestions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = { Search };