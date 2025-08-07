const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Program = require('../models/program');
const Course = require('../models/course');

connectDB();

setTimeout(async () => {
  try {
    const edAssistantCourseIds = [
      'EDAS 1101',
      'EDAS 1105',
      'EDAS 1120',
      'EDAS 1131',
      'EDAS 1225',
      'EDAS 1271',
      'EDAS 1282',
      'EDAS 1305',
      'EDAS 1371',
      'EDAS 2121',
      // Select one of the following (choose at least one)
      'ENGL 1100',
      'ENGL 1104',
      'CMNS 1140',
      // Select either or both of the following
      'EDAS 1163',
      'PSYC 2320',
      'PSYC 3321'
    ];

    const edAssistantCourses = await Course.find({ _id: { $in: edAssistantCourseIds } });
    const foundEdAssistantIds = edAssistantCourses.map(c => c._id);

    const edAssistantProgram = new Program({
      type: 'Certificate',
      name: 'Certificate in Education Assistant',
      faculty: 'Faculty of Arts',
      courses: foundEdAssistantIds
    });

    await edAssistantProgram.save();
    console.log('✅ Certificate in Education Assistant program added');

  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    mongoose.disconnect();
  }
}, 1000);
