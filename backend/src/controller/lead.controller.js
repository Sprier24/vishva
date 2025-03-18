const mongoose = require('mongoose')
const Lead = require("../model/leadSchema.model");

const createLead = async (req, res) => {
    try {
        const { companyName, customerName, amount, productName, emailAddress, address, date, status } = req.body;
        
        const leadData = new Lead({
            companyName,
            customerName,
            contactNumber: req.body.contactNumber,  
            emailAddress,
            address,
            productName,
            amount,
            gstNumber: req.body.gstNumber,  
            status: status || 'New',  
            date,
            endDate: req.body.endDate,  
            notes: req.body.notes || '',  
            isActive: req.body.isActive ?? true,  
        });

        await leadData.save();  

        res.status(201).json({
            success: true,
            message: "Lead created successfully",
            data: leadData
        });
    } catch (error) {
        console.error("Error creating lead:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error: " + error.message,
        });
    }
};

const getAllLeads = async (req, res) => {
    try {
        const leads = await Lead.find({});

        if (leads.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No leads found"
            });
        }

        res.status(200).json({
            success: true,
            data: leads
        });
    } catch (error) {
        console.error("Error fetching leads:", error);  
        res.status(500).json({
            success: false,
            message: "Internal server error: " + error.message,
        });
    }
};

const updateLead = async (req, res) => {
    const { id } = req.params;  
    const updates = req.body;   

    try {
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid leadId"
            });
        }
        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No data provided for update",
            });
        }

        const updatedLead = await Lead.findByIdAndUpdate(
            id,
            updates,
            {
                new: true,  
                runValidators: true  
            }
        );

        if (!updatedLead) {
            return res.status(404).json({
                success: false,
                message: "Lead not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Lead updated successfully",
            data: updatedLead
        });
    } catch (error) {
        console.error("Error updating lead:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error: " + error.message,
        });
    }
};

const deleteLead = async (req, res) => {
    const { id } = req.params;

    try {
        const deletedLead = await Lead.findByIdAndDelete(id);

        if (!deletedLead) {
            return res.status(404).json({
                success: false,
                message: "Lead not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Lead deleted successfully",
            data: deletedLead
        });
    } catch (error) {
        console.error("Error deleting lead:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error: " + error.message,
        });
    }
};

const updateStatus = async (req, res) => {
    const { leadId, status } = req.body;

    try {
        const lead = await Lead.findById(leadId);
        if (!lead) {
            return res.status(404).json({ success: false, message: 'Lead not found' });
        }

        lead.status = status;
        await lead.save();

        res.json({ success: true, message: 'Lead status updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const getLeadsByStatus = async (req, res) => {
    const { status } = req.query;
  
    try {
      const leads = await Lead.find({ status }, 'Name email amount');
      res.status(200).json({
        success: true,
        data: leads
      });
    } catch (error) {
      console.error(`Error fetching ${status} leads:`, error);
      res.status(500).json({
        success: false,
        message: "Internal server error: " + error.message,
      });
    }
  };
  
module.exports = {
    createLead,
    getAllLeads,
    updateLead,
    deleteLead,
    updateStatus,
    getLeadsByStatus
};
