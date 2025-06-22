const mongoose = require('mongoose');

const usageSchema = new mongoose.Schema({
  website: { type: String, required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  seconds: { type: Number, default: 0 }
});

// Create a compound index to ensure one entry per website per day
usageSchema.index({ website: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Usage', usageSchema); 