const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const bcrypt = require('bcryptjs');

const authRoutes = require('./routes/auth');
const leadRoutes = require('./routes/leads');
const User = require('./models/User');
const Lead = require('./models/Lead');

const app = express();
const PORT = process.env.PORT || 5000;

// Cloud MongoDB Atlas URI for multi-tenant, multi-instance serverless persistence
const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://leaddesk_admin:LeadDesk2026Pass@cluster0.p7x7y.mongodb.net/leaddesk?retryWrites=true&w=majority';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// Connect Mongoose to Cloud MongoDB Database
let isConnecting = false;
async function connectCloudDB() {
  if (mongoose.connection.readyState === 1) return;
  if (isConnecting) return;
  isConnecting = true;

  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 4000,
    });
    console.log('Connected to Cloud MongoDB Atlas database successfully.');

    // Seed default admin account in Cloud DB if not present
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('AdminPass123!', salt);
      await User.create({
        email: 'admin@leaddesk.com',
        passwordHash,
        role: 'admin',
      });
      console.log('⚡ Default admin created in Cloud DB: admin@leaddesk.com / AdminPass123!');
    }
  } catch (err) {
    console.error('Cloud MongoDB connection notice:', err.message);
  } finally {
    isConnecting = false;
  }
}

// Immediately trigger DB connection
connectCloudDB();

// Middleware to ensure DB connection on serverless requests
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api')) {
    await connectCloudDB();
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
    dbStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
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
