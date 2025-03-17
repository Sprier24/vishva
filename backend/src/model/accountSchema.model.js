const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  accountHolderName: { type: String, required: true, minlength: 2 },
  accountNumber: { type: String, required: true, minlength: 2 },
  bankName: { type: String, required: true, minlength: 2 },
  accountType: { type: String, required: true, enum: ["Current", "Savings","Other"] },
  IFSCCode: { type: String, required: true, minlength: 2 },
  UpiId: { type: String, required: true, minlength: 2 },
}, { timestamps: true });

const Account = mongoose.model('Account', accountSchema);

module.exports = Account;