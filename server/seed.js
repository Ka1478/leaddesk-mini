const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const Lead = require('./models/Lead');
const User = require('./models/User');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/leaddesk';
const dataDir = path.join(__dirname, '../data');
const leadsStorePath = path.join(dataDir, 'leads_store.json');

const sampleLeads = [
  {
    ticketNo: 'TK-1001',
    name: 'Sarah Connor',
    email: 'sarah.connor@cyberdyne.io',
    budget: '$50,000+',
    message: 'We require a comprehensive enterprise security suite for cloud infrastructure monitoring and AI anomaly detection.',
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
    message: 'Need e-commerce website redesign with high performance Next.js setup and Stripe integration.',
    status: 'Closed',
  },
  {
    ticketNo: 'TK-1004',
    name: 'David Miller',
    email: 'd.miller@nextgenapps.org',
    budget: '$1,000 – $5,000',
    message: 'Interested in API integration setup and automated email lead response workflow.',
    status: 'New',
  },
  {
    ticketNo: 'TK-1005',
    name: 'Aisha Patel',
    email: 'aisha.patel@horizonfintech.com',
    budget: '$50,000+',
    message: 'Urgent mandate: Building a multi-tenant SaaS MVP with real-time analytics and RBAC authentication.',
    status: 'Contacted',
  },
];

async function seed() {
  try {
    let connectionUri = MONGO_URI;

    try {
      await mongoose.connect(connectionUri, { serverSelectionTimeoutMS: 2000 });
      console.log('Connected to MongoDB server at', connectionUri);
    } catch (err) {
      console.log('MongoDB local server not found. Spawning mongodb-memory-server...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      connectionUri = mongoServer.getUri();
      await mongoose.connect(connectionUri);
      console.log('Connected to Memory MongoDB at', connectionUri);
    }

    await Lead.deleteMany({});
    await User.deleteMany({});

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('AdminPass123!', salt);

    await User.create({
      email: 'admin@leaddesk.com',
      passwordHash,
      role: 'admin',
    });

    console.log('✅ Admin user created: admin@leaddesk.com / AdminPass123!');

    const createdLeads = await Lead.insertMany(sampleLeads);
    
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(leadsStorePath, JSON.stringify(createdLeads, null, 2));

    console.log(`✅ Seeded ${createdLeads.length} sample leads with unique ticket numbers (TK-1001 to TK-1005) & saved to disk store.`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
}

seed();
