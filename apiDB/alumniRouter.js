const express = require('express');
const router = express.Router();
const alumniController = require('./alumniController');

router.get('/', alumniController.getAllAlumni);
router.get('/:id', alumniController.getAlumniById);

module.exports = router;
