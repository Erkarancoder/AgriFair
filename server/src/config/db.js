const dns = require('dns');
const mongoose = require('mongoose');
const config = require('./env');

// Configure reliable DNS servers to prevent Windows querySrv ECONNREFUSED with Atlas
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch {
  // Ignore in environments where setting DNS servers is restricted
}

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongodbUri);
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[Database Error] Failed to connect to MongoDB: ${error.message}`);
    throw error;
  }
};

const getDBStatus = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  const stateCode = mongoose.connection.readyState;
  return {
    stateCode,
    status: states[stateCode] || 'unknown',
    host: mongoose.connection.host || null,
    name: mongoose.connection.name || null
  };
};

module.exports = {
  connectDB,
  getDBStatus
};
