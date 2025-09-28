// hash.js
const bcrypt = require('bcryptjs');

const password = process.argv[2] || 'MiPass123!'; // puedes pasar la contraseña por argumento
const saltRounds = 10;

bcrypt.hash(password, saltRounds)
  .then(hash => {
    console.log('Password (plain):', password);
    console.log('Hash (bcrypt):', hash);
  })
  .catch(err => {
    console.error('Error hashing:', err);
  });
