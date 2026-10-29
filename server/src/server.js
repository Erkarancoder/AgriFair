const http = require('http');
const app = require('./app');
const config = require('./config/env');
const { connectDB } = require('./config/db');
const { autoSeedCommunityMembers } = require('./controllers/community.controller');
const { initSocket } = require('./socket');

const startServer = async () => {
  try {
    await connectDB();
    await autoSeedCommunityMembers();

    const server = http.createServer(app);
    initSocket(server);

    server.listen(config.port, '0.0.0.0', () => {
      console.log(`[AgriFair Server] Running in ${config.nodeEnv} mode on port ${config.port}`);
      console.log(`[AgriFair Server] Health endpoint: http://localhost:${config.port}/api/health`);
      console.log(`[AgriFair Server] Razorpay Gateway: ${config.razorpay.isConfigured ? 'Active (Test Mode)' : 'Not Configured'}`);
    });

    server.on('error', (err) => {
      console.error(`[Server Error] ${err.message}`);
    });

    process.on('SIGINT', () => {
      console.log('\n[Server] Graceful shutdown on SIGINT...');
      server.close(() => process.exit(0));
    });

    process.on('SIGTERM', () => {
      console.log('\n[Server] Graceful shutdown on SIGTERM...');
      server.close(() => process.exit(0));
    });
  } catch (error) {
    console.error(`[Server Fatal Error] Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
