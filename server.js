const express = require('express');
const path = require('path');
const fs = require('fs');
const GatewayLogParser = require('./gatewayLogParser');

const app = express();
const PORT = 3004;

// Gateway log file path - support dynamic date or env var
function getLogPath() {
  if (process.env.OPENCLAW_LOG_PATH) {
    return process.env.OPENCLAW_LOG_PATH;
  }
  // Default: use today's date
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `/tmp/openclaw/openclaw-${year}-${month}-${day}.log`;
}

const LOG_PATH = getLogPath();

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

// Agent stats endpoint - returns agent statistics
app.get('/api/stats', (req, res) => {
  const agentId = req.query.agentId;
  let stats;
  
  if (agentId) {
    stats = logParser.getAgentStatsById(agentId);
    if (!stats) {
      return res.status(404).json({ error: 'Agent not found' });
    }
  } else {
    stats = logParser.getAgentStats();
  }
  
  res.json({ 
    stats,
    timestamp: new Date().toISOString()
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

  // Check if log file exists and warn if not
  if (!fs.existsSync(LOG_PATH)) {
    console.warn(`WARNING: Log file not found at ${LOG_PATH}`);
    console.warn('Agent status updates will show agents as idle until gateway logs appear');

    // Try to find any recent log file
    const logDir = path.dirname(LOG_PATH);
    if (fs.existsSync(logDir)) {
      const files = fs.readdirSync(logDir)
        .filter(f => f.startsWith('openclaw-') && f.endsWith('.log'))
        .sort()
        .reverse();
      if (files.length > 0) {
        console.log(`Found alternative log file: ${path.join(logDir, files[0])}`);
      }
    }
  }
});
