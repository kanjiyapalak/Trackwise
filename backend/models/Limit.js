const mongoose = require('mongoose');

const limitSchema = new mongoose.Schema({
  website: {
    type: String,
    required: true,
    trim: true
  },
  minutes: {
    type: Number,
    required: true,
    min: 0
  },
  type: {
    type: String,
    enum: ['daily', 'weekly'],
    required: true,
    default: 'daily'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Limit', limitSchema); 