const express = require('express');
const router = express.Router();

const { getPrograms, getProgramDetails } = require('../controllers/getPrograms');
const {getCourses} = require('../controllers/getCourses');

router.get('/', getPrograms); // list all programs
router.get('/:id/courses', getCourses); // courses for program
router.get('/:id', getProgramDetails); // program details for autofill

module.exports = router;
