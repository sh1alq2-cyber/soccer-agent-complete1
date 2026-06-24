const express = require('express');
const router = express.Router();
const AgentService = require('../services/AgentService');
const TrendService = require('../services/TrendService');

// GET /api/agent/status
router.get('/status', (req, res) => {
  res.json(AgentService.getStatus());
});

// POST /api/agent/start — start autonomous loop
router.post('/start', (req, res) => {
  AgentService.start();
  res.json({ message: 'Autonomous agent started' });
});

// POST /api/agent/stop
router.post('/stop', (req, res) => {
  AgentService.stop();
  res.json({ message: 'Autonomous agent stopped' });
});

// POST /api/agent/run-now — trigger one cycle immediately
router.post('/run-now', async (req, res) => {
  res.json({ message: 'Agent cycle triggered', status: 'running' });
  AgentService.runCycle();
});

// GET /api/agent/trends — get current trending soccer topics
router.get('/trends', async (req, res) => {
  const trends = await TrendService.getSoccerTrends();
  res.json(trends);
});

// GET /api/agent/logs — recent agent logs
router.get('/logs', (req, res) => {
  const logs = AgentService.getRecentLogs();
  res.json(logs);
});

module.exports = router;
