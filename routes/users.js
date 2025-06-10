const express = require('express');
const router = express.Router();

// @route     POST api/users
// @desc      Regiter a user
// @access    Public
router.post('/', (req, res) => {
  res.send('Regiter a user');
});

module.exports = router;
