const express = require('express');
const router = express.Router();
const Program = require('../models/program');
const Club = require('../models/Club');

router.get('/programs', async (req, res) => {
  try {
    const programs = await Program.find(); // You can `.select('-__v')` if you want
    res.status(200).json(programs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch programs' });
  }
});

router.get('/clubs', async (req, res) => {
  try {
    const clubs = await Club.find();
    res.status(200).json(clubs.map((club) => club._id)); // return just names
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch clubs' });
  }
});

module.exports = router;
