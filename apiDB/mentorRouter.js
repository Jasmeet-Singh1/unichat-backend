const express = require("express");
const router = express.Router();
const {
  getAllMentors,
  getMentorByIdentifier,
} = require("./mentorController");

router.get("/", getAllMentors);                // GET /api/mentors
router.get("/search", getMentorByIdentifier);  // GET /api/mentors/search?email=... OR ?username=...

module.exports = router;
