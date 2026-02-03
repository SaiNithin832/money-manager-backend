const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password required' });
    }
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    const user = new User({ name, email, password });
    await user.save();
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'money-manager-secret',
      { expiresIn: '7d' }
    );
    res.status(201).json({ user: { id: user._id, name: user.name, email: user.email }, token });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'money-manager-secret',
      { expiresIn: '7d' }
    );
    res.json({ user: { id: user._id, name: user.name, email: user.email }, token });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get current user (protected)
router.get('/me', auth, (req, res) => {
  res.json({ user: { id: req.user._id, name: req.user.name, email: req.user.email } });
});

module.exports = router;
