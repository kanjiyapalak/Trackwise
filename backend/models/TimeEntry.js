const mongoose = require('mongoose');

const timeEntrySchema = new mongoose.Schema({
  url: String,
  domain: String,
  productive: Boolean,
  timeSpent: Number,
  timestamp: { type: Date, default: Date.now },
  date: { type: String },
  week: { type: String }
});


module.exports = mongoose.model('TimeEntry', timeEntrySchema);
