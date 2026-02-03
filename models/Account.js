const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  accountName: { type: String, required: true }, // Cash, Bank, Wallet
  balance: { type: Number, default: 0 },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

// Compound index for unique account per user
accountSchema.index({ userId: 1, accountName: 1 }, { unique: true });

module.exports = mongoose.model('Account', accountSchema);
