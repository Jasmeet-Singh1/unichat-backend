const express = require('express');
const router = express.Router();
const getClubs = require('../controllers/getClubs');

router.get('/', getClubs);

module.exports = router;
