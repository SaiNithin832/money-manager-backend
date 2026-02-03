const express = require('express');
const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const auth = require('../middleware/auth');

const router = express.Router();
const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;

// GET /transaction/constants - Categories and divisions for dropdowns (auth optional for pre-login)
router.get('/constants', (req, res) => {
  res.json({ categories: Transaction.CATEGORIES, divisions: Transaction.DIVISIONS });
});

// Helper: ensure account exists and update balance
async function updateAccountBalance(userId, accountName, amountDelta) {
  let account = await Account.findOne({ userId, accountName });
  if (!account) {
    account = new Account({ userId, accountName, balance: 0 });
  }
  account.balance += amountDelta;
  await account.save();
  return account;
}

// POST /transaction/add - Add income or expense
router.post('/add', auth, async (req, res) => {
  try {
    const { type, amount, category, division, description, dateTime, account } = req.body;
    if (!type || amount == null || !category || !division || !dateTime || !account) {
      return res.status(400).json({ error: 'type, amount, category, division, dateTime, account required' });
    }
    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({ error: 'type must be income or expense' });
    }
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: 'amount must be a positive number' });
    }
    const tx = new Transaction({
      type,
      amount: numAmount,
      category,
      division,
      description: description || '',
      dateTime: new Date(dateTime),
      account,
      userId: req.userId,
    });
    await tx.save();
    const delta = type === 'income' ? numAmount : -numAmount;
    await updateAccountBalance(req.userId, account, delta);
    res.status(201).json(tx);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /transaction/monthly?year=&month=
router.get('/monthly', auth, async (req, res) => {
  try {
    const { year, month } = req.query;
    const y = parseInt(year, 10);
    const m = parseInt(month, 10);
    if (isNaN(y) || isNaN(m) || m < 1 || m > 12) {
      return res.status(400).json({ error: 'Valid year and month required' });
    }
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0, 23, 59, 59, 999);
    const list = await Transaction.find({
      userId: req.userId,
      dateTime: { $gte: start, $lte: end },
    }).sort({ dateTime: -1 });
    const income = list.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = list.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    res.json({ totalIncome: income, totalExpense: expense, balance: income - expense, list });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /transaction/weekly?year=&week= (ISO week)
router.get('/weekly', auth, async (req, res) => {
  try {
    const { year, week } = req.query;
    const y = parseInt(year, 10);
    const w = parseInt(week, 10);
    if (isNaN(y) || isNaN(w) || w < 1 || w > 53) {
      return res.status(400).json({ error: 'Valid year and week required' });
    }
    const getWeekBounds = (year, week) => {
      const jan4 = new Date(year, 0, 4);
      const dayNum = jan4.getDay() || 7;
      const mon = new Date(jan4);
      mon.setDate(jan4.getDate() - dayNum + 1 + (week - 1) * 7);
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      sun.setHours(23, 59, 59, 999);
      return { start: mon, end: sun };
    };
    const { start, end } = getWeekBounds(y, w);
    const list = await Transaction.find({
      userId: req.userId,
      dateTime: { $gte: start, $lte: end },
    }).sort({ dateTime: -1 });
    const income = list.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = list.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    res.json({ totalIncome: income, totalExpense: expense, balance: income - expense, list });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /transaction/yearly?year=
router.get('/yearly', auth, async (req, res) => {
  try {
    const { year } = req.query;
    const y = parseInt(year, 10);
    if (isNaN(y)) {
      return res.status(400).json({ error: 'Valid year required' });
    }
    const start = new Date(y, 0, 1);
    const end = new Date(y, 11, 31, 23, 59, 59, 999);
    const list = await Transaction.find({
      userId: req.userId,
      dateTime: { $gte: start, $lte: end },
    }).sort({ dateTime: -1 });
    const income = list.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = list.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    res.json({ totalIncome: income, totalExpense: expense, balance: income - expense, list });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /transaction/filter?category=&division=&from=&to=
router.get('/filter', auth, async (req, res) => {
  try {
    const { category, division, from, to } = req.query;
    const filter = { userId: req.userId };
    if (category) filter.category = category;
    if (division) filter.division = division;
    if (from || to) {
      filter.dateTime = {};
      if (from) filter.dateTime.$gte = new Date(from);
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        filter.dateTime.$lte = end;
      }
    }
    const list = await Transaction.find(filter).sort({ dateTime: -1 });
    const income = list.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = list.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    res.json({ totalIncome: income, totalExpense: expense, balance: income - expense, list });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /transaction/category-summary?from=&to=
router.get('/category-summary', auth, async (req, res) => {
  try {
    const { from, to } = req.query;
    const match = { userId: req.userId, type: 'expense' };
    if (from || to) {
      match.dateTime = {};
      if (from) match.dateTime.$gte = new Date(from);
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        match.dateTime.$lte = end;
      }
    }
    const summary = await Transaction.aggregate([
      { $match: match },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } },
    ]);
    res.json(summary.map((s) => ({ category: s._id, total: s.total })));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /transaction/edit/:id - Edit only if within 12 hours
router.put('/edit/:id', auth, async (req, res) => {
  try {
    const tx = await Transaction.findOne({ _id: req.params.id, userId: req.userId });
    if (!tx) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    const age = Date.now() - new Date(tx.createdAt).getTime();
    if (age > TWELVE_HOURS_MS) {
      return res.status(403).json({ error: 'Editing allowed only within 12 hours of creation' });
    }
    const { amount, category, division, description, dateTime, account } = req.body;
    const oldAmount = tx.amount;
    const oldAccount = tx.account;
    const oldType = tx.type;
    if (amount != null) tx.amount = Number(amount);
    if (category) tx.category = category;
    if (division) tx.division = division;
    if (description !== undefined) tx.description = description;
    if (dateTime) tx.dateTime = new Date(dateTime);
    if (account) tx.account = account;
    await tx.save();
    // Revert old balance delta and apply new
    const oldDelta = oldType === 'income' ? oldAmount : -oldAmount;
    await updateAccountBalance(req.userId, oldAccount, -oldDelta);
    const newDelta = tx.type === 'income' ? tx.amount : -tx.amount;
    await updateAccountBalance(req.userId, tx.account, newDelta);
    res.json(tx);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /transaction/list - All transactions (for history)
router.get('/list', auth, async (req, res) => {
  try {
    const list = await Transaction.find({ userId: req.userId }).sort({ dateTime: -1 }).limit(200);
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /transaction/can-edit/:id - Check if entry can be edited (within 12 hours)
router.get('/can-edit/:id', auth, async (req, res) => {
  try {
    const tx = await Transaction.findOne({ _id: req.params.id, userId: req.userId });
    if (!tx) {
      return res.status(404).json({ canEdit: false, error: 'Transaction not found' });
    }
    const age = Date.now() - new Date(tx.createdAt).getTime();
    res.json({ canEdit: age <= TWELVE_HOURS_MS });
  } catch (e) {
    res.status(500).json({ canEdit: false, error: e.message });
  }
});

module.exports = router;
