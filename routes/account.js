const express = require('express');
const Account = require('../models/Account');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /account/list - All accounts for user
router.get('/list', auth, async (req, res) => {
  try {
    const accounts = await Account.find({ userId: req.userId }).sort({ accountName: 1 });
    res.json(accounts);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /account/transfer - Transfer between accounts
router.post('/transfer', auth, async (req, res) => {
  try {
    const { fromAccount, toAccount, amount } = req.body;
    if (!fromAccount || !toAccount || !amount || fromAccount === toAccount) {
      return res.status(400).json({ error: 'fromAccount, toAccount and amount required; accounts must differ' });
    }
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: 'amount must be a positive number' });
    }
    let from = await Account.findOne({ userId: req.userId, accountName: fromAccount });
    let to = await Account.findOne({ userId: req.userId, accountName: toAccount });
    if (!from) {
      from = new Account({ userId: req.userId, accountName: fromAccount, balance: 0 });
      await from.save();
    }
    if (!to) {
      to = new Account({ userId: req.userId, accountName: toAccount, balance: 0 });
      await to.save();
    }
    if (from.balance < numAmount) {
      return res.status(400).json({ error: 'Insufficient balance in source account' });
    }
    from.balance -= numAmount;
    to.balance += numAmount;
    await from.save();
    await to.save();
    res.json({ from: fromAccount, to: toAccount, amount: numAmount, fromBalance: from.balance, toBalance: to.balance });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /account/create - Ensure account exists (e.g. Cash, Bank, Wallet)
router.post('/create', auth, async (req, res) => {
  try {
    const { accountName } = req.body;
    if (!accountName) {
      return res.status(400).json({ error: 'accountName required' });
    }
    let account = await Account.findOne({ userId: req.userId, accountName });
    if (!account) {
      account = new Account({ userId: req.userId, accountName, balance: 0 });
      await account.save();
    }
    res.json(account);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
