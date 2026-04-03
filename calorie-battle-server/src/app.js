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

// CORS
app.use(cors({
  origin: true,
  credentials: true,
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
