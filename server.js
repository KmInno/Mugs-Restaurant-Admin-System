const app = require('./src/app');
const initializeDatabase = require('./src/config/db');

(async () => {
  try {
    await initializeDatabase();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }

  const PORT = 3000;

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
})();
