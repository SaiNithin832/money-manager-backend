require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transaction');
const accountRoutes = require('./routes/account');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/transaction', transactionRoutes);
app.use('/api/account', accountRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok', db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' }));

// Start server immediately so you can preview the app; MongoDB connects in background
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/money-manager';
mongoose.connect(MONGODB_URI).then(() => {
  console.log('MongoDB connected');
}).catch((err) => {
  console.error('MongoDB connection error:', err.message);
  console.log('Server still running. Set MONGODB_URI in .env (e.g. MongoDB Atlas) for full features.');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
