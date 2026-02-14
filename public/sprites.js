// AgentOffice - Character Sprites
// Phase 1: Static character sprites at designated positions

// Get office layout constants from app.js (global scope)
const MIN_WIDTH = window.MIN_WIDTH || 1200;
const MIN_HEIGHT = window.MIN_HEIGHT || 800;
let scale = window.scale || 1;

// Character definitions with positions matching the office layout
const CHARACTERS = [
  {
    id: 'nova',
    name: 'Nova',
    color: '#ff6b9d',
    position: 'corner_office',
    // Positioned in Nova's corner office (right top)
    offsetX: 0.15,
    offsetY: 0.12
  },
  {
    id: 'zero1',
    name: 'Zero-1',
    color: '#6bff6b',
    position: 'pod_1',
    // Positioned in Zero Pod 1
    offsetX: 0.12,
    offsetY: 0.40
  },
  {
    id: 'zero2',
    name: 'Zero-2',
    color: '#6bffff',
    position: 'pod_2',
    // Positioned in Zero Pod 2
    offsetX: 0.44,
    offsetY: 0.40
  },
  {
    id: 'zero3',
    name: 'Zero-3',
    color: '#6b6bff',
    position: 'pod_3',
    // Positioned in Zero Pod 3
    offsetX: 0.76,
    offsetY: 0.40
  },
  {
    id: 'delta',
    name: 'Delta',
    color: '#ffff6b',
    position: 'delta_station',
    // Positioned at Delta's review station (right top)
    offsetX: 0.72,
    offsetY: 0.12
  },
  {
    id: 'bestie',
    name: 'Bestie',
    color: '#ff9d6b',
    position: 'reception',
    // Positioned at reception desk (right bottom left)
    offsetX: 0.22,
    offsetY: 0.62
  },
  {
    id: 'dexter',
    name: 'Dexter',
    color: '#9d6bff',
    position: 'flex_desk',
    // Positioned at Dexter's flex desk (right bottom right)
    offsetX: 0.78,
    offsetY: 0.62
  }
];

// Sprite dimensions
const SPRITE_WIDTH = 32;
const SPRITE_HEIGHT = 40;
const LABEL_OFFSET = -12;

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

// Draw a single character sprite
function drawCharacter(character) {
  const { x, y, w, h, scale } = getOfficeBounds();
  
  // Calculate character position based on their designated area
  const charX = x + w * character.offsetX;
  const charY = y + h * character.offsetY;
  
  // Scale sprite size
  const spriteW = SPRITE_WIDTH * scale;
  const spriteH = SPRITE_HEIGHT * scale;
  
  // Draw character body (simple colored rectangle)
  ctx.fillStyle = character.color;
  ctx.fillRect(charX - spriteW / 2, charY - spriteH / 2, spriteW, spriteH);
  
  // Draw character border
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2 * scale;
  ctx.strokeRect(charX - spriteW / 2, charY - spriteH / 2, spriteW, spriteH);
  
  // Draw name label above character
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${10 * scale}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(character.name, charX, charY - spriteH / 2 - 4 * scale);
  
  // Reset text baseline
  ctx.textBaseline = 'alphabetic';
}

// Draw all characters on the canvas
function drawCharacters() {
  CHARACTERS.forEach(character => {
    drawCharacter(character);
  });
}

// Export for use in app.js
window.CHARACTERS = CHARACTERS;
window.drawCharacters = drawCharacters;
