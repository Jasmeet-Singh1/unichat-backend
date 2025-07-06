const bcrypt = require("bcrypt");

async function hashPass(plainTxtPass) {
  const saltRounds = 10;
  return await bcrypt.hash(plainTxtPass, saltRounds);
}

module.exports = hashPass;

//This file defines how the password is hashed. 

/*Salt rounds refer to how storng the hashing is. 
10 is usually used, as it balances security and performance.  */

