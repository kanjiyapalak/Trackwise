const express = require('express');
const router = express.Router();
const Limit = require('../models/Limit');
const TimeEntry = require('../models/TimeEntry');
const Usage = require('../models/Usage');

// Get all limits based on type
router.get('/', async (req, res) => {
  const { range } = req.query;
  const filter = range ? { type: range } : {};
  const limits = await Limit.find(filter);
  res.json(limits);
});

// Set or update a limit
router.post('/', async (req, res) => {
  try {
    const { website, minutes, type } = req.body;
    if (!website || !minutes || !type) {
      return res.status(400).json({ error: 'Website, minutes, and type are required.' });
    }
    let limit = await Limit.findOne({ website, type });
    if (limit) {
      limit.minutes = minutes;
    } else {
      limit = new Limit({ website, minutes, type });
    }
    await limit.save();
    res.status(201).json(limit);
  } catch (err) {
    console.error('Failed to save limit:', err);
    res.status(500).json({ error: 'Failed to save limit.' });
  }
});

// GET usage for dashboard cards (Uses TimeEntry for accuracy)
router.get('/usage/:website', async (req, res) => {
  const { website } = req.params;
  const { type } = req.query; // 'daily' or 'weekly'

  try {
    let totalSeconds = 0;
    const now = new Date();

    if (type === 'daily') {
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      const entries = await TimeEntry.find({ domain: website, timestamp: { $gte: startOfDay } });
      totalSeconds = entries.reduce((sum, entry) => sum + entry.timeSpent, 0);
    } else if (type === 'weekly') {
      const startOfWeek = new Date(now);
      const day = now.getDay() || 7;
      startOfWeek.setDate(now.getDate() - day + 1);
      startOfWeek.setHours(0, 0, 0, 0);
      const entries = await TimeEntry.find({ domain: website, timestamp: { $gte: startOfWeek } });
      totalSeconds = entries.reduce((sum, entry) => sum + entry.timeSpent, 0);
    }
    res.json({ seconds: totalSeconds });
  } catch (err) {
    console.error('Failed to get usage:', err);
    res.status(500).json({ error: 'Failed to get usage.' });
  }
});

// POST usage from extension (Updates Usage model)
router.post('/usage', async (req, res) => {
  const { website, seconds } = req.body;
  const today = new Date().toISOString().slice(0, 10);
  try {
    await Usage.findOneAndUpdate(
      { website, date: today },
      { $inc: { seconds: seconds } },
      { upsert: true, new: true }
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Failed to post usage:', err);
    res.status(500).json({ error: 'Failed to post usage.' });
  }
});

// GET status for blocking page (Uses TimeEntry for accuracy)
router.get('/status/:domain', async (req, res) => {
  try {
    const { domain } = req.params;
    const now = new Date();
    let shouldBlock = false;

    const dailyLimit = await Limit.findOne({ website: domain, type: 'daily' });
    if (dailyLimit) {
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      const entries = await TimeEntry.find({ domain, timestamp: { $gte: startOfDay } });
      const total = entries.reduce((sum, e) => sum + e.timeSpent, 0);
      if (total >= dailyLimit.minutes * 60) shouldBlock = true;
    }

    if (!shouldBlock) {
      const weeklyLimit = await Limit.findOne({ website: domain, type: 'weekly' });
      if (weeklyLimit) {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - (now.getDay() || 7) + 1);
        startOfWeek.setHours(0, 0, 0, 0);
        const entries = await TimeEntry.find({ domain, timestamp: { $gte: startOfWeek } });
        const total = entries.reduce((sum, e) => sum + e.timeSpent, 0);
        if (total >= weeklyLimit.minutes * 60) shouldBlock = true;
      }
    }
    res.json({ shouldBlock });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a limit
router.delete('/', async (req, res) => {
  const { website, type } = req.body;
  const filter = { website };
  if (type) filter.type = type;
  await Limit.deleteOne(filter);
  res.json({ success: true });
});

module.exports = router; 