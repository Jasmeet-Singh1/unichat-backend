const Program = require('../models/program');

// TO AUTOPOPULATE PROGRAMS IN DROP DOWN MENU FOR USERS TO SELECT
const getPrograms = async (req, res) => {
  try {
    const programs = await Program.find({}, 'name'); // Only return program names for dropdown
    res.status(200).json(programs);
  } catch (error) {
    console.error('Error fetching programs:', error);
    res.status(500).json({ error: 'Failed to fetch programs' });
  }
};

// TO AUTOFILL PROGRAM TYPE AND FACULTY once user selects the program
const getProgramDetails = async (req, res) => {
  try {
    const programId = req.params.id;
    const program = await Program.findById(programId);
    console.log('test', program);
    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }

    res.json(program);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getPrograms,
  getProgramDetails,
};
