const Mentor = require('../models/mentor');

// Get all mentors pending approval
const getPendingMentors = async (req, res) => {
    try {
        const pendingMentors = await Mentor.find({ isPendingApproval: true });
        res.status(200).json(pendingMentors);
    } 
    catch (error) {
        console.error('Error fetching pending mentors:', error);
        res.status(500).json({ error: 'Server error fetching pending mentors' });
    }
};
// Get details of one mentor by ID
const getMentorById = async (req, res) => {
    try {
        const mentor = await Mentor.findById(req.params.id);
        if (!mentor) return res.status(404).json({
             error: 'Mentor not found' 
        });
        res.status(200).json(mentor);
    } 
    catch (error) {
        console.error('Error fetching mentor details:', error);
        res.status(500).json({ error: 'Server error fetching mentor details' });
    }
};

// Approve or reject mentor
const updateMentorApproval = async (req, res) => {
    try {
        const { approve } = req.body; // true or false
        const mentor = await Mentor.findById(req.params.id);
        if (!mentor) return res.status(404).json({ error: 'Mentor not found' });

        if (approve === true) {
            mentor.isApproved = true;
            mentor.isPendingApproval = false;
        } 
        else {
            // For rejection, you might set isApproved false and maybe do something else
            mentor.isApproved = false;
            mentor.isPendingApproval = false;
        }

        await mentor.save();
        res.status(200).json({ message: `Mentor has been ${approve ? 'approved' : 'rejected'}.` });
    } 
    catch (error) {
        console.error('Error updating mentor approval:', error);
        res.status(500).json({ error: 'Server error updating mentor approval' });
    }
};

module.exports = {
  getPendingMentors,
  getMentorById
};
