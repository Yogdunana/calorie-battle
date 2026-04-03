const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');

const config = require('./config/index');
const routes = require('./routes/index');
const errorHandler = require('./middleware/errorhandler');
const { rateLimiter } = require('./middleware/rateLimiter');
const { startJobs } = require('./jobs/index');

const app = express();

// Security
app.use(helmet());

// CORS - restrict in production
const corsOrigins = config.isProd
  ? ['http://101.237.129.33:8080', 'http://localhost:8080', 'http://localhost:5173']
  : true;

app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Logging
if (config.isDev) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// XSS sanitization (after body parsing, before routes)
const { sanitizeAll } = require('./middleware/sanitize');
app.use(sanitizeAll);

// Cookie parser
app.use(cookieParser());

// Rate limiting
app.use(rateLimiter);

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API routes
app.use('/api/v1', routes);

// Error handler (must be last)
app.use(errorHandler);

// Start cron jobs
startJobs();

module.exports = app;
