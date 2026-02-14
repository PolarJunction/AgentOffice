const express = require('express');
const path = require('path');

const app = express();
const PORT = 3004;

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Agent status mock data
const agents = [
  { id: 'nova', name: 'Nova', state: 'working', currentTask: 'Processing customer requests', lastActive: new Date().toISOString() },
  { id: 'zero-1', name: 'Zero-1', state: 'idle', currentTask: null, lastActive: new Date().toISOString() },
  { id: 'zero-2', name: 'Zero-2', state: 'working', currentTask: 'Code review', lastActive: new Date().toISOString() },
  { id: 'zero-3', name: 'Zero-3', state: 'idle', currentTask: null, lastActive: new Date().toISOString() },
  { id: 'delta', name: 'Delta', state: 'working', currentTask: 'Running tests', lastActive: new Date().toISOString() },
  { id: 'bestie', name: 'Bestie', state: 'idle', currentTask: null, lastActive: new Date().toISOString() },
  { id: 'dexter', name: 'Dexter', state: 'working', currentTask: 'Data analysis', lastActive: new Date().toISOString() }
];

// Agent status endpoint
app.get('/api/status', (req, res) => {
  res.json({ agents });
});

// Serve index.html at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`AgentOffice server running on port ${PORT}`);
});
