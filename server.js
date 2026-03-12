const app = require('./src/app');
const initializeDatabase = require('./src/config/db');

(async () => {
  try {
    console.log('🚀 Starting Mugs Restaurant System...');
    await initializeDatabase();
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize database:', error.message);
    console.error('⚠️  Server startup failed. Please check:');
    console.error('   1. Environment variables are set correctly');
    console.error('   2. Database server is accessible');
    console.error('   3. Credentials are correct');
    process.exit(1);
  }

  const PORT = process.env.PORT || 3000;

  app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
  });
})();
