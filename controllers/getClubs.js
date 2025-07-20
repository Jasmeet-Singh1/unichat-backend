const StudentClub = require('../models/club');

const getStudentClubs = async (req, res) => {
    try {
        const clubs = await StudentClub.find({}, '_id');
        res.status(200).json(clubs);
    } 
    
    catch (error) {
        console.error('Error fetching student clubs:', error);
        res.status(500).json({ error: 'Failed to fetch student clubs' });
    }
};

module.exports = getStudentClubs;