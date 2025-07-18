const bcrypt = require('bcrypt');

const plainPassword = "YourPass123!";
const hashedPassword = "$2b$10$U49MRR8C/q02h6rU3pB5BuHdwErwy.qRX5MEOg1zYEfMJ1r2mZLlm"; // paste from your DB

bcrypt.compare(plainPassword, hashedPassword)
  .then(result => {
    console.log("Do they match?", result); // should print: true
  })
  .catch(err => {
    console.error("Error comparing:", err);
  });
