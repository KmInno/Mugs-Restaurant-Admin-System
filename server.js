const app = require('./src/app');
const initializeDatabase = require('./src/config/db');

let initialized = false;

// Serverless handler for production (Vercel, etc.)
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

// Local development server
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    initializeDatabase().catch(err => {
      console.error('❌ Failed to initialize database:', err);
      process.exit(1);
    });
  });
}