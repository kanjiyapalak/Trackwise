const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/productivity', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

// API routes
const analyticsRoutes = require('./routes/analytics');
const goalsRoutes = require('./routes/goals');
const limitsRoutes = require('./routes/limits');
app.use('/api', analyticsRoutes);
app.use('/api/goals', goalsRoutes);
app.use('/api/limits', limitsRoutes);

// Serve frontend
app.use(express.static(path.join(__dirname, 'public')));

// Fallback route for SPA frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
