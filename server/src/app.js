const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const config = require('./config/env');
const routes = require('./routes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const path = require('path');

const app = express();

// Security middleware (allow cross-origin images for product listings)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Serve static uploads directory for local product images
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Dynamic CORS to allow any local development port (5173, 5174, 5177, etc.) and configured CLIENT_URL
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const isLocal = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
    if (isLocal || origin === config.clientUrl) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsers - capture rawBody for signature verification (e.g. Razorpay webhooks)
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    }
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// API Routes
app.use('/api', routes);

// 404 & Centralized Error Handlers
app.use(notFound);
app.use(errorHandler);

module.exports = app;
