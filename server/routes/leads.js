const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Lead = require('../models/Lead');
const { protect } = require('../middleware/auth');
const { validateLeadSubmission } = require('../middleware/validate');

const storePath = process.env.VERCEL
  ? '/tmp/leads_store.json'
  : path.join(__dirname, '../../data/leads_store.json');

const initialLeads = [
  {
    _id: '65f1a2b3c4d5e6f7a8b9c0d1',
    ticketNo: 'TK-1001',
    name: 'Sarah Connor',
    email: 'sarah.connor@cyberdyne.io',
    budget: '$50,000+',
    message: 'We require a comprehensive enterprise security suite for cloud infrastructure monitoring.',
    status: 'New',
    createdAt: new Date('2026-08-05T10:00:00Z'),
  },
  {
    _id: '65f1a2b3c4d5e6f7a8b9c0d2',
    ticketNo: 'TK-1002',
    name: 'Marcus Vance',
    email: 'marcus.v@apextech.com',
    budget: '$15,000 – $50,000',
    message: 'Looking for full-stack custom CRM development with client portal and real-time analytics dashboard.',
    status: 'Contacted',
    createdAt: new Date('2026-08-05T11:00:00Z'),
  },
  {
    _id: '65f1a2b3c4d5e6f7a8b9c0d3',
    ticketNo: 'TK-1003',
    name: 'Elena Rostova',
    email: 'elena@luminardesign.co',
    budget: '$5,000 – $20,000',
    message: 'Need e-commerce website redesign with high performance React setup and payment integration.',
    status: 'Closed',
    createdAt: new Date('2026-08-05T12:00:00Z'),
  },
];

function readDiskLeads() {
  try {
    if (fs.existsSync(storePath)) {
      const data = fs.readFileSync(storePath, 'utf8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {}
  return [...initialLeads];
}

function writeDiskLeads(leads) {
  try {
    const dir = path.dirname(storePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(storePath, JSON.stringify(leads, null, 2));
  } catch (e) {
    console.error('Disk write error:', e.message);
  }
}

async function generateTicketNo() {
  if (mongoose.connection.readyState === 1) {
    try {
      const count = await Lead.countDocuments();
      return `TK-${1000 + count + 1}`;
    } catch (e) {}
  }
  const disk = readDiskLeads();
  return `TK-${1000 + disk.length + 1}`;
}

// @route   POST /api/leads
router.post('/', validateLeadSubmission, async (req, res) => {
  try {
    const { name, email, budget, message } = req.body;
    const ticketNo = await generateTicketNo();

    if (mongoose.connection.readyState === 1) {
      try {
        const lead = await Lead.create({
          ticketNo,
          name: name.trim(),
          email: email.toLowerCase().trim(),
          budget: budget.trim(),
          message: message.trim(),
          status: 'New',
        });
        return res.status(201).json({
          success: true,
          message: 'Thank you! Your ticket request has been captured successfully.',
          data: lead,
        });
      } catch (dbErr) {
        console.error('Mongoose DB insert error, using disk fallback:', dbErr.message);
      }
    }

    const newLead = {
      _id: new mongoose.Types.ObjectId().toString(),
      ticketNo,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      budget: budget.trim(),
      message: message.trim(),
      status: 'New',
      createdAt: new Date().toISOString(),
    };

    const currentLeads = readDiskLeads();
    currentLeads.unshift(newLead);
    writeDiskLeads(currentLeads);

    return res.status(201).json({
      success: true,
      message: 'Thank you! Your ticket request has been captured successfully.',
      data: newLead,
    });
  } catch (error) {
    console.error('Lead creation handler error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while storing ticket submission',
    });
  }
});

// @route   GET /api/leads
router.get('/', protect, async (req, res) => {
  try {
    const { search, status } = req.query;

    if (mongoose.connection.readyState === 1) {
      try {
        let query = {};
        if (status && status !== 'All') {
          query.status = status;
        }
        if (search && search.trim()) {
          const searchRegex = new RegExp(search.trim(), 'i');
          query.$or = [
            { ticketNo: searchRegex },
            { name: searchRegex },
            { email: searchRegex },
            { message: searchRegex },
            { budget: searchRegex },
          ];
        }

        const dbLeads = await Lead.find(query).sort({ createdAt: -1 });
        const totalLeads = await Lead.countDocuments();
        const newLeads = await Lead.countDocuments({ status: 'New' });
        const contactedLeads = await Lead.countDocuments({ status: 'Contacted' });
        const closedLeads = await Lead.countDocuments({ status: 'Closed' });

        return res.json({
          success: true,
          count: dbLeads.length,
          metrics: { totalLeads, newLeads, contactedLeads, closedLeads },
          data: dbLeads,
        });
      } catch (dbErr) {
        console.error('Mongoose fetch error, using disk fallback:', dbErr.message);
      }
    }

    const diskLeads = readDiskLeads();
    let filtered = [...diskLeads];

    if (status && status !== 'All') {
      filtered = filtered.filter((l) => l.status === status);
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(
        (l) =>
          (l.ticketNo && l.ticketNo.toLowerCase().includes(q)) ||
          l.name.toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q) ||
          l.message.toLowerCase().includes(q) ||
          l.budget.toLowerCase().includes(q)
      );
    }

    const totalLeads = diskLeads.length;
    const newLeads = diskLeads.filter((l) => l.status === 'New').length;
    const contactedLeads = diskLeads.filter((l) => l.status === 'Contacted').length;
    const closedLeads = diskLeads.filter((l) => l.status === 'Closed').length;

    res.json({
      success: true,
      count: filtered.length,
      metrics: { totalLeads, newLeads, contactedLeads, closedLeads },
      data: filtered,
    });
  } catch (error) {
    console.error('Fetch leads error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching leads',
    });
  }
});

// @route   PATCH /api/leads/:id/status
router.patch('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['New', 'Contacted', 'Closed'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(req.params.id)) {
      try {
        const lead = await Lead.findByIdAndUpdate(
          req.params.id,
          { status },
          { new: true, runValidators: true }
        );
        if (lead) {
          return res.json({
            success: true,
            message: `Lead status updated to ${status}`,
            data: lead,
          });
        }
      } catch (e) {}
    }

    const currentLeads = readDiskLeads();
    const idx = currentLeads.findIndex((l) => l._id.toString() === req.params.id.toString());
    if (idx !== -1) {
      currentLeads[idx].status = status;
      writeDiskLeads(currentLeads);
      return res.json({
        success: true,
        message: `Lead status updated to ${status}`,
        data: currentLeads[idx],
      });
    }

    res.status(404).json({ success: false, message: 'Lead not found' });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating lead status',
    });
  }
});

// @route   DELETE /api/leads/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(req.params.id)) {
      try {
        const lead = await Lead.findByIdAndDelete(req.params.id);
        if (lead) {
          return res.json({ success: true, message: 'Lead deleted successfully' });
        }
      } catch (e) {}
    }

    const currentLeads = readDiskLeads();
    const updatedLeads = currentLeads.filter((l) => l._id.toString() !== req.params.id.toString());

    if (updatedLeads.length < currentLeads.length) {
      writeDiskLeads(updatedLeads);
      return res.json({ success: true, message: 'Lead deleted successfully' });
    }

    res.status(404).json({ success: false, message: 'Lead not found' });
  } catch (error) {
    console.error('Delete lead error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting lead',
    });
  }
});

module.exports = router;
