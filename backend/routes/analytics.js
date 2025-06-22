const express = require('express');
const router = express.Router();
const TimeEntry = require('../models/TimeEntry');

const moment = require('moment'); // At the top

router.post('/track', async (req, res) => {
  try {
    const { url, domain, productive, timeSpent } = req.body;
    const timestamp = new Date();
    const date = moment(timestamp).format('YYYY-MM-DD');
    const week = moment(timestamp).format('GGGG-[W]WW');

    // console.log('Saving entry:', { url, domain, productive, timeSpent, timestamp, date, week });

    const entry = new TimeEntry({ url, domain, productive, timeSpent, timestamp, date, week });
    await entry.save();
    res.json({ message: "Data saved!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error saving data" });
  }
});


router.get('/analytics', async (req, res) => {
  const { range } = req.query;

  let filter = {};
  const now = new Date();

  if (range === 'daily') {
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    filter.timestamp = { $gte: startOfDay };
  } else if (range === 'weekly') {
    const startOfWeek = new Date(now);
    const monday = new Date(now);
    const day = now.getDay() || 7; // if Sunday, set to 7
    monday.setDate(now.getDate() - day + 1);
    monday.setHours(0, 0, 0, 0);
    filter.timestamp = { $gte: monday };
  }

  const data = await TimeEntry.find(filter);

  const totalTime = data.reduce((sum, d) => sum + d.timeSpent, 0);
  const productiveTime = data.filter(d => d.productive).reduce((sum, d) => sum + d.timeSpent, 0);
  const unproductiveTime = totalTime - productiveTime;

  const productiveSites = {};
  const unproductiveSites = {};

  data.forEach(entry => {
    if (entry.productive) {
      productiveSites[entry.domain] = (productiveSites[entry.domain] || 0) + entry.timeSpent;
    } else {
      unproductiveSites[entry.domain] = (unproductiveSites[entry.domain] || 0) + entry.timeSpent;
    }
  });

  // Top 5 productive and unproductive sites
  const topProductiveSites = Object.entries(productiveSites)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const topUnproductiveSites = Object.entries(unproductiveSites)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  res.json({
    totalTime,
    productiveTime,
    unproductiveTime,
    productiveSites,
    unproductiveSites,
    entries: data,
    topProductiveSites,
    topUnproductiveSites
  });
});




module.exports = router;
