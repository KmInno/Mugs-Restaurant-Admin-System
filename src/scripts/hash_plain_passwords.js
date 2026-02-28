const initializeDatabase = require('../config/db');
const bcrypt = require('bcrypt');

async function run() {
  const db = await initializeDatabase();
  try {
    const [rows] = await db.execute('SELECT id, password, email FROM users');
    for (const user of rows) {
      const pwd = user.password || '';
      if (typeof pwd === 'string' && !pwd.startsWith('$2')) {
        const hashed = await bcrypt.hash(pwd, 10);
        await db.execute('UPDATE users SET password = ? WHERE id = ?', [hashed, user.id]);
        console.log(`Hashed password for user id=${user.id} email=${user.email}`);
      } else {
        console.log(`Skipping user id=${user.id} email=${user.email} (already hashed)`);
      }
    }
    console.log('Migration complete');
    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
}

run();
