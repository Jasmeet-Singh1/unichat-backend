const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Program = require('../models/program');
const Course = require('../models/course');

connectDB();

setTimeout(async () => {
  try {
    const selectedCourseIds = [
      'BUQU 1130', 'BUQU 1230', 'STAT 1115', 'STAT 2342',
      'INFO 1111', 'INFO 1112', 'INFO 1113', 'INFO 1211',
      'INFO 1212', 'INFO 1213', 'INFO 1214', 'PHIL 1150',
      'BUSI 1110', 'CMNS 1140', 'ENGL 1100', 'INFO 2311',
      'INFO 2312', 'INFO 2313', 'INFO 2315', 'INFO 2411',
      'INFO 2413', 'INFO 2416'
    ];

    const existing = await Course.find({ _id: { $in: selectedCourseIds } });
    const foundIds = existing.map(c => c._id);
    const missing = selectedCourseIds.filter(id => !foundIds.includes(id));

    if (missing.length) {
      console.warn('⚠️ Missing course IDs:', missing);
    }

    const newProgram = new Program({
      type: 'Diploma',
      name: 'Diploma in Information Technology Fundamentals',
      faculty: 'Melville School of Business',
      courses: foundIds
    });

    const saved = await newProgram.save();
    console.log('✅ Program saved:', saved);
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    mongoose.disconnect();
  }
}, 1000);
