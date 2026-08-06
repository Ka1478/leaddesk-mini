const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const Lead = require('../models/Lead');
const { protect } = require('../middleware/auth');
const { validateLeadSubmission } = require('../middleware/validate');

const dataDir = process.env.VERCEL ? '/tmp' : path.join(__dirname, '../../data');
const leadsStorePath = path.join(dataDir, 'leads_store.json');

// Helper to sync database leads to persistent disk file
async function syncLeadsToDisk() {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const allLeads = await Lead.find({}).sort({ createdAt: -1 });
    fs.writeFileSync(leadsStorePath, JSON.stringify(allLeads, null, 2));
  } catch (err) {
    console.error('Error syncing leads to disk:', err);
  }
}

// Helper to generate unique ticket number
async function generateTicketNo() {
  const count = await Lead.countDocuments();
  const nextNum = 1000 + count + 1;
  return `TK-${nextNum}`;
}

// @route   POST /api/leads
// @desc    Capture new lead (Public)
// @access  Public
router.post('/', validateLeadSubmission, async (req, res) => {
  try {
    const { name, email, budget, message } = req.body;
    const ticketNo = await generateTicketNo();

    const lead = await Lead.create({
      ticketNo,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      budget: budget.trim(),
      message: message.trim(),
      status: 'New',
    });

    await syncLeadsToDisk();

    res.status(201).json({
      success: true,
      message: 'Thank you! Your ticket request has been captured successfully.',
      data: lead,
    });
  } catch (error) {
    console.error('Lead creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while storing ticket submission',
    });
  }
});

// @route   GET /api/leads
// @desc    Get all leads with search and filter (Admin only)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { search, status } = req.query;

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

    const leads = await Lead.find(query).sort({ createdAt: -1 });

    const totalLeads = await Lead.countDocuments();
    const newLeads = await Lead.countDocuments({ status: 'New' });
    const contactedLeads = await Lead.countDocuments({ status: 'Contacted' });
    const closedLeads = await Lead.countDocuments({ status: 'Closed' });

    res.json({
      success: true,
      count: leads.length,
      metrics: {
        totalLeads,
        newLeads,
        contactedLeads,
        closedLeads,
      },
      data: leads,
    });
  } catch (error) {
    console.error('Fetch leads error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching leads',
    });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }
    res.json({ success: true, data: lead });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving lead' });
  }
});

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

    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found',
      });
    }

    await syncLeadsToDisk();

    res.json({
      success: true,
      message: `Lead status updated to ${status}`,
      data: lead,
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating lead status',
    });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const lead = await Lead.findByIdAndDelete(req.params.id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found',
      });
    }

    await syncLeadsToDisk();

    res.json({
      success: true,
      message: 'Lead deleted successfully',
    });
  } catch (error) {
    console.error('Delete lead error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting lead',
    });
  }
});

module.exports = router;
