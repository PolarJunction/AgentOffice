// AgentOffice - Character Sprites
// Phase 1: Static character sprites at designated positions
// Phase 2: Character state machine for animations

// Get office layout constants from app.js (global scope)
const MIN_WIDTH = window.MIN_WIDTH || 1200;
const MIN_HEIGHT = window.MIN_HEIGHT || 800;
let scale = window.scale || 1;

// Character states for the state machine
const CharacterStates = {
  IDLE: 'idle',
  WALKING_TO_DESK: 'walking_to_desk',
  WORKING: 'working',
  WALKING_TO_LOUNGE: 'walking_to_lounge'
};

// Character definitions with positions matching the office layout
const CHARACTERS = [
  {
    id: 'nova',
    name: 'Nova',
    color: '#ff6b9d',
    position: 'corner_office',
    // Positioned in Nova's corner office (right top)
    offsetX: 0.15,
    offsetY: 0.12,
    // State machine properties
    state: CharacterStates.IDLE,
    frame: 0,
    targetX: 0.15,
    targetY: 0.12,
    baseColor: '#ff6b9d'
  },
  {
    id: 'zero1',
    name: 'Zero-1',
    color: '#6bff6b',
    position: 'pod_1',
    // Positioned in Zero Pod 1
    offsetX: 0.12,
    offsetY: 0.40,
    // State machine properties
    state: CharacterStates.IDLE,
    frame: 0,
    targetX: 0.12,
    targetY: 0.40,
    baseColor: '#6bff6b'
  },
  {
    id: 'zero2',
    name: 'Zero-2',
    color: '#6bffff',
    position: 'pod_2',
    // Positioned in Zero Pod 2
    offsetX: 0.44,
    offsetY: 0.40,
    // State machine properties
    state: CharacterStates.IDLE,
    frame: 0,
    targetX: 0.44,
    targetY: 0.40,
    baseColor: '#6bffff'
  },
  {
    id: 'zero3',
    name: 'Zero-3',
    color: '#6b6bff',
    position: 'pod_3',
    // Positioned in Zero Pod 3
    offsetX: 0.76,
    offsetY: 0.40,
    // State machine properties
    state: CharacterStates.IDLE,
    frame: 0,
    targetX: 0.76,
    targetY: 0.40,
    baseColor: '#6b6bff'
  },
  {
    id: 'delta',
    name: 'Delta',
    color: '#ffff6b',
    position: 'delta_station',
    // Positioned at Delta's review station (right top)
    offsetX: 0.72,
    offsetY: 0.12,
    // State machine properties
    state: CharacterStates.IDLE,
    frame: 0,
    targetX: 0.72,
    targetY: 0.12,
    baseColor: '#ffff6b'
  },
  {
    id: 'bestie',
    name: 'Bestie',
    color: '#ff9d6b',
    position: 'reception',
    // Positioned at reception desk (right bottom left)
    offsetX: 0.22,
    offsetY: 0.62,
    // State machine properties
    state: CharacterStates.IDLE,
    frame: 0,
    targetX: 0.22,
    targetY: 0.62,
    baseColor: '#ff9d6b'
  },
  {
    id: 'dexter',
    name: 'Dexter',
    color: '#9d6bff',
    position: 'flex_desk',
    // Positioned at Dexter's flex desk (right bottom right)
    offsetX: 0.78,
    offsetY: 0.62,
    // State machine properties
    state: CharacterStates.IDLE,
    frame: 0,
    targetX: 0.78,
    targetY: 0.62,
    baseColor: '#9d6bff'
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
  
  // Set target positions based on new state
  switch (newState) {
    case CharacterStates.IDLE:
      // Return to lounge/kitchen area (random position in lower half)
      character.targetX = 0.1 + Math.random() * 0.3;
      character.targetY = 0.5 + Math.random() * 0.3;
      break;
    case CharacterStates.WALKING_TO_DESK:
      // Move to their desk position
      character.targetX = character.originalOffsetX || character.offsetX;
      character.targetY = character.originalOffsetY || character.offsetY;
      break;
    case CharacterStates.WORKING:
      // Stay at desk
      character.targetX = character.originalOffsetX || character.offsetX;
      character.targetY = character.originalOffsetY || character.offsetY;
      break;
    case CharacterStates.WALKING_TO_LOUNGE:
      // Move back to lounge
      character.targetX = 0.1 + Math.random() * 0.3;
      character.targetY = 0.5 + Math.random() * 0.3;
      break;
  }
  
  // Store original desk position if not already stored
  if (!character.originalOffsetX) {
    character.originalOffsetX = character.offsetX;
    character.originalOffsetY = character.offsetY;
  }
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

// Interpolate position (for walking states)
function updateCharacterPosition(character, deltaTime) {
  if (character.state === CharacterStates.WALKING_TO_DESK || 
      character.state === CharacterStates.WALKING_TO_LOUNGE) {
    // Move towards target
    const speed = 0.0005 * deltaTime; // Movement speed
    const dx = character.targetX - character.offsetX;
    const dy = character.targetY - character.offsetY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > 0.01) {
      character.offsetX += (dx / dist) * speed * Math.min(dist, 0.1);
      character.offsetY += (dy / dist) * speed * Math.min(dist, 0.1);
    } else {
      // Reached target, switch to appropriate state
      if (character.state === CharacterStates.WALKING_TO_DESK) {
        setCharacterState(character.id, CharacterStates.WORKING);
      } else {
        setCharacterState(character.id, CharacterStates.IDLE);
      }
    }
  }
}

// Get color variation based on state and frame
function getStateColor(character) {
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

// Export for use in app.js
window.CHARACTERS = CHARACTERS;
window.CharacterStates = CharacterStates;
window.drawCharacters = drawCharacters;
window.setCharacterState = setCharacterState;
