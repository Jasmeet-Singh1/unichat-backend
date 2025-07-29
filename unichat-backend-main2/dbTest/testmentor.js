const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Mentor = require('../models/mentor');

connectDB();

async function testMentor() {
  try {
    const testMentor = new Mentor({
      firstName: "Dmitry",
      lastName: "",
      role: "Mentor",
      username: "Dmitry98",
      email: "dmitry@student.kpu.ca",
      password: "Strong@123",
      programType: "Bachelor",
      program: "IT",
      courseExpertise: [{
        courseCode: "INFO1111",
        courseName: "Intro to IT",
        topicsCovered: ["Networking"],
        instructor: "Dr. Smith",
        grade: "A+"
      }],
      mentorshipAreas: [{
        courseCode: "INFO1212",
        courseName: "Security",
        topicsCovered: ["Ethical Hacking"],
        instructor: "Prof. Kumar",
        proficiency: "Expert"
      }],
      availability: [{
        day: "Monday",
        from: { hour: 10, minute: 0, ampm: "AM" },
        to: { hour: 12, minute: 0, ampm: "PM" }
      }],
      proof: ["proof1.pdf"],
      overallGPA: 3.9,
      showGPA: true,
      updateGpaReq: {
        requested: false,
        message: "",
        proofFiles: ["gpa.pdf"]
      },
      bio: "Excited to help students!",
      interests: ["Networking", "Cloud"]
    });

    const saved = await testMentor.save();
    console.log("✅ Mentor saved:", saved.fullName);
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    mongoose.connection.close();
  }
}

testMentor();
