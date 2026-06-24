require('dotenv').config();
require('express-async-errors');

const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs-extra');
const winston = require('winston');

// Routes
const videoRoutes = require('./routes/video');
const agentRoutes = require('./routes/agent');
const metadataRoutes = require('./routes/metadata');
const musicRoutes = require('./routes/music');
const statusRoutes = require('./routes/status');

// Services
const AgentScheduler = require('./services/AgentScheduler');

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message }) => `[${timestamp}] ${level}: ${message}`)
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: path.join(process.env.LOGS_DIR || './logs', 'server.log') })
  ]
});

global.logger = logger;

const app = express();
const server = http.createServer(app);

// Socket.IO for real-time progress updates
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

global.io = io;

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure directories exist
const dirs = [
  process.env.DOWNLOADS_DIR || './downloads',
  process.env.OUTPUT_DIR || './output',
  process.env.MUSIC_DIR || './music',
  process.env.LOGS_DIR || './logs'
];
dirs.forEach(d => fs.ensureDirSync(d));

// Static file serving for outputs
app.use('/output', express.static(path.resolve(process.env.OUTPUT_DIR || './output')));
app.use('/downloads', express.static(path.resolve(process.env.DOWNLOADS_DIR || './downloads')));

// API Routes
app.use('/api/video', videoRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/metadata', metadataRoutes);
app.use('/api/music', musicRoutes);
app.use('/api/status', statusRoutes);

// Socket.IO connection handler
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);
  socket.on('disconnect', () => logger.info(`Client disconnected: ${socket.id}`));
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error(err.message);
  res.status(500).json({ error: err.message });
});

// Start autonomous agent scheduler
const scheduler = new AgentScheduler();
scheduler.start();

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`🚀 Soccer Agent Backend running on port ${PORT}`);
});

module.exports = { app, io };
