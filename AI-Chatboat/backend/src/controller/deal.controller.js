const mongoose = require('mongoose')
const Deal = require("../model/dealSchema.model");

    const createDeal = async (req, res) => {
        try {
            const { companyName, customerName, amount, productName, emailAddress, address, date, status, contactNumber, gstNumber, endDate, notes, isActive } = req.body;
    
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
    updateDeal,
    deleteDeal,
    updateStatus,
    getDealsByStatus
};