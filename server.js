const express = require('express');
const path = require('path');
const GatewayLogParser = require('./gatewayLogParser');

const app = express();
const PORT = 3004;

// Gateway log file path
const LOG_PATH = process.env.OPENCLAW_LOG_PATH || '/tmp/openclaw/openclaw-2026-02-14.log';

// Initialize gateway log parser
const logParser = new GatewayLogParser(LOG_PATH, {
  pollInterval: 2000,
  maxInactiveMs: 60000 // 1 minute
});

// Start parsing
logParser.start();

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Agent status endpoint - returns real-time agent states from gateway logs
app.get('/api/status', (req, res) => {
  const agents = logParser.getAgentStates();
  res.json({ 
    agents,
    timestamp: new Date().toISOString(),
    source: 'gateway-log-parser'
  });
});

// Serve index.html at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logParser.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  logParser.stop();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`AgentOffice server running on port ${PORT}`);
  console.log(`Gateway log parser active, monitoring: ${LOG_PATH}`);
});
