// AgentOffice - Character Sprites
// Phase 1: Static character sprites at designated positions
// Phase 2: Character state machine for animations

// Get office layout constants from app.js (global scope)
const MIN_WIDTH = window.MIN_WIDTH || 1200;
const MIN_HEIGHT = window.MIN_HEIGHT || 800;
let scale = window.scale || 1;

// Walking speed (units per millisecond) - adjustable
const WALKING_SPEED = 0.0008;

// Character states for the state machine
const CharacterStates = {
  IDLE: 'idle',
  WALKING_TO_DESK: 'walking_to_desk',
  WORKING: 'working',
  WALKING_TO_LOUNGE: 'walking_to_lounge'
};

// ============================================================================
// Waypoint Path System
// ============================================================================
// Define key points in the office layout (as fractions 0-1)
// These waypoints create paths through the hallway connecting lounge to desks

const Waypoints = {
  // Lounge area waypoints (left side)
  LOUNGE_ENTER: { x: 0.08, y: 0.55 },      // Main lounge entry point
  LOUNGE_CENTER: { x: 0.15, y: 0.65 },      // Lounge center
  LOUNGE_EXIT: { x: 0.30, y: 0.50 },       // Exit to hallway
  
  // Hallway waypoints (center)
  HALLWAY_LEFT: { x: 0.35, y: 0.50 },      // Hallway left
  HALLWAY_CENTER: { x: 0.50, y: 0.50 },    // Hallway center intersection
  HALLWAY_RIGHT: { x: 0.65, y: 0.50 },     // Hallway right
  
  // Desk area waypoints (right side)
  HALLWAY_TO_DESKS: { x: 0.70, y: 0.50 },  // Entry to desk area
  
  // Individual desk destination waypoints (at the desks)
  NOVA_DESK: { x: 0.15, y: 0.12 },
  ZERO1_DESK: { x: 0.12, y: 0.40 },
  ZERO2_DESK: { x: 0.44, y: 0.40 },
  ZERO3_DESK: { x: 0.76, y: 0.40 },
  DELTA_DESK: { x: 0.72, y: 0.12 },
  BESTIE_DESK: { x: 0.22, y: 0.62 },
  DEXTER_DESK: { x: 0.78, y: 0.62 }
};

// Define paths from lounge to each desk
const PATHS = {
  nova: [
    Waypoints.LOUNGE_ENTER,
    Waypoints.LOUNGE_EXIT,
    Waypoints.HALLWAY_LEFT,
    Waypoints.HALLWAY_CENTER,
    Waypoints.HALLWAY_RIGHT,
    Waypoints.HALLWAY_TO_DESKS,
    Waypoints.NOVA_DESK
  ],
  zero1: [
    Waypoints.LOUNGE_ENTER,
    Waypoints.LOUNGE_EXIT,
    Waypoints.HALLWAY_LEFT,
    Waypoints.HALLWAY_CENTER,
    Waypoints.HALLWAY_RIGHT,
    Waypoints.HALLWAY_TO_DESKS,
    Waypoints.ZERO1_DESK
  ],
  zero2: [
    Waypoints.LOUNGE_ENTER,
    Waypoints.LOUNGE_EXIT,
    Waypoints.HALLWAY_LEFT,
    Waypoints.HALLWAY_CENTER,
    Waypoints.HALLWAY_RIGHT,
    Waypoints.HALLWAY_TO_DESKS,
    Waypoints.ZERO2_DESK
  ],
  zero3: [
    Waypoints.LOUNGE_ENTER,
    Waypoints.LOUNGE_EXIT,
    Waypoints.HALLWAY_LEFT,
    Waypoints.HALLWAY_CENTER,
    Waypoints.HALLWAY_RIGHT,
    Waypoints.HALLWAY_TO_DESKS,
    Waypoints.ZERO3_DESK
  ],
  delta: [
    Waypoints.LOUNGE_ENTER,
    Waypoints.LOUNGE_EXIT,
    Waypoints.HALLWAY_LEFT,
    Waypoints.HALLWAY_CENTER,
    Waypoints.HALLWAY_RIGHT,
    Waypoints.HALLWAY_TO_DESKS,
    Waypoints.DELTA_DESK
  ],
  bestie: [
    Waypoints.LOUNGE_ENTER,
    Waypoints.LOUNGE_EXIT,
    Waypoints.HALLWAY_LEFT,
    Waypoints.HALLWAY_CENTER,
    Waypoints.HALLWAY_RIGHT,
    Waypoints.HALLWAY_TO_DESKS,
    Waypoints.BESTIE_DESK
  ],
  dexter: [
    Waypoints.LOUNGE_ENTER,
    Waypoints.LOUNGE_EXIT,
    Waypoints.HALLWAY_LEFT,
    Waypoints.HALLWAY_CENTER,
    Waypoints.HALLWAY_RIGHT,
    Waypoints.HALLWAY_TO_DESKS,
    Waypoints.DEXTER_DESK
  ]
};

// Paths from desk back to lounge (reverse of desk-to-lounge paths)
const PATHS_TO_LOUNGE = {
  nova: [...PATHS.nova].reverse(),
  zero1: [...PATHS.zero1].reverse(),
  zero2: [...PATHS.zero2].reverse(),
  zero3: [...PATHS.zero3].reverse(),
  delta: [...PATHS.delta].reverse(),
  bestie: [...PATHS.bestie].reverse(),
  dexter: [...PATHS.dexter].reverse()
};

// Linear interpolation function
function lerp(start, end, t) {
  return start + (end - start) * t;
}

// Get point along a path at parameter t (0-1)
function getPointOnPath(path, t) {
  if (!path || path.length < 2) return null;
  
  const totalSegments = path.length - 1;
  const segmentT = t * totalSegments;
  const segmentIndex = Math.min(Math.floor(segmentT), totalSegments - 1);
  const localT = segmentT - segmentIndex;
  
  const p1 = path[segmentIndex];
  const p2 = path[segmentIndex + 1];
  
  return {
    x: lerp(p1.x, p2.x, localT),
    y: lerp(p1.y, p2.y, localT)
  };
}

// Calculate distance between two points
function distance(p1, p2) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// Calculate total path length
function getPathLength(path) {
  let length = 0;
  for (let i = 0; i < path.length - 1; i++) {
    length += distance(path[i], path[i + 1]);
  }
  return length;
}

// Character definitions with positions matching the office layout
// Desk coordinates defined as fractions of office dimensions (0-1 range)
const CHARACTERS = [
  {
    id: 'nova',
    name: 'Nova',
    color: '#ff6b9d',
    position: 'corner_office',
    // Positioned in Nova's corner office (right top)
    offsetX: 0.15,
    offsetY: 0.65,
    // Specific desk coordinates for Nova's corner office
    deskX: 0.15,
    deskY: 0.12,
    // State machine properties
    state: CharacterStates.IDLE,
    frame: 0,
    targetX: 0.15,
    targetY: 0.65,
    baseColor: '#ff6b9d',
    // Pathfinding properties
    path: null,
    pathProgress: 0,
    pathLength: 0
  },
  {
    id: 'zero1',
    name: 'Zero-1',
    color: '#6bff6b',
    position: 'pod_1',
    // Positioned in lounge initially (will walk to pod)
    offsetX: 0.12,
    offsetY: 0.65,
    // Specific desk coordinates for Zero Pod 1
    deskX: 0.12,
    deskY: 0.40,
    // State machine properties
    state: CharacterStates.IDLE,
    frame: 0,
    targetX: 0.12,
    targetY: 0.65,
    baseColor: '#6bff6b',
    // Pathfinding properties
    path: null,
    pathProgress: 0,
    pathLength: 0
  },
  {
    id: 'zero2',
    name: 'Zero-2',
    color: '#6bffff',
    position: 'pod_2',
    // Positioned in lounge initially
    offsetX: 0.15,
    offsetY: 0.70,
    // Specific desk coordinates for Zero Pod 2
    deskX: 0.44,
    deskY: 0.40,
    // State machine properties
    state: CharacterStates.IDLE,
    frame: 0,
    targetX: 0.15,
    targetY: 0.70,
    baseColor: '#6bffff',
    // Pathfinding properties
    path: null,
    pathProgress: 0,
    pathLength: 0
  },
  {
    id: 'zero3',
    name: 'Zero-3',
    color: '#6b6bff',
    position: 'pod_3',
    // Positioned in lounge initially
    offsetX: 0.18,
    offsetY: 0.65,
    // Specific desk coordinates for Zero Pod 3
    deskX: 0.76,
    deskY: 0.40,
    // State machine properties
    state: CharacterStates.IDLE,
    frame: 0,
    targetX: 0.18,
    targetY: 0.65,
    baseColor: '#6b6bff',
    // Pathfinding properties
    path: null,
    pathProgress: 0,
    pathLength: 0
  },
  {
    id: 'delta',
    name: 'Delta',
    color: '#ffff6b',
    position: 'delta_station',
    // Positioned in lounge initially
    offsetX: 0.12,
    offsetY: 0.75,
    // Specific desk coordinates for Delta station
    deskX: 0.72,
    deskY: 0.12,
    // State machine properties
    state: CharacterStates.IDLE,
    frame: 0,
    targetX: 0.12,
    targetY: 0.75,
    baseColor: '#ffff6b',
    // Pathfinding properties
    path: null,
    pathProgress: 0,
    pathLength: 0
  },
  {
    id: 'bestie',
    name: 'Bestie',
    color: '#ff9d6b',
    position: 'reception',
    // Positioned in lounge initially
    offsetX: 0.15,
    offsetY: 0.80,
    // Specific desk coordinates for Bestie reception
    deskX: 0.22,
    deskY: 0.62,
    // State machine properties
    state: CharacterStates.IDLE,
    frame: 0,
    targetX: 0.15,
    targetY: 0.80,
    baseColor: '#ff9d6b',
    // Pathfinding properties
    path: null,
    pathProgress: 0,
    pathLength: 0
  },
  {
    id: 'dexter',
    name: 'Dexter',
    color: '#9d6bff',
    position: 'flex_desk',
    // Positioned in lounge initially
    offsetX: 0.18,
    offsetY: 0.70,
    // Specific desk coordinates for Dexter flex desk
    deskX: 0.78,
    deskY: 0.62,
    // State machine properties
    state: CharacterStates.IDLE,
    frame: 0,
    targetX: 0.18,
    targetY: 0.70,
    baseColor: '#9d6bff',
    // Pathfinding properties
    path: null,
    pathProgress: 0,
    pathLength: 0
  }
];

// Sprite dimensions
const SPRITE_WIDTH = 32;
const SPRITE_HEIGHT = 40;
const LABEL_OFFSET = -12;

// Animation frame timing (milliseconds per frame)
const FRAME_DURATION = 500;

// Get office layout boundaries (must match app.js)
function getOfficeBounds() {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const w = MIN_WIDTH * scale;
  const h = MIN_HEIGHT * scale;
  const x = cx - w / 2;
  const y = cy - h / 2;
  
  return { cx, cy, w, h, x, y, scale };
}

// Transition character to a new state
function setCharacterState(characterId, newState) {
  const character = CHARACTERS.find(c => c.id === characterId);
  if (!character) return;
  
  const oldState = character.state;
  character.state = newState;
  character.frame = 0;
  
  // Define lounge area (kitchen/lounge area - left side of office)
  const loungePositions = [
    { x: 0.08, y: 0.55 },  // Near couch
    { x: 0.15, y: 0.65 },  // Lounge center
    { x: 0.08, y: 0.75 },  // Near plant
    { x: 0.18, y: 0.80 },  // Coffee table area
    { x: 0.12, y: 0.50 }   // Near kitchen
  ];
  
  // Set target positions and paths based on new state
  switch (newState) {
    case CharacterStates.IDLE:
      // Return to lounge/kitchen area (random position in left side)
      // Use pathfinding from current position
      const loungePos = loungePositions[Math.floor(Math.random() * loungePositions.length)];
      // Find a path to the lounge position
      character.path = findPathToLounge(character.offsetX, character.offsetY);
      character.pathProgress = 0;
      character.pathLength = character.path ? getPathLength(character.path) : 0;
      character.targetX = loungePos.x;
      character.targetY = loungePos.y;
      break;
      
    case CharacterStates.WALKING_TO_DESK:
      // Move to their specific desk using path system
      character.path = PATHS[character.id];
      character.pathProgress = 0;
      character.pathLength = character.path ? getPathLength(character.path) : 0;
      character.targetX = character.deskX;
      character.targetY = character.deskY;
      break;
      
    case CharacterStates.WORKING:
      // Stay at desk - clear any path
      character.path = null;
      character.pathProgress = 0;
      character.targetX = character.deskX;
      character.targetY = character.deskY;
      break;
      
    case CharacterStates.WALKING_TO_LOUNGE:
      // Move back to lounge using path system
      character.path = findPathFromDesk(character.id);
      character.pathProgress = 0;
      character.pathLength = character.path ? getPathLength(character.path) : 0;
      const loungeReturnPos = loungePositions[Math.floor(Math.random() * loungePositions.length)];
      character.targetX = loungeReturnPos.x;
      character.targetY = loungeReturnPos.y;
      break;
  }
}

// Find path from current position to lounge area
function findPathToLounge(startX, startY) {
  // Simple: start from lounge entrance and reverse from there
  // Build a path from current position to lounge
  const loungeEntry = Waypoints.LOUNGE_ENTER;
  
  // Check if we're on the right side (desk area) or left side (lounge)
  if (startX > 0.6) {
    // Currently at desk area - need to go through hallway
    return [
      { x: startX, y: startY },
      Waypoints.HALLWAY_TO_DESKS,
      Waypoints.HALLWAY_RIGHT,
      Waypoints.HALLWAY_CENTER,
      Waypoints.HALLWAY_LEFT,
      Waypoints.LOUNGE_EXIT,
      loungeEntry
    ];
  } else {
    // Already in lounge area - simple path
    return [
      { x: startX, y: startY },
      loungeEntry
    ];
  }
}

// Get path from desk back to lounge
function findPathFromDesk(characterId) {
  return PATHS_TO_LOUNGE[characterId] || null;
}

// Update character animation frame
function updateCharacterFrame(character, deltaTime) {
  character.frameTime = character.frameTime || 0;
  character.frameTime += deltaTime;
  
  // Advance frame every FRAME_DURATION ms
  if (character.frameTime >= FRAME_DURATION) {
    character.frame = (character.frame + 1) % 3; // 3 frames per state
    character.frameTime = 0;
  }
}

// Update character position along waypoint path (using linear interpolation)
function updateCharacterPosition(character, deltaTime) {
  if (character.state === CharacterStates.WALKING_TO_DESK || 
      character.state === CharacterStates.WALKING_TO_LOUNGE) {
    
    // Use path system for movement
    if (character.path && character.path.length >= 2) {
      // Calculate how much progress to add based on speed and path length
      const progressIncrement = (WALKING_SPEED * deltaTime) / character.pathLength;
      character.pathProgress += progressIncrement;
      
      if (character.pathProgress >= 1) {
        // Reached the end of the path
        character.offsetX = character.targetX;
        character.offsetY = character.targetY;
        
        // Switch to appropriate state
        if (character.state === CharacterStates.WALKING_TO_DESK) {
          setCharacterState(character.id, CharacterStates.WORKING);
        } else {
          setCharacterState(character.id, CharacterStates.IDLE);
        }
      } else {
        // Interpolate position along path
        const pos = getPointOnPath(character.path, character.pathProgress);
        if (pos) {
          character.offsetX = pos.x;
          character.offsetY = pos.y;
        }
      }
    } else {
      // Fallback to direct movement if no path
      const speed = 0.0005 * deltaTime;
      const dx = character.targetX - character.offsetX;
      const dy = character.targetY - character.offsetY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 0.01) {
        character.offsetX += (dx / dist) * speed * Math.min(dist, 0.1);
        character.offsetY += (dy / dist) * speed * Math.min(dist, 0.1);
      } else {
        if (character.state === CharacterStates.WALKING_TO_DESK) {
          setCharacterState(character.id, CharacterStates.WORKING);
        } else {
          setCharacterState(character.id, CharacterStates.IDLE);
        }
      }
    }
  }
}

// Get color variation based on state and frame (includes mood - Phase 5)
function getStateColor(character) {
  // If mood system is available and character has mood, use mood-aware color
  if (window.getMoodStateColor && character.mood) {
    return window.getMoodStateColor(character);
  }
  
  // Fallback to original implementation
  const baseColor = character.baseColor;
  const frame = character.frame;
  const state = character.state;
  
  // Parse base color (hex to RGB)
  const hex = baseColor.replace('#', '');
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);
  
  // Apply state-based color variations
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

// Get Y offset based on animation frame (bouncing effect)
function getFrameOffset(character) {
  const frame = character.frame;
  const state = character.state;
  
  if (state === CharacterStates.WALKING_TO_DESK || state === CharacterStates.WALKING_TO_LOUNGE) {
    // Walking - vertical bounce
    return [0, -3, 0][frame] * scale;
  } else if (state === CharacterStates.WORKING) {
    // Working - slight vertical movement
    return [0, -1, 0][frame] * scale;
  }
  
  return 0;
}

// Draw a single character sprite
function drawCharacter(character, deltaTime) {
  const { x, y, w, h, scale } = getOfficeBounds();
  
  // Update animation
  updateCharacterFrame(character, deltaTime);
  updateCharacterPosition(character, deltaTime);
  
  // Calculate character position based on their current offset
  const charX = x + w * character.offsetX;
  const charY = y + h * character.offsetY;
  
  // Scale sprite size
  const spriteW = SPRITE_WIDTH * scale;
  const spriteH = SPRITE_HEIGHT * scale;
  
  // Get state-based color and offset
  const stateColor = getStateColor(character);
  const frameOffset = getFrameOffset(character);
  
  // Draw character body with state-based color
  ctx.fillStyle = stateColor;
  ctx.fillRect(charX - spriteW / 2, charY - spriteH / 2 + frameOffset, spriteW, spriteH);
  
  // Draw character border
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2 * scale;
  ctx.strokeRect(charX - spriteW / 2, charY - spriteH / 2 + frameOffset, spriteW, spriteH);
  
  // Draw state indicator (small dot below character)
  const stateColors = {
    [CharacterStates.IDLE]: '#88ff88',
    [CharacterStates.WALKING_TO_DESK]: '#ffff88',
    [CharacterStates.WORKING]: '#ff8888',
    [CharacterStates.WALKING_TO_LOUNGE]: '#88ffff'
  };
  ctx.fillStyle = stateColors[character.state] || '#ffffff';
  ctx.beginPath();
  ctx.arc(charX, charY + spriteH / 2 + 4 * scale, 3 * scale, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw name label above character
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${10 * scale}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(character.name, charX, charY - spriteH / 2 - 4 * scale + frameOffset);
  
  // Reset text baseline
  ctx.textBaseline = 'alphabetic';
}

// Draw all characters on the canvas
function drawCharacters(deltaTime = 16) {
  CHARACTERS.forEach(character => {
    drawCharacter(character, deltaTime);
  });
}

// ============================================================================
// Visual Effects System - Phase 4
// ============================================================================

// Typing particles for working agents
class TypingParticle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.vx = (Math.random() - 0.5) * 0.002;
    this.vy = -Math.random() * 0.003 - 0.001;
    this.life = 1.0;
    this.decay = Math.random() * 0.01 + 0.008;
    this.size = Math.random() * 3 + 2;
  }

  update(deltaTime) {
    this.x += this.vx * deltaTime * 60;
    this.y += this.vy * deltaTime * 60;
    this.life -= this.decay;
    return this.life > 0;
  }

  draw(ctx, scale) {
    ctx.globalAlpha = this.life * 0.8;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

// Store particles per character
const characterParticles = {};

// Spawn typing particles for a working character
function spawnTypingParticles(character) {
  if (character.state !== CharacterStates.WORKING) return;
  
  // Initialize particle array for this character
  if (!characterParticles[character.id]) {
    characterParticles[character.id] = [];
  }
  
  // Spawn 1-2 particles per frame with low probability
  if (Math.random() < 0.3) {
    const { x, y, w, h } = getOfficeBounds();
    // Spawn near the character's position (at their desk)
    const charX = x + w * character.deskX;
    const charY = y + h * character.deskY;
    
    const particle = new TypingParticle(
      charX + (Math.random() - 0.5) * 20 * scale,
      charY - 15 * scale,
      character.baseColor
    );
    characterParticles[character.id].push(particle);
  }
}

// Update and draw typing particles
function updateTypingParticles() {
  Object.keys(characterParticles).forEach(charId => {
    const particles = characterParticles[charId];
    
    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      if (!particles[i].update(16)) {
        particles.splice(i, 1);
      }
    }
  });
}

function drawTypingParticles() {
  Object.values(characterParticles).forEach(particles => {
    particles.forEach(particle => {
      particle.draw(ctx, scale);
    });
  });
}

// Monitor glow effect for working agents
function drawMonitorGlow(character) {
  if (character.state !== CharacterStates.WORKING) return;
  
  const { x, y, w, h } = getOfficeBounds();
  const charX = x + w * character.deskX;
  const charY = y + h * character.deskY;
  
  // Draw glow around monitor position
  const glowX = charX - 15 * scale;
  const glowY = charY - 10 * scale;
  const glowW = 40 * scale;
  const glowH = 25 * scale;
  
  // Create gradient for glow effect
  const gradient = ctx.createRadialGradient(
    glowX + glowW / 2, glowY + glowH / 2, 0,
    glowX + glowW / 2, glowY + glowH / 2, glowW
  );
  
  const glowColor = character.baseColor;
  gradient.addColorStop(0, glowColor.replace(')', ', 0.4)').replace('rgb', 'rgba'));
  gradient.addColorStop(0.5, glowColor.replace(')', ', 0.2)').replace('rgb', 'rgba'));
  gradient.addColorStop(1, 'transparent');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(glowX - glowW / 2, glowY - glowH / 2, glowW * 2, glowH * 2);
}

// ============================================================================
// Coffee Steam Effect - Kitchen
// ============================================================================

class SteamParticle {
  constructor(x, y) {
    this.x = x;
    this.baseX = x;
    this.y = y;
    this.startY = y;
    this.vx = (Math.random() - 0.5) * 0.3;
    this.vy = -Math.random() * 0.8 - 0.3;
    this.life = 0;
    this.maxLife = Math.random() * 40 + 40;
    this.size = Math.random() * 8 + 6;
  }

  update(deltaTime) {
    this.x += this.vx * deltaTime * 0.1;
    this.y += this.vy * deltaTime * 0.1;
    this.life++;
    this.size += 0.05 * deltaTime;
    return this.life < this.maxLife;
  }

  draw(ctx, scale) {
    const alpha = Math.sin((this.life / this.maxLife) * Math.PI) * 0.4;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

let steamParticles = [];
let lastSteamSpawn = 0;

function updateCoffeeSteam(timestamp) {
  // Spawn new steam particles every 200ms
  if (timestamp - lastSteamSpawn > 200) {
    // Coffee machine position (from app.js - kitchen area)
    const { x, y, w, h } = getOfficeBounds();
    const coffeeX = x + w * 0.08; // Kitchen coffee machine position
    const coffeeY = y + h * 0.15;
    
    steamParticles.push(new SteamParticle(coffeeX, coffeeY));
    steamParticles.push(new SteamParticle(coffeeX + 10 * scale, coffeeY - 5 * scale));
    lastSteamSpawn = timestamp;
  }
  
  // Update existing particles
  for (let i = steamParticles.length - 1; i >= 0; i--) {
    if (!steamParticles[i].update(16)) {
      steamParticles.splice(i, 1);
    }
  }
}

function drawCoffeeSteam() {
  steamParticles.forEach(particle => {
    particle.draw(ctx, scale);
  });
}

// Export for use in app.js
window.CHARACTERS = CHARACTERS;
window.CharacterStates = CharacterStates;
window.WALKING_SPEED = WALKING_SPEED;
window.Waypoints = Waypoints;
window.PATHS = PATHS;
window.drawCharacters = drawCharacters;
window.setCharacterState = setCharacterState;
window.getPointOnPath = getPointOnPath;
window.getPathLength = getPathLength;
window.spawnTypingParticles = spawnTypingParticles;
window.updateTypingParticles = updateTypingParticles;
window.drawTypingParticles = drawTypingParticles;
window.drawMonitorGlow = drawMonitorGlow;
window.updateCoffeeSteam = updateCoffeeSteam;
window.drawCoffeeSteam = drawCoffeeSteam;
