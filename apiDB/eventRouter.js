const express = require("express");
const router = express.Router();
const { createEvent, getEvents, registerEvent } = require("./eventController");

router.post("/", createEvent);
router.get("/", getEvents);
router.post("/:id/register", registerEvent);

module.exports = router;