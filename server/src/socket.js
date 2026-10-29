const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('./config/env');
const User = require('./models/User');

let io = null;

/**
 * Initialize Socket.IO with CORS, cookie/token authentication and event dispatchers
 * @param {import('http').Server} httpServer
 */
const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: [config.clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173', '*'],
      credentials: true
    },
    pingTimeout: 30000,
    pingInterval: 10000
  });

  // Socket Authentication Middleware (graceful so real-time chat never breaks)
  io.use(async (socket, next) => {
    try {
      let token = socket.handshake.auth?.token;

      // Also support cookie extraction if available
      if (!token && socket.handshake.headers?.cookie) {
        const cookies = socket.handshake.headers.cookie.split(';');
        for (const cookie of cookies) {
          const [key, value] = cookie.trim().split('=');
          if (key === 'token' && value) {
            token = decodeURIComponent(value);
            break;
          }
        }
      }

      if (token) {
        try {
          const decoded = jwt.verify(token, config.jwtSecret);
          const user = await User.findById(decoded.id).select('-password');
          if (user && user.status === 'active') {
            socket.user = {
              _id: user._id.toString(),
              name: user.name,
              role: user.role,
              email: user.email
            };
          }
        } catch {
          // Token expired or invalid, continue gracefully
        }
      }

      next();
    } catch {
      next();
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user?._id;
    if (userId) {
      socket.join(`user:${userId}`);
    }

    // Join conversation room immediately for real-time messages & offers
    socket.on('join_conversation', (conversationId, callback) => {
      try {
        if (!conversationId) return;
        socket.join(`conversation:${conversationId}`);
        if (typeof callback === 'function') callback({ success: true });
      } catch (err) {
        console.error('[Socket Join Error]:', err);
        if (typeof callback === 'function') callback({ error: 'Failed to join conversation room' });
      }
    });

    // Leave conversation room
    socket.on('leave_conversation', (conversationId) => {
      if (conversationId) {
        socket.leave(`conversation:${conversationId}`);
      }
    });

    socket.on('disconnect', () => {
      // Handled automatically by Socket.io
    });
  });

  return io;
};

const getIO = () => {
  return io;
};

module.exports = {
  initSocket,
  getIO
};
