const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const authRoutes = require('./routes/auth');
const leadRoutes = require('./routes/leads');
const User = require('./models/User');
const Lead = require('./models/Lead');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGODB_URI;

const dataDir = process.env.VERCEL ? '/tmp' : path.join(__dirname, '../data');
const leadsStorePath = path.join(dataDir, 'leads_store.json');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

let isDbInitialized = false;

// Ultra-fast Serverless DB Init (Zero-delay execution)
async function initDatabase() {
  if (isDbInitialized) return;
  isDbInitialized = true;

  // Only attempt Mongoose connection if explicit MONGODB_URI environment variable is provided
  if (MONGO_URI) {
    try {
      await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 2000 });
      console.log('Connected to MongoDB at:', MONGO_URI);

      const userCount = await User.countDocuments();
      if (userCount === 0) {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('AdminPass123!', salt);
        await User.create({
          email: 'admin@leaddesk.com',
          passwordHash,
          role: 'admin',
        });
      }
    } catch (err) {
      console.error('Remote MongoDB connection error:', err.message);
    }
  }
}

// Fast synchronous middleware
app.use((req, res, next) => {
  if (req.path.startsWith('/api') && !isDbInitialized) {
    initDatabase().catch(console.error);
  }
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date(),
    service: 'LeadDesk Mini API',
    speed: 'ultra-fast',
  });
});

const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'API route not found' });
  }
  res.sendFile(path.join(publicPath, 'index.html'), (err) => {
    if (err) {
      res.status(200).send(`
        <!DOCTYPE html>
        <html>
        <head><title>LeadDesk Mini API Server</title></head>
        <body style="font-family: sans-serif; padding: 2rem; background: #0f172a; color: #f8fafc;">
          <h1>🚀 LeadDesk Mini API Server</h1>
        </body>
        </html>
      `);
    }
  });
});

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 LeadDesk Mini Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
