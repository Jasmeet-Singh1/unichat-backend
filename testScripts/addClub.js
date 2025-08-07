const mongoose = require('mongoose');
const connectDB = require('../config/db');
const StudentClub = require('../models/club');

connectDB();

const clubNames = [
  'ASK Club',
  'Bible Study @ Kwantlen',
  'K-Drama Club',
  'Health Science Club',
  'KHRA',
  'KPU Cricket Club',
  'KSA Anime Club',
  'KPU Anthropology Society',
  'KPU Bhangra Club',
  'KPU Music Club',
  'KPU MUN',
  'KPU OTM Club',
  'KPU Pinoy Student Club',
  'KPU Pre-Med Club',
  'KPU Pride Society',
  'Kwantlen Art Collective',
  'Kwantlen Nepalese Student Association',
  'Kwantlen Psychology Society',
  'Kwantlen Gaming Guild',
  'Kwantlen Geographers',
  'Kwantlen IT Club',
  'Kwantlen Sikh Student Association (KSSA)',
  'Muslim Student Association',
  'School Outreach Ministry (SCOM)',
  'The Japan Club',
  'The Kwantlen Creative Writing Guild',
  'The Kwantlen Pageturners',
  'Kwantlen Debate Club',
  'Kwantlen Polytechnic University Marketing Association (KPUMA)',
  'Sustainable Agriculture Student Association',
  'SOCA Club (KPU\'s African & Caribbean Students Association)',
  'Stem Roots Club',
  'Student Entrepreneurs Club',
  'Kwantlen Malayali Club (KMC)',
  'HSA',
  'Barkat',
  'KPU Sustainability Club',
  'KPU Dance Club'
];

const clubs = clubNames.map(name => ({
  _id: name,
  description: '' // You can update descriptions later
}));

StudentClub.insertMany(clubs, { ordered: false })
  .then(() => {
    console.log('✅ Student clubs inserted successfully!');
    mongoose.disconnect();
  })
 .catch(err => {
    if (err.code === 11000) {
      console.warn('⚠️ Some clubs already exist and were skipped.');
    } else {
      console.error('❌ Error inserting clubs:', err.message);
    }
    mongoose.disconnect();
  });