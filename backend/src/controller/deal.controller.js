const mongoose = require('mongoose')
const Deal = require("../model/dealSchema.model");

    const createDeal = async (req, res) => {
        try {
            const { companyName, customerName, amount, productName, emailAddress, address, date, status, contactNumber, gstNumber, endDate, notes, isActive } = req.body;
    
            // Check for an existing deal with all key details
            const existingDeal = await Deal.findOne({
                companyName,
                customerName,
                emailAddress,
                productName,
                contactNumber,
                gstNumber
            });
    
            if (existingDeal) {
                return res.status(400).json({ 
                    success: false, 
                    message: "This deal already exists."                  
                });
            }
    
            // Create and save a new deal
            const dealData = new Deal({
                companyName,
                customerName,
                contactNumber,
                emailAddress,
                address,
                productName,
                amount,
                gstNumber,
                status: status || 'New',  
                date,
                endDate,  
                notes: notes || '',  
                isActive: isActive ?? true, 
            });
    
            await dealData.save();  
    
            res.status(201).json({
                success: true,
                message: "Deal created successfully",
                data: dealData
            });
        } catch (error) {
            console.error("Error creating deal:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error: " + error.message,
            });
        }
    };

    
const getAllDeals = async (req, res) => {
    try {
        const deals = await Deal.find({});

        if (deals.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No deals found"
            });
        }

        res.status(200).json({
            success: true,
            data: deals
        });
    } catch (error) {
        console.error("Error fetching deals:", error);  
        res.status(500).json({
            success: false,
            message: "Internal server error: " + error.message,
        });
    }
};

const getLeadById = async (req, res) => {
    const { id } = req.params;

    try {
        const lead = await Lead.findById(id);
        
        if (!lead) {
            return res.status(404).json({
                success: false,
                message: "Lead not found"
            });
        }

        res.status(200).json({
            success: true,
            data: lead
        });
    } catch (error) {
        console.error("Error fetching lead:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error: " + error.message,
        });
    }
};

const updateDeal = async (req, res) => {
    const { id } = req.params;  
    const updates = req.body;   

    try {
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid dealId"
            });
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No data provided for update",
            });
        }

        const updatedDeal = await Deal.findByIdAndUpdate(
            id,
            updates,
            {
                new: true,  
                runValidators: true  
            }
        );

        if (!updatedDeal) {
            return res.status(404).json({
                success: false,
                message: "Deal not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Deal updated successfully",
            data: updatedDeal
        });
    } catch (error) {
        console.error("Error updating deal:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error: " + error.message,
        });
    }
};

const deleteDeal = async (req, res) => {
    const { id } = req.params;

    try {
        const deletedDeal = await Deal.findByIdAndDelete(id);

        if (!deletedDeal) {
            return res.status(404).json({
                success: false,
                message: "Deal not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Deal deleted successfully",
            data: deletedDeal
        });
    } catch (error) {
        console.error("Error deleting deal:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error: " + error.message,
        });
    }
};

const getNewLeads = async (req, res) => {
    try {
        const leads = await Lead.find({ status: 'New' }, 'Name email amount');
        res.status(200).json({
            success: true,
            data: leads
        });
    } catch (error) {
        console.error("Error fetching New leads:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error: " + error.message,
        });
    }
};

const getDiscussionLeads = async (req, res) => {
    try {
        const leads = await Lead.find({ status: 'Discussion' }, 'Name email amount');
        res.status(200).json({
            success: true,
            data: leads
        });
    } catch (error) {
        console.error("Error fetching Discussion leads:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error: " + error.message,
        });
    }
};

const getDemoLeads = async (req, res) => {
    try {
        const leads = await Lead.find({ status: 'Demo' }, ' email amount');
        res.status(200).json({
            success: true,
            data: leads
        });
    } catch (error) {
        console.error("Error fetching Demo leads:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error: " + error.message,
        });
    }
};

const getProposalLeads = async (req, res) => {
    try {
        const leads = await Lead.find({ status: 'Proposal' }, 'Name email amount');
        res.status(200).json({
            success: true,
            data: leads
        });
    } catch (error) {
        console.error("Error fetching Proposal leads:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error: " + error.message,
        });
    }
};

const getDecidedLeads = async (req, res) => {
    try {
        const leads = await Lead.find({ status: 'Decided' });
        res.status(200).json({
            success: true,
            data: leads
        });
    } catch (error) {
        console.error("Error fetching Decided leads:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error: " + error.message,
        });
    }
};

const searchByMonth = async (req, res) => {
    const { month, year } = req.query;

    try {
        const leads = await Lead.find({
            date: {
                $gte: new Date(year, month - 1, 1),
                $lt: new Date(year, month, 1)
            }
        });
        res.json(leads);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const searchByYear = async (req, res) => {
    const { year } = req.query;

    try {
        const leads = await Lead.find({
            date: {
                $gte: new Date(year, 0, 1),
                $lt: new Date(year + 1, 0, 1)
            }
        });
        res.json(leads);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const searchByDate = async (req, res) => {
    const { date } = req.query;

    try {
        const leads = await Lead.find({
            date: {
                $gte: new Date(date),
                $lt: new Date(new Date(date).setDate(new Date(date).getDate() + 1))
            }
        });
        res.json(leads);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateStatus = async (req, res) => {
    const { dealId, status } = req.body;

    try {
        const deal = await Deal.findById(dealId);
        if (!deal) {
            return res.status(404).json({ success: false, message: 'Deal not found' });
        }

        deal.status = status;
        await deal.save();

        res.json({ success: true, message: 'Deal status updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const getDealsByStatus = async (req, res) => {
    const { status } = req.query;
  
    try {
      const deals = await Deal.find({ status }, 'Name email amount');
      res.status(200).json({
        success: true,
        data: deals
      });
    } catch (error) {
      console.error(`Error fetching ${status} deals:`, error);
      res.status(500).json({
        success: false,
        message: "Internal server error: " + error.message,
      });
    }
  };

module.exports = {
    createDeal,
    getAllDeals,
    getLeadById,
    updateDeal,
    deleteDeal,
    getNewLeads,
    getDiscussionLeads,
    getDemoLeads,
    getProposalLeads,
    getDecidedLeads,
    updateStatus,
    searchByMonth,
    searchByYear,
    searchByDate,
    getDealsByStatus
};