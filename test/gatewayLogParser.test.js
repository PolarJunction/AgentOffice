const GatewayLogParser = require('../gatewayLogParser');
const fs = require('fs');
const path = require('path');

describe('GatewayLogParser', () => {
  let parser;
  let testLogFile;

  beforeEach(() => {
    // Create a temporary log file for testing
    testLogFile = path.join(__dirname, 'test.log');
    parser = new GatewayLogParser(testLogFile, {
      pollInterval: 100,
      maxInactiveMs: 1000
    });
  });

  afterEach(() => {
    parser.stop();
    if (fs.existsSync(testLogFile)) {
      fs.unlinkSync(testLogFile);
    }
  });

  describe('Agent initialization', () => {
    it('should initialize all known agents as idle', () => {
      const states = parser.getAgentStates();
      expect(states).toHaveLength(8);
      states.forEach(agent => {
        expect(agent.state).toBe('idle');
      });
    });

    it('should have correct agent names from AGENT_NAME_MAP', () => {
      const states = parser.getAgentStates();
      const agentNames = states.map(s => s.name);
      expect(agentNames).toContain('Nova');
      expect(agentNames).toContain('Zero-1');
      expect(agentNames).toContain('Delta');
    });
  });

  describe('Log parsing - lane enqueue', () => {
    it('should parse enqueue message and extract agent ID', () => {
      const parser = new GatewayLogParser('/fake/path');
      parser._setAgentActive = jest.fn();
      
      parser._processLogEntry('lane enqueue: lane=session:agent:zero:cron:abc123 queueSize=1');
      
      expect(parser._setAgentActive).toHaveBeenCalledWith('zero');
    });

    it('should parse enqueue for different agents', () => {
      const parser = new GatewayLogParser('/fake/path');
      parser._setAgentActive = jest.fn();
      
      parser._processLogEntry('lane enqueue: lane=session:agent:delta:cron:def456 queueSize=2');
      
      expect(parser._setAgentActive).toHaveBeenCalledWith('delta');
    });
  });

  describe('Log parsing - lane task done', () => {
    it('should parse task done message and extract agent ID', () => {
      const parser = new GatewayLogParser('/fake/path');
      parser._setAgentIdle = jest.fn();
      
      parser._processLogEntry('lane task done: lane=session:agent:zero:cron:abc123 durationMs=5000');
      
      expect(parser._setAgentIdle).toHaveBeenCalledWith('zero');
    });
  });

  describe('Agent state transitions', () => {
    it('should set agent to working state', () => {
      parser._setAgentActive('nova');
      const agent = parser.activeAgents.get('nova');
      expect(agent.state).toBe('working');
    });

    it('should set agent to idle state', () => {
      parser._setAgentActive('nova');
      parser._setAgentIdle('nova');
      const agent = parser.activeAgents.get('nova');
      expect(agent.state).toBe('idle');
    });

    it('should normalize agent ID by stripping -cron suffix', () => {
      parser._setAgentActive('zero-cron-abc123');
      const agent = parser.activeAgents.get('zero');
      expect(agent.state).toBe('working');
    });
  });

  describe('Inactive agent cleanup', () => {
    it('should set working agents to idle after maxInactiveMs', (done) => {
      // Set agent to working with old timestamp
      const agent = parser.activeAgents.get('nova');
      agent.state = 'working';
      agent.lastActive = new Date(Date.now() - 2000).toISOString();

      // Use very short maxInactiveMs for test
      const quickParser = new GatewayLogParser(testLogFile, {
        pollInterval: 50,
        maxInactiveMs: 10
      });

      quickParser.activeAgents.set('nova', agent);
      quickParser.start();

      setTimeout(() => {
        const states = quickParser.getAgentStates();
        const nova = states.find(a => a.id === 'nova');
        expect(nova.state).toBe('idle');
        quickParser.stop();
        done();
      }, 100);
    });
  });

  describe('getAgentStates', () => {
    it('should return array of all agent states', () => {
      const states = parser.getAgentStates();
      expect(Array.isArray(states)).toBe(true);
      expect(states.length).toBeGreaterThan(0);
    });

    it('should return agent objects with required properties', () => {
      const states = parser.getAgentStates();
      states.forEach(agent => {
        expect(agent).toHaveProperty('id');
        expect(agent).toHaveProperty('name');
        expect(agent).toHaveProperty('state');
        expect(agent).toHaveProperty('lastActive');
      });
    });
  });
});
