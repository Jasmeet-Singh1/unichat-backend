const bcrypt = require('bcrypt');

const hashPass = async (plainPassword) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(plainPassword, salt);
};

module.exports = hashPass;


//This file defines how the password is hashed. 

/*Salt rounds refer to how storng the hashing is. 
10 is usually used, as it balances security and performance.  */

