const express = require('express');
const router = express.Router();
const { approveMentor, rejectMentor,getPendingMentors, getMentorById } = require('../controllers/approvalEmail');

// Approve mentor
router.put('/mentors/:id/approve', approveMentor);

// Reject mentor - expect { reason } in body
router.put('/mentors/:id/reject', rejectMentor);

// Get all mentors pending approval
router.get('/pending', getPendingMentors);

// Get mentor details by ID
router.get('/:id', getMentorById);
module.exports = router;
