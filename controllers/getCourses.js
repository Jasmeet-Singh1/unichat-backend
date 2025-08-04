//-Harleen
const Program = require('../models/program');
require('../models/course'); // Ensure Course schema is registered
//TO AUTOPOPULATE THE COURSES AVAILABLE IN THAT PARTICULAR PROGRAM 

const getCourses = async (req, res) => {
  try {
    const programId = req.params.id;

    const program = await Program.findById(programId).populate({
      path: 'courses',
      select: '_id name'
    });

    if (!program) {
      return res.status(404).json({ error: 'Program not found' });
    }

    res.status(200).json(program.courses);

  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
};

module.exports = getCourses;
