 const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  website: { type: String, required: true },
  minutes: { type: Number, required: true },
  type: { type: String, enum: ['daily', 'weekly'], required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Goal', goalSchema); 