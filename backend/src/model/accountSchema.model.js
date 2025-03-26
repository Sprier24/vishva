const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  accountHolderName: { type: String, required: true},
  accountNumber: { type: String, required: true},
  bankName: { type: String, required: true},
  accountType: { type: String, required: true, enum: ["Current", "Savings","Other"] },
  IFSCCode: { type: String, required: true},
  UpiId: { type: String},
}, { timestamps: true });

const Account = mongoose.model('Account', accountSchema);

module.exports = Account;