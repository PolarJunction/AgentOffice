// ============================================================================
// Agent Mood System - Phase 5
// ============================================================================

// Mood states
const MoodStates = {
  HAPPY: 'happy',
  NEUTRAL: 'neutral',
  FRUSTRATED: 'frustrated'
};

// Mood configuration
const MOOD_CONFIG = {
  [MoodStates.HAPPY]: {
    colorTint: { r: 30, g: 30, b: -30 },   // Warm tint (more red/yellow)
    emoji: '😊',
    idleBounce: 4,                          // Pixels of bounce
    decayTime: 30000,                       // 30 seconds to decay to neutral
    label: 'Happy'
  },
  [MoodStates.NEUTRAL]: {
    colorTint: { r: 0, g: 0, b: 0 },
    emoji: null,
    idleBounce: 1,
    decayTime: 0,
    label: 'Neutral'
  },
  [MoodStates.FRUSTRATED]: {
    colorTint: { r: -40, g: -20, b: 20 },   // Blue/dark tint
    emoji: '😤',
    idleBounce: -2,                         // Slumped (negative = sink down)
    decayTime: 0,
    label: 'Frustrated'
  }
};

// Initialize mood data for each character
function initializeAgentMoods() {
  if (!window.CHARACTERS) return;
  
  window.CHARACTERS.forEach(character => {
    character.mood = {
      state: MoodStates.NEUTRAL,
      streak: 0,                            // Consecutive tasks without errors
      lastMoodChange: Date.now(),
      lastTaskComplete: null,
      lastError: null,
      idleStartTime: null,
      happyUntil: null,
      // Stats tracking
      tasksCompleted: 0,
      errorsCount: 0,
      totalIdleTime: 0
    };
  });
}

// Get mood color based on base color and mood state
function getMoodColor(baseColor, moodState) {
  const tint = MOOD_CONFIG[moodState].colorTint;
  
  // Parse base color
  const hex = baseColor.replace('#', '');
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);
  
  // Apply tint
  r = Math.max(0, Math.min(255, r + tint.r));
  g = Math.max(0, Math.min(255, g + tint.g));
  b = Math.max(0, Math.min(255, b + tint.b));
  
  return `rgb(${r}, ${g}, ${b})`;
}

// Get mood-based idle animation offset
function getMoodIdleOffset(character, frame) {
  const mood = character.mood;
  const bounceAmount = MOOD_CONFIG[mood.state].idleBounce;
  const scale = window.scale || 1;
  
  // Only apply mood bounce when idle
  if (character.state !== CharacterStates.IDLE) return 0;
  
  // Bouncy animation for happy, slumped for frustrated
  if (bounceAmount > 0) {
    return [0, -bounceAmount * scale, 0][frame] || 0;
  } else if (bounceAmount < 0) {
    // Constant sink for frustrated
    return bounceAmount * scale;
  }
  
  return 0;
}

// Trigger happy mood (after task completion)
function triggerHappyMood(character) {
  if (!character.mood) return;
  
  character.mood.state = MoodStates.HAPPY;
  character.mood.streak = (character.mood.streak || 0) + 1;
  character.mood.lastMoodChange = Date.now();
  character.mood.lastTaskComplete = Date.now();
  character.mood.happyUntil = Date.now() + 10000; // Happy for 10 seconds
  
  console.log(`${character.name} is now HAPPY! Streak: ${character.mood.streak}`);
}

// Trigger frustrated mood (after errors or long idle)
function triggerFrustratedMood(character, reason = 'error') {
  if (!character.mood) return;
  
  character.mood.state = MoodStates.FRUSTRATED;
  character.mood.streak = 0; // Reset streak
  character.mood.lastMoodChange = Date.now();
  
  if (reason === 'error') {
    character.mood.lastError = Date.now();
    character.mood.errorsCount = (character.mood.errorsCount || 0) + 1;
  }
  
  console.log(`${character.name} is now FRUSTRATED (${reason})`);
}

// Update mood based on time and events
function updateMoods(deltaTime) {
  if (!window.CHARACTERS) return;
  
  const now = Date.now();
  
  window.CHARACTERS.forEach(character => {
    if (!character.mood) return;
    
    const mood = character.mood;
    
    // Happy mood decay to neutral after 30 seconds
    if (mood.state === MoodStates.HAPPY && mood.happyUntil) {
      if (now > mood.happyUntil) {
        // Check if should stay happy (recent activity) or decay
        const timeSinceTask = now - (mood.lastTaskComplete || 0);
        if (timeSinceTask > 10000) {
          // 10+ seconds of no activity after happy trigger -> decay to neutral
          mood.state = MoodStates.NEUTRAL;
          mood.lastMoodChange = now;
          mood.happyUntil = null;
        }
      }
    }
    
    // Check for frustrated from idle (5+ minutes)
    if (character.state === CharacterStates.IDLE) {
      if (!mood.idleStartTime) {
        mood.idleStartTime = now;
      } else {
        const idleTime = now - mood.idleStartTime;
        const fiveMinutes = 5 * 60 * 1000;
        
        if (idleTime >= fiveMinutes && mood.state !== MoodStates.FRUSTRATED) {
          triggerFrustratedMood(character, 'idle');
        }
        
        // Track total idle time
        mood.totalIdleTime += deltaTime;
      }
    } else {
      // Not idle - reset idle tracking
      mood.idleStartTime = null;
    }
  });
}

// Handle task completion event (called when agent finishes a task)
function onTaskComplete(character) {
  if (!character || !character.mood) return;
  
  triggerHappyMood(character);
  
  // Update stats
  character.mood.tasksCompleted = (character.mood.tasksCompleted || 0) + 1;
}

// Handle error event (called when agent encounters an error)
function onTaskError(character) {
  if (!character || !character.mood) return;
  
  triggerFrustratedMood(character, 'error');
}

// Get mood emoji for character
function getMoodEmoji(character) {
  if (!character.mood) return null;
  
  return MOOD_CONFIG[character.mood.state].emoji;
}

// Draw mood indicators (emoji above character)
function drawMoodIndicators() {
  if (!window.CHARACTERS) return;
  
  const { x, y, w, h, scale } = getOfficeBounds();
  
  window.CHARACTERS.forEach(character => {
    const emoji = getMoodEmoji(character);
    if (!emoji) return;
    
    const charX = x + w * character.offsetX;
    const charY = y + h * character.offsetY;
    
    // Draw emoji above character
    ctx.font = `${16 * scale}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(emoji, charX, charY - 35 * scale);
    ctx.textBaseline = 'alphabetic';
  });
}

// Draw mood streak indicator (for debugging/info)
function drawMoodInfo() {
  if (!window.CHARACTERS) return;
  
  const { x, y, w, h, scale } = getOfficeBounds();
  
  window.CHARACTERS.forEach(character => {
    if (!character.mood) return;
    
    // Optional: small mood indicator dot
    const moodColors = {
      [MoodStates.HAPPY]: '#ffcc00',
      [MoodStates.NEUTRAL]: '#888888',
      [MoodStates.FRUSTRATED]: '#ff4444'
    };
    
    const charX = x + w * character.offsetX;
    const charY = y + h * character.offsetY;
    
    // Draw mood dot next to character name
    ctx.fillStyle = moodColors[character.mood.state];
    ctx.beginPath();
    ctx.arc(charX + 20 * scale, charY - 25 * scale, 4 * scale, 0, Math.PI * 2);
    ctx.fill();
  });
}

// Update the existing getStateColor function to incorporate mood
function getMoodStateColor(character) {
  // Get base color from original function
  let baseColor = character.baseColor;
  
  // If character has mood, apply mood color tint
  if (character.mood && character.mood.state !== MoodStates.NEUTRAL) {
    baseColor = getMoodColor(character.baseColor, character.mood.state);
  }
  
  // Parse base color (hex or rgb)
  let r, g, b;
  
  if (baseColor.startsWith('#')) {
    const hex = baseColor.replace('#', '');
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  } else if (baseColor.startsWith('rgb')) {
    const match = baseColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      r = parseInt(match[1]);
      g = parseInt(match[2]);
      b = parseInt(match[3]);
    } else {
      return character.baseColor; // Fallback
    }
  } else {
    return character.baseColor; // Fallback
  }
  
  // Apply state-based color variations (from original function)
  const frame = character.frame;
  const state = character.state;
  
  switch (state) {
    case CharacterStates.IDLE:
      // Subtle pulse - slight brightness variation
      const pulse = [0, 15, 0][frame];
      g = Math.min(255, g + pulse);
      break;
    case CharacterStates.WALKING_TO_DESK:
    case CharacterStates.WALKING_TO_LOUNGE:
      // Walking - color shifts toward white (movement effect)
      const walkBrightness = [0, 30, 0][frame];
      r = Math.min(255, r + walkBrightness);
      g = Math.min(255, g + walkBrightness);
      b = Math.min(255, b + walkBrightness);
      break;
    case CharacterStates.WORKING:
      // Working - darker, more intense color
      const workDarken = [0, -20, 0][frame];
      r = Math.max(0, r + workDarken);
      g = Math.max(0, g + workDarken);
      b = Math.max(0, b + workDarken);
      break;
  }
  
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}

// Override the original getStateColor to use mood-aware version
// This will be called by drawCharacter in sprites.js

// Initialize moods on load
if (typeof window !== 'undefined') {
  window.initializeAgentMoods = initializeAgentMoods;
  window.updateMoods = updateMoods;
  window.onTaskComplete = onTaskComplete;
  window.onTaskError = onTaskError;
  window.getMoodEmoji = getMoodEmoji;
  window.drawMoodIndicators = drawMoodIndicators;
  window.drawMoodInfo = drawMoodInfo;
  window.MoodStates = MoodStates;
  window.MOOD_CONFIG = MOOD_CONFIG;
  
  // Override getStateColor for mood integration
  if (window.getStateColor) {
    window.getStateColor = getMoodStateColor;
  }
}

// ============================================================================
// End Mood System
// ============================================================================
