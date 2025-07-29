const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Course = require('../models/course'); // 🔧 Capitalize for model consistency

connectDB();

const courses = [
 { _id: 'HOPS 1100', name: 'Introduction to Brewing' },
  { _id: 'HOPS 1105', name: 'Brewing 1' },
  { _id: 'HOPS 1110', name: 'Beer Sensory Evaluation' },
  { _id: 'HOPS 1205', name: 'Brewing 2' },
  { _id: 'HOPS 1211', name: 'Brewing Microbiology' },
  { _id: 'HOPS 1212', name: 'Brewing Chemistry' },
  { _id: 'HOPS 1213', name: 'Brewing Equipment and Technology' },
  { _id: 'HOPS 1214', name: 'Introduction to Cellaring and Packaging' },

  // Brewing Electives (Select two)
  { _id: 'CBSY 1110', name: 'Business Problem Solving with Spreadsheets' },
  { _id: 'CMNS 1140', name: 'Introduction to Professional Communication' },
  { _id: 'HIST 2308', name: 'Brewing History: Fermentations from Beer to Distilling in Global History & Cultures' },
  { _id: 'PHIL 3033', name: 'Business Ethics' },

  // Educational Assistant Program (EDAS) Courses
  { _id: 'EDAS 1101', name: 'Including Diverse Learners in Schools' },
  { _id: 'EDAS 1105', name: 'Supporting Learning in Schools' },
  { _id: 'EDAS 1120', name: 'Introduction to Practice and Positive Behaviour Support' },
  { _id: 'EDAS 1131', name: 'Interpersonal Communications' },
  { _id: 'EDAS 1225', name: 'Alternative and Augmentative Communication' },
  { _id: 'EDAS 1271', name: 'Practicum One' },
  { _id: 'EDAS 1282', name: 'Social and Emotional Learning and Mental Health in K - 12 Schools' },
  { _id: 'EDAS 1305', name: 'Overview of Curriculum for Inclusive Schools' },
  { _id: 'EDAS 1371', name: 'Practicum Two' },
  { _id: 'EDAS 2121', name: 'Supporting Students with Autism Spectrum Disorders' },

  // EDAS Select one
  { _id: 'ENGL 1100', name: 'Introduction to University Writing 1' },
  { _id: 'ENGL 1104', name: 'Reading and Writing Skills for Educational Assistants 1' },
  // CMNS 1140 already added above

  // EDAS Select either/or both options
  { _id: 'EDAS 1163', name: 'Themes in Child and Adolescent Development' },
  { _id: 'PSYC 2320', name: 'Developmental Psychology: Childhood 2' },
  { _id: 'PSYC 3321', name: 'Developmental Psychology: Adolescence 2' },

  // Engineering Term 1
  { _id: 'APSC 1124', name: 'Introduction to Engineering' },
  { _id: 'APSC 1151', name: 'Introduction to Engineering Graphics' },
  { _id: 'CHEM 1154', name: 'Chemistry for Engineering' },
  { _id: 'CPSC 1103', name: 'Principles of Program Structure and Design I' },
  // ENGL 1100 already added
  { _id: 'MATH 1120', name: 'Differential Calculus' },
  { _id: 'PHYS 1120', name: 'Physics for Physical and Applied Sciences I' },

  // Engineering Term 2
  { _id: 'APSC 1299', name: 'Introduction to Microcontrollers' },
  { _id: 'MATH 1152', name: 'Matrix Algebra for Engineers' },
  { _id: 'MATH 1220', name: 'Integral Calculus' },
  { _id: 'PHYS 1170', name: 'Mechanics I' },
  { _id: 'PHYS 1220', name: 'Physics for Physical and Applied Sciences II' }
];

Course.insertMany(courses, { ordered: false }) // skips duplicates
  .then(() => {
    console.log('✅ Interior Design courses inserted successfully (duplicates skipped)');
    mongoose.disconnect();
  })
  .catch((err) => {
    console.error('⚠️ Some courses were skipped due to duplication', err);
    mongoose.disconnect();
  });
