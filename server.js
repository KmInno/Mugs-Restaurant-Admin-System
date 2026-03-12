const app = require('./src/app');
const initializeDatabase = require('./src/config/db');

let initialized = false;

module.exports = async (req, res) => {
  try {
    if (!initialized) {
      console.log('🚀 Starting Mugs Restaurant System...');
      await initializeDatabase();
      console.log('✅ Database initialized successfully');
      initialized = true;
    }

    return app(req, res);

  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    res.status(500).send("Server error");
  }
};