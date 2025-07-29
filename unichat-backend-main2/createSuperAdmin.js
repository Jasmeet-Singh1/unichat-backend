const mongoose = require("mongoose");
const config = require("config");
const Admin = require("./models/admin");

async function createSuperAdmin() {
  try {
    await mongoose.connect(config.get("mongoURI"));
    console.log("Connected to MongoDB");

    const email = "devteam.unichat@gmial.com";

    // Check if super admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      console.log("Super Admin already exists:", existingAdmin.username);
      return process.exit(0);
    }

    // Create super admin - password will be hashed by pre-save middleware
    const superAdmin = new Admin({
      firstName: "Dev",
      lastName: "Team",
      email,
      password: "Devlop$Team6", // must satisfy your schema validation
      role: "Super Admin"
    });

    await superAdmin.save();

    console.log("✅ Super Admin created with username:", superAdmin.username);
    process.exit(0);

  } catch (error) {
    console.error("❌ Error creating super admin:", error.message);
    process.exit(1);
  }
}

createSuperAdmin();
