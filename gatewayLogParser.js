/**
 * Gateway Log Parser for AgentOffice
 * 
 * Parses OpenClaw gateway logs to detect active agent sessions.
 * Monitors the log file for lane enqueue/dequeue and task done events.
 */

const fs = require('fs');
const path = require('path');

// Map of known agent IDs to AgentOffice character names
const AGENT_NAME_MAP = {
  'nova': 'Nova',
  'zero': 'Zero-1',
  'zero-2': 'Zero-2',
  'zero-3': 'Zero-3',
  'delta': 'Delta',
  'bestie': 'Bestie',
  'dexter': 'Dexter',
  'flash': 'Flash'
};

class GatewayLogParser {
  constructor(logPath, options = {}) {
    this.logPath = logPath;
    this.options = {
      pollInterval: options.pollInterval || 2000,
      maxInactiveMs: options.maxInactiveMs || 300000 // 5 minutes
    };

    this.activeAgents = new Map(); // agentId -> { state, lastActive, task }
    this.position = 0;
    this.running = false;
    this.timer = null;

    // Agent statistics tracking
    this.agentStats = new Map(); // agentId -> Stats object

    // Initialize with all known agents as idle
    this._initializeAgents();
    this._initializeStats();
  }

  _initializeStats() {
    for (const [id, name] of Object.entries(AGENT_NAME_MAP)) {
      this.agentStats.set(id, {
        id: id,
        name: name,
        tasksCompleted: 0,
        currentStreak: 0,
        bestStreak: 0,
        timeWorkedToday: 0, // in seconds
        favoriteActivity: null,
        activityCounts: {},

        lastTaskStart: null,
        workStartTime: null
      });
    }
  }

  _initializeAgents() {
    for (const [id, name] of Object.entries(AGENT_NAME_MAP)) {
      this.activeAgents.set(id, {
        id: id,
        name: name,
        state: 'idle',
        currentTask: null,
        lastActive: new Date().toISOString()
      });
    }
  }

  /**
   * Start monitoring the log file
   */
  start() {
    if (this.running) return;

    // Get initial file size
    if (fs.existsSync(this.logPath)) {
      const stats = fs.statSync(this.logPath);
      this.position = stats.size;
    }

    this.running = true;
    this._poll();
  }

  /**
   * Stop monitoring
   */
  stop() {
    this.running = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  /**
   * Update log path and reset position to start reading from beginning
   */
  updateLogPath(newPath) {
    this.logPath = newPath;
    this.position = 0;
    console.log(`Log parser updated to monitor: ${newPath}`);
  }

  /**
   * Poll the log file for new entries
   */
  _poll() {
    if (!this.running) return;

    try {
      this._checkForNewEntries();
    } catch (err) {
      console.error('Error parsing gateway logs:', err.message);
    }

    // Clean up inactive agents
    this._cleanupInactiveAgents();

    this.timer = setTimeout(() => this._poll(), this.options.pollInterval);
  }

  /**
   * Check for new log entries and parse them
   */
  _checkForNewEntries() {
    if (!fs.existsSync(this.logPath)) return;

    const stats = fs.statSync(this.logPath);

    // Log file was rotated
    if (stats.size < this.position) {
      this.position = 0;
    }

    if (stats.size === this.position) return;

    // Read new content
    const stream = fs.createReadStream(this.logPath, {
      start: this.position,
      end: stats.size
    });

    let buffer = '';

    stream.on('data', (chunk) => {
      buffer += chunk.toString();
    });

    stream.on('end', () => {
      this.position = stats.size;
      this._parseLogBuffer(buffer);
    });
  }

  /**
   * Parse the log buffer for agent events
   */
  _parseLogBuffer(buffer) {
    const lines = buffer.split('\n');

    for (const line of lines) {
      if (!line.trim()) continue;

      // Parse JSON log lines
      try {
        const entry = JSON.parse(line);
        if (entry._meta?.path?.method === 'logToFile') {
          const message = entry[1];
          this._processLogEntry(message);
        }
      } catch (e) {
        // Not JSON, try to parse as text
        this._processLogEntry(line);
      }
    }
  }

  /**
   * Process a single log entry
   */
  _processLogEntry(message) {
    if (!message) return;

    // lane enqueue: lane=session:agent:zero:cron:abc... queueSize=1
    const enqueueMatch = message.match(/lane enqueue: lane=session:agent:(\w+)/);
    if (enqueueMatch) {
      const agentId = enqueueMatch[1];
      this._setAgentActive(agentId);
      return;
    }

    // lane task done: lane=session:agent:zero:cron:abc... durationMs=12345
    const taskDoneMatch = message.match(/lane task done: lane=session:agent:(\w+)/);
    if (taskDoneMatch) {
      const agentId = taskDoneMatch[1];
      this._setAgentIdle(agentId);
      return;
    }

    // Also check for cron lane events (main cron job)
    if (message.includes('lane enqueue: lane=cron')) {
      // The cron job is running - this is the main agent orchestrator
      this._setAgentActive('cron');
    }
  }

  /**
   * Set an agent as active (working)
   */
  _setAgentActive(agentId, taskName = null) {
    // Normalize agent ID (e.g., strip -cron suffix)
    const normalizedId = agentId.replace(/-cron.*$/, '');

    const agent = this.activeAgents.get(normalizedId);
    if (agent) {
      agent.state = 'working';
      agent.currentTask = taskName;
      agent.lastActive = new Date().toISOString();

      // Track work start time
      const stats = this.agentStats.get(normalizedId);
      if (stats) {
        stats.lastTaskStart = new Date();
        if (!stats.workStartTime) {
          stats.workStartTime = new Date();
        }
      }
    }
  }

  /**
   * Set an agent as idle (task completed)
   */
  _setAgentIdle(agentId, taskName = null) {
    const normalizedId = agentId.replace(/-cron.*$/, '');

    const agent = this.activeAgents.get(normalizedId);
    if (agent) {
      agent.state = 'idle';
      agent.currentTask = null;
      agent.lastActive = new Date().toISOString();

      // Update stats on task completion
      this._recordTaskCompletion(normalizedId, taskName);
    }
  }

  /**
   * Record task completion and update stats
   */
  _recordTaskCompletion(agentId, taskName) {
    const stats = this.agentStats.get(agentId);
    if (!stats) return;

    // Increment task count
    stats.tasksCompleted++;

    // Update streak
    stats.currentStreak++;
    if (stats.currentStreak > stats.bestStreak) {
      stats.bestStreak = stats.currentStreak;
    }

    // Track time worked
    if (stats.lastTaskStart) {
      const duration = (Date.now() - stats.lastTaskStart.getTime()) / 1000;
      stats.timeWorkedToday += duration;
    }

    // Track favorite activity
    if (taskName) {
      stats.activityCounts[taskName] = (stats.activityCounts[taskName] || 0) + 1;

      // Update favorite activity
      let maxCount = 0;
      for (const [activity, count] of Object.entries(stats.activityCounts)) {
        if (count > maxCount) {
          maxCount = count;
          stats.favoriteActivity = activity;
        }
      }
    }



    // Reset for next task
    stats.lastTaskStart = null;
  }



  /**
   * Clean up agents that haven't been active recently
   */
  _cleanupInactiveAgents() {
    const now = Date.now();

    for (const [id, agent] of this.activeAgents) {
      const lastActive = new Date(agent.lastActive).getTime();
      if (now - lastActive > this.options.maxInactiveMs && agent.state === 'working') {
        agent.state = 'idle';
        agent.currentTask = null;
      }
    }
  }

  /**
   * Get current agent states
   */
  getAgentStates() {
    return Array.from(this.activeAgents.values()).map(agent => ({
      id: agent.id,
      name: agent.name,
      state: agent.state,
      currentTask: agent.currentTask,
      lastActive: agent.lastActive
    }));
  }

  /**
   * Get agent statistics
   */
  getAgentStats() {
    return Array.from(this.agentStats.values());
  }

  /**
   * Get stats for a specific agent
   */
  getAgentStatsById(agentId) {
    return this.agentStats.get(agentId);
  }
}

module.exports = GatewayLogParser;
