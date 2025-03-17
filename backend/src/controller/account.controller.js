const Account = require("../model/accountSchema.model");
const nodemailer = require("nodemailer");

const accountAdd = async (req, res) => {
    try {
        const { accountHolderName, accountNumber, bankName, accountType, IFSCCode, UpiId } = req.body;

        const newAccount = new Account({
            accountHolderName,
            accountNumber,
            bankName,
            accountType,
            IFSCCode,
            UpiId
        });

        const savedAccount = await newAccount.save();
        res.status(201).json({ message: "Account added successfully", data: savedAccount });

    } catch (error) {
        console.error("Error adding account:", error);
        res.status(500).json({ message: "Failed to add account", error: error.message });
    }
};

const updateAccount = async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    try {
        console.log("Updating account with ID:", id, "and data:", updates);

        const updatedAccount = await Account.findByIdAndUpdate(id, updates, {
            new: true,
            runValidators: true
        });

        if (!updatedAccount) {
            return res.status(404).json({
                success: false,
                message: "Account not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Account updated successfully",
            data: updatedAccount
        });
    } catch (error) {
        console.error("Error updating account:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error: " + error.message,
        });
    }
};

const deleteAccount = async (req, res) => {
    const { id } = req.params;

    try {
        const deletedAccount = await Account.findByIdAndDelete(id);

        if (!deletedAccount) {
            return res.status(404).json({
                success: false,
                message: "Account not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Account deleted successfully",
            data: deletedAccount
        });
    } catch (error) {
        console.error("Error deleting account:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error: " + error.message,
        });
    }
};

const getAllAccounts = async (req, res) => {
    try {
        const accounts = await Account.find({});
        res.status(200).json({
            success: true,
            data: accounts
        });
    } catch (error) {
        console.error("Error fetching accounts:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error: " + error.message,
        });
    }
};

module.exports = {
    accountAdd,
    getAllAccounts,
    updateAccount,
    deleteAccount,
};