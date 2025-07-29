const mongoose = require('mongoose');
const connectDB = require('../config/db'); // or update the path if needed
const Alumni = require('../models/alumni'); // adjust path if different

connectDB(); // Make sure this connects to the correct DB

async function testAlumni() {
  try {
    const newAlumni = new Alumni({
      firstName: "Neha",
      lastName: "Kapoor",
      username: "neha.kapoor",
      email: "neha@student.kpu.ca",
      password: "Strong@123",
      role: "Alumni",
      gradDate: new Date('2023-06-15'),
      programType: "Bachelor",
      program: "Computer Science",
      currentJob: {
        companyName: "TechNova",
        jobTitle: "Software Engineer",
        startDate: new Date("2023-08-01"),
        isPresent: true
      },
      proof: ["degree_certificate.pdf"]
    });

    const savedAlumni = await newAlumni.save();
    console.log("✅ Alumni saved:", savedAlumni.fullName);
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    mongoose.connection.close();
  }
}

testAlumni();
