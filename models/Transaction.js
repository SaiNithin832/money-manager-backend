const mongoose = require('mongoose');

const CATEGORIES = ['Fuel', 'Movie', 'Food', 'Loan', 'Medical', 'Shopping', 'Rent', 'Utilities', 'Travel', 'Other'];
const DIVISIONS = ['Office', 'Personal'];

const transactionSchema = new mongoose.Schema({
  type: { type: String, enum: ['income', 'expense'], required: true },
  amount: { type: Number, required: true },
  category: { type: String, enum: CATEGORIES, required: true },
  division: { type: String, enum: DIVISIONS, required: true },
  description: { type: String, default: '' },
  dateTime: { type: Date, required: true },
  account: { type: String, required: true }, // Cash, Bank, Wallet
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

transactionSchema.index({ userId: 1, dateTime: -1 });
transactionSchema.index({ userId: 1, category: 1 });
transactionSchema.index({ userId: 1, division: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
module.exports.CATEGORIES = CATEGORIES;
module.exports.DIVISIONS = DIVISIONS;
