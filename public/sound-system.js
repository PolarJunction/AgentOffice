// AgentOffice Sound System - Phase 8
// Uses Web Audio API for programmatic sound generation

const SoundManager = {
  audioContext: null,
  masterGain: null,
  enabled: false,
  volume: 0.5,
  ambientOscillators: [],
  ambientGain: null,
  
  // Initialize audio context on first user interaction
  init() {
    if (this.audioContext) return;
    
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.masterGain.gain.value = this.volume;
      
      // Create ambient gain node
      this.ambientGain = this.audioContext.createGain();
      this.ambientGain.connect(this.masterGain);
      this.ambientGain.gain.value = 0;
      
      console.log('SoundManager initialized');
    } catch (e) {
      console.warn('Web Audio API not supported:', e);
    }
  },
  
  // Toggle sound on/off
  toggle() {
    this.init();
    this.enabled = !this.enabled;
    return this.enabled;
  },
  
  // Set volume (0-1)
  setVolume(value) {
    this.volume = Math.max(0, Math.min(1, value));
    if (this.masterGain) {
      this.masterGain.gain.value = this.volume;
    }
    this.saveSettings();
  },
  
  // Play a soft chime when agent starts working
  playStartChime() {
    if (!this.enabled || !this.audioContext) return;
    
    const now = this.audioContext.currentTime;
    
    // Create a pleasant two-tone chime
    this.playTone(880, 0.1, 0.15, now);        // A5
    this.playTone(1108.73, 0.1, 0.15, now + 0.1); // C#6
    
    // Add a soft attack and decay envelope
    this.applyEnvelope(this.masterGain, now, 0.3);
  },
  
  // Play celebration sound when task completes
  playTaskComplete() {
    if (!this.enabled || !this.audioContext) return;
    
    const now = this.audioContext.currentTime;
    
    // Play ascending arpeggio
    this.playTone(523.25, 0.1, 0.2, now);         // C5
    this.playTone(659.25, 0.1, 0.2, now + 0.1);   // E5
    this.playTone(783.99, 0.1, 0.2, now + 0.2);   // G5
    this.playTone(1046.50, 0.15, 0.3, now + 0.3); // C6
    
    this.applyEnvelope(this.masterGain, now, 0.5);
  },
  
  // Play notification ping for office events
  playNotification(type = 'default') {
    if (!this.enabled || !this.audioContext) return;
    
    const now = this.audioContext.currentTime;
    
    switch (type) {
      case 'pizza':
        // Cheerful ascending tones
        this.playTone(440, 0.08, 0.1, now);
        this.playTone(554.37, 0.08, 0.1, now + 0.08);
        this.playTone(659.25, 0.12, 0.15, now + 0.16);
        break;
      case 'visitor':
        // Two-tone greeting
        this.playTone(392, 0.1, 0.1, now);
        this.playTone(523.25, 0.15, 0.15, now + 0.1);
        break;
      default:
        // Soft single ping
        this.playTone(880, 0.05, 0.1, now);
    }
    
    this.applyEnvelope(this.masterGain, now, 0.2);
  },
  
  // Play a single tone
  playTone(frequency, duration, volume, startTime = 0) {
    if (!this.audioContext) return;
    
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.type = 'sine';
    osc.frequency.value = frequency;
    
    gain.gain.value = 0;
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(startTime);
    osc.stop(startTime + duration + 0.1);
  },
  
  // Apply envelope to master gain
  applyEnvelope(gainNode, startTime, duration) {
    gainNode.gain.setValueAtTime(gainNode.gain.value, startTime);
    gainNode.gain.linearRampToValueAtTime(1, startTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  },
  
  // Start ambient office sounds
  startAmbient() {
    if (!this.enabled || !this.audioContext || this.ambientOscillators.length > 0) return;
    
    const now = this.audioContext.currentTime;
    
    // Create subtle HVAC hum (very low frequency)
    const hvacOsc = this.audioContext.createOscillator();
    const hvacGain = this.audioContext.createGain();
    hvacOsc.type = 'sine';
    hvacOsc.frequency.value = 60; // 60Hz hum
    hvacGain.gain.value = 0.02;
    hvacOsc.connect(hvacGain);
    hvacGain.connect(this.ambientGain);
    hvacOsc.start(now);
    this.ambientOscillators.push({ osc: hvacOsc, gain: hvacGain });
    
    // Create subtle keyboard typing noise (filtered noise)
    const keyOsc = this.audioContext.createOscillator();
    const keyGain = this.audioContext.createGain();
    keyOsc.type = 'triangle';
    keyOsc.frequency.value = 200 + Math.random() * 100;
    keyGain.gain.value = 0.005;
    keyOsc.connect(keyGain);
    keyGain.connect(this.ambientGain);
    keyOsc.start(now);
    this.ambientOscillators.push({ osc: keyOsc, gain: keyGain });
    
    // Fade in ambient
    this.ambientGain.gain.setValueAtTime(0, now);
    this.ambientGain.gain.linearRampToValueAtTime(0.3, now + 2);
  },
  
  // Stop ambient office sounds
  stopAmbient() {
    if (this.ambientOscillators.length === 0) return;
    
    const now = this.audioContext.currentTime;
    
    // Fade out
    this.ambientGain.gain.linearRampToValueAtTime(0, now + 0.5);
    
    // Stop oscillators after fade
    setTimeout(() => {
      this.ambientOscillators.forEach(({ osc, gain }) => {
        try {
          osc.stop();
          gain.disconnect();
        } catch (e) {}
      });
      this.ambientOscillators = [];
    }, 600);
  },
  
  // Toggle ambient sounds
  toggleAmbient() {
    if (this.ambientOscillators.length > 0) {
      this.stopAmbient();
      return false;
    } else {
      this.startAmbient();
      return true;
    }
  },
  
  // Save settings to localStorage
  saveSettings() {
    try {
      localStorage.setItem('agentOfficeSound', JSON.stringify({
        enabled: this.enabled,
        volume: this.volume
      }));
    } catch (e) {}
  },
  
  // Load settings from localStorage
  loadSettings() {
    try {
      const saved = JSON.parse(localStorage.getItem('agentOfficeSound'));
      if (saved) {
        this.enabled = saved.enabled || false;
        this.volume = saved.volume || 0.5;
      }
    } catch (e) {}
  }
};

// Load settings on init
SoundManager.loadSettings();

// Make globally available
window.SoundManager = SoundManager;

// Hook into task events
window.onAgentStart = function(character) {
  SoundManager.playStartChime();
};

window.onTaskComplete = function(character) {
  SoundManager.playTaskComplete();
};

window.onOfficeEvent = function(eventType) {
  SoundManager.playNotification(eventType);
};
