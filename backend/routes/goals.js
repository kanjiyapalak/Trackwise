const express = require('express');
const router = express.Router();
const Goal = require('../models/Goal');

// Get all goals
router.get('/', async (req, res) => {
  try {
    const goals = await Goal.find();
    res.json(goals);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

// Add a new goal
router.post('/', async (req, res) => {
  try {
    const { website, minutes, type } = req.body;
    if (!website || !minutes || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const goal = new Goal({ website, minutes, type });
    await goal.save();
    res.status(201).json(goal);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add goal' });
  }
});

// Delete a goal by id
router.delete('/:id', async (req, res) => {
  try {
    await Goal.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete goal' });
  }
});

// Update a goal by ID
router.put('/:id', async (req, res) => {
  try {
    const { website, minutes, type } = req.body;
    const { id } = req.params;
    if (!website || !minutes || !type) {
      return res.status(400).json({ error: 'Website, minutes, and type are required.' });
    }
    const updated = await Goal.findByIdAndUpdate(
      id,
      { website, minutes, type },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Goal not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update goal.' });
  }
});

module.exports = router; 