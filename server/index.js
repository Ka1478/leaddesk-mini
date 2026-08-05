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

const dataDir = path.join(__dirname, '../data');
const leadsStorePath = path.join(dataDir, 'leads_store.json');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  cors({
    origin: process.env.NODE_ENV === 'production' ? true : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
  })
);

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
          <p>Status: <strong>Online & Running</strong></p>
          <p>Please run the React frontend dev server: <code>npm run client</code> or build it with <code>npm run build</code>.</p>
        </body>
        </html>
      `);
    }
  });
});

async function startServer() {
  try {
    let connectionUri = MONGO_URI;

    try {
      await mongoose.connect(connectionUri, { serverSelectionTimeoutMS: 2500 });
      console.log('Connected to MongoDB database at:', connectionUri);
    } catch (err) {
      console.log('Standard MongoDB server not detected. Initializing Memory MongoDB...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      connectionUri = mongoServer.getUri();
      await mongoose.connect(connectionUri);
      console.log('Connected to Memory MongoDB database at:', connectionUri);
    }

    // Auto-seed default admin if no user exists
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
          await Lead.deleteMany({});
          await Lead.insertMany(savedLeads);
          console.log(`💾 Restored ${savedLeads.length} past tickets from persistent disk storage.`);
        }
      } catch (err) {
        console.error('Failed to load past tickets from disk:', err);
      }
    } else {
      // Seed initial sample leads if no past store exists
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
        console.log('⚡ Initial sample leads seeded & saved to persistent disk store.');
      }
    }

    app.listen(PORT, () => {
      console.log(`\n==================================================`);
      console.log(`🚀 LeadDesk Mini Server running on http://localhost:${PORT}`);
      console.log(`👉 API Base: http://localhost:${PORT}/api`);
      console.log(`==================================================\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
