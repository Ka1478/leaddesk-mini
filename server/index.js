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
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/leaddesk';

// Use /tmp directory on Vercel for writable disk persistence
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

let isDbConnecting = false;
let isDbInitialized = false;

// Serverless-ready Database Connection Manager
async function initDatabase() {
  if (isDbInitialized && mongoose.connection.readyState === 1) return;
  if (isDbConnecting) return;

  isDbConnecting = true;
  try {
    if (mongoose.connection.readyState !== 1) {
      try {
        await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 2000 });
        console.log('Connected to MongoDB at:', MONGO_URI);
      } catch (err) {
        // Fallback to Memory MongoDB or local connection
        console.log('Using fallback MongoMemoryServer...');
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const mongoServer = await MongoMemoryServer.create();
        const memoryUri = mongoServer.getUri();
        await mongoose.connect(memoryUri);
        console.log('Connected to Memory MongoDB at:', memoryUri);
      }
    }

    // Seed default admin if user collection is empty
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('AdminPass123!', salt);
      await User.create({
        email: 'admin@leaddesk.com',
        passwordHash,
        role: 'admin',
      });
      console.log('⚡ Default admin created: admin@leaddesk.com / AdminPass123!');
    }

    // Restore persistent tickets from disk if available
    if (fs.existsSync(leadsStorePath)) {
      try {
        const fileData = fs.readFileSync(leadsStorePath, 'utf8');
        const savedLeads = JSON.parse(fileData);
        if (Array.isArray(savedLeads) && savedLeads.length > 0) {
          const currentCount = await Lead.countDocuments();
          if (currentCount === 0) {
            await Lead.insertMany(savedLeads);
            console.log(`💾 Restored ${savedLeads.length} tickets from disk.`);
          }
        }
      } catch (err) {
        console.error('Failed to restore tickets from disk:', err);
      }
    } else {
      const leadCount = await Lead.countDocuments();
      if (leadCount === 0) {
        const initialLeads = [
          {
            ticketNo: 'TK-1001',
            name: 'Sarah Connor',
            email: 'sarah.connor@cyberdyne.io',
            budget: '$50,000+',
            message: 'We require a comprehensive enterprise security suite for cloud infrastructure monitoring.',
            status: 'New',
          },
          {
            ticketNo: 'TK-1002',
            name: 'Marcus Vance',
            email: 'marcus.v@apextech.com',
            budget: '$15,000 – $50,000',
            message: 'Looking for full-stack custom CRM development with client portal and real-time analytics dashboard.',
            status: 'Contacted',
          },
          {
            ticketNo: 'TK-1003',
            name: 'Elena Rostova',
            email: 'elena@luminardesign.co',
            budget: '$5,000 – $20,000',
            message: 'Need e-commerce website redesign with high performance React setup and payment integration.',
            status: 'Closed',
          },
        ];
        await Lead.insertMany(initialLeads);
        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true });
        }
        fs.writeFileSync(leadsStorePath, JSON.stringify(initialLeads, null, 2));
      }
    }

    isDbInitialized = true;
  } catch (error) {
    console.error('Database init error:', error);
  } finally {
    isDbConnecting = false;
  }
}

// Middleware to ensure database is ready on serverless function invocations
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api')) {
    await initDatabase();
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
