/**
 * Tile-based Office Renderer
 * Uses 16x16 pixel tiles - simplified version with programmatic tiles
 */

const TILE_SIZE = 16;
const MAP_WIDTH = 50;
const MAP_HEIGHT = 35;

// Tile types
const TILE = {
  EMPTY: 0,
  FLOOR_DARK: 1,
  FLOOR_LIGHT: 2,
  WALL: 10,
  COUNTER: 30,
  COUNTER_EDGE: 31,
  SINK: 32,
  FRIDGE: 33,
  COFFEE: 34,
  DESK: 40,
  DESK_PC: 41,
  CHAIR: 42,
  COUCH: 50,
  COUCH_SINGLE: 51,
  TABLE: 52,
  PLANT_SMALL: 60,
  PLANT_LARGE: 61,
  WATER_COOLER: 62,
  TV: 63,
  BOOKSHELF: 64,
  RUG: 70,
};

// Character colors for each agent
const CHARACTER_COLORS = {
  nova: '#ff6b9d',
  zero1: '#6bff6b',
  zero2: '#6bffff',
  zero3: '#6b6bff',
  delta: '#ffff6b',
  bestie: '#ff9d6b',
  dexter: '#9d6bff',
  flash: '#ff6b6b'
};

// Create office map programmatically
function createOfficeMap() {
  const map = [];
  for (let y = 0; y < MAP_HEIGHT; y++) {
    map[y] = new Array(MAP_WIDTH).fill(TILE.FLOOR_DARK);
  }

  // Walls
  for (let x = 0; x < MAP_WIDTH; x++) {
    map[0][x] = TILE.WALL;
    map[1][x] = TILE.EMPTY;
    map[MAP_HEIGHT - 1][x] = TILE.WALL;
  }
  for (let y = 0; y < MAP_HEIGHT; y++) {
    map[y][0] = TILE.WALL;
    map[y][1] = TILE.EMPTY;
    map[y][MAP_WIDTH - 1] = TILE.WALL;
  }

  // Kitchen area (top-left, x: 2-18, y: 3-10)
  for (let y = 3; y < 10; y++) {
    for (let x = 2; x < 18; x++) {
      map[y][x] = TILE.FLOOR_LIGHT;
    }
  }
  // Kitchen counter
  for (let x = 2; x < 18; x++) {
    map[4][x] = TILE.COUNTER;
    map[5][x] = TILE.COUNTER_EDGE;
  }
  // Fridge
  map[4][12] = TILE.FRIDGE;
  map[5][12] = TILE.FRIDGE;
  // Coffee
  map[4][15] = TILE.COFFEE;
  map[5][15] = TILE.COUNTER_EDGE;

  // Lounge area (middle-left, x: 2-18, y: 11-20)
  for (let y = 11; y < 20; y++) {
    for (let x = 2; x < 18; x++) {
      map[y][x] = TILE.FLOOR_DARK;
    }
  }
  // Couch
  for (let x = 5; x < 13; x++) {
    map[12][x] = TILE.COUCH;
  }
  // Coffee table
  for (let x = 7; x < 11; x++) {
    map[14][x] = TILE.TABLE;
  }
  // Plants
  map[13][3] = TILE.PLANT_LARGE;
  map[17][3] = TILE.PLANT_SMALL;
  // Water cooler
  map[15][16] = TILE.WATER_COOLER;
  // Rug
  for (let x = 6; x < 12; x++) {
    map[13][x] = TILE.RUG;
  }

  // Hallway (center, x: 18-30, y: 15-22)
  for (let y = 15; y < 22; y++) {
    for (let x = 18; x < 32; x++) {
      map[y][x] = TILE.FLOOR_DARK;
    }
  }

  // Desk area (right, x: 25-48, y: 3-20)
  for (let y = 6; y < 18; y++) {
    for (let x = 25; x < 48; x++) {
      map[y][x] = TILE.FLOOR_DARK;
    }
  }

  // Desks - Row 1 (top)
  for (let x = 25; x < 35; x++) {
    map[8][x] = TILE.DESK;
    map[9][x] = TILE.DESK_PC;
    map[10][x] = TILE.CHAIR;
  }

  // Desks - Row 2 (middle)
  for (let x = 25; x < 35; x++) {
    map[12][x] = TILE.DESK;
    map[13][x] = TILE.DESK_PC;
    map[14][x] = TILE.CHAIR;
  }

  // Desks - Row 3 (right side)
  for (let x = 35; x < 45; x++) {
    map[12][x] = TILE.DESK;
    map[13][x] = TILE.DESK_PC;
    map[14][x] = TILE.CHAIR;
  }

  // Nova's office (top-right, x: 38-48, y: 3-8)
  for (let y = 3; y < 8; y++) {
    for (let x = 38; x < 48; x++) {
      map[y][x] = TILE.FLOOR_LIGHT;
    }
  }
  // Nova's desk
  for (let x = 40; x < 46; x++) {
    map[5][x] = TILE.DESK;
    map[6][x] = TILE.DESK_PC;
    map[7][x] = TILE.CHAIR;
  }
  // Bookshelf
  map[3][44] = TILE.BOOKSHELF;
  map[4][44] = TILE.BOOKSHELF;
  map[5][44] = TILE.BOOKSHELF;

  // TV
  map[18][35] = TILE.TV;

  return map;
}

const OFFICE_MAP = createOfficeMap();

// Sprite sheets loaded
const spriteSheets = {};
const spritesReady = { office: false, chars: false };

// Load sprite sheets
async function initTileRenderer() {
  // Office tiles - create programmatic tiles
  spritesReady.office = true;

  // Try to load character sprites
  const charImg = new Image();
  charImg.onload = () => {
    spriteSheets.chars = charImg;
    spritesReady.chars = true;
    console.log('Character sprites loaded');
  };
  charImg.onerror = () => {
    console.log('Using fallback character rendering');
  };
  // Try loading first character as test
  charImg.src = '/tiles/characters/agent01.png';

  console.log('Tile renderer ready');
  return true;
}

// Draw a tile as pixel art
function drawTile(ctx, tileId, x, y, scale) {
  const size = TILE_SIZE * scale;
  const half = size / 2;

  switch (tileId) {
    case TILE.FLOOR_DARK:
      ctx.fillStyle = '#2d2d44';
      ctx.fillRect(x, y, size, size);
      ctx.fillStyle = '#252540';
      ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
      break;

    case TILE.FLOOR_LIGHT:
      ctx.fillStyle = '#3d3d54';
      ctx.fillRect(x, y, size, size);
      ctx.fillStyle = '#353548';
      ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
      break;

    case TILE.WALL:
      ctx.fillStyle = '#4a4a6a';
      ctx.fillRect(x, y, size, size);
      ctx.fillStyle = '#5a5a7a';
      ctx.fillRect(x, y, size, 2 * scale);
      ctx.fillStyle = '#3a3a5a';
      ctx.fillRect(x, y + size - 2 * scale, size, 2 * scale);
      break;

    case TILE.COUNTER:
      ctx.fillStyle = '#6a7a8a';
      ctx.fillRect(x, y, size, size);
      ctx.fillStyle = '#7a8a9a';
      ctx.fillRect(x, y, size, 3 * scale);
      ctx.fillStyle = '#5a6a7a';
      ctx.fillRect(x, y + size - 3 * scale, size, 3 * scale);
      break;

    case TILE.COUNTER_EDGE:
      ctx.fillStyle = '#5a6a7a';
      ctx.fillRect(x, y, size, size);
      break;

    case TILE.FRIDGE:
      ctx.fillStyle = '#aaa';
      ctx.fillRect(x, y, size, size * 2);
      ctx.fillStyle = '#888';
      ctx.fillRect(x + 2 * scale, y + 2 * scale, size - 4 * scale, size * 2 - 4 * scale);
      ctx.fillStyle = '#ccc';
      ctx.fillRect(x + size * 0.3, y + size * 0.2, size * 0.4, size * 0.5);
      break;

    case TILE.COFFEE:
      ctx.fillStyle = '#5a5a5a';
      ctx.fillRect(x + 2 * scale, y + 4 * scale, size - 4 * scale, size - 8 * scale);
      ctx.fillStyle = '#8a5a3a';
      ctx.fillRect(x + 4 * scale, y + 2 * scale, size - 8 * scale, 4 * scale);
      break;

    case TILE.DESK:
      ctx.fillStyle = '#5a4a3a';
      ctx.fillRect(x, y, size, size);
      ctx.fillStyle = '#6a5a4a';
      ctx.fillRect(x + 2 * scale, y + 2 * scale, size - 4 * scale, size - 4 * scale);
      ctx.fillStyle = '#4a3a2a';
      ctx.fillRect(x + 3 * scale, y + size - 4 * scale, size - 6 * scale, 2 * scale);
      break;

    case TILE.DESK_PC:
      ctx.fillStyle = '#5a4a3a';
      ctx.fillRect(x, y, size, size);
      ctx.fillStyle = '#3a3a5a';
      ctx.fillRect(x + 3 * scale, y + 4 * scale, size - 6 * scale, size * 0.6);
      ctx.fillStyle = '#6a8aff';
      ctx.fillRect(x + 4 * scale, y + 5 * scale, size - 8 * scale, size * 0.5);
      break;

    case TILE.CHAIR:
      ctx.fillStyle = '#8a5a7a';
      ctx.fillRect(x + 2 * scale, y + size - 6 * scale, size - 4 * scale, 6 * scale);
      ctx.fillStyle = '#6a4a5a';
      ctx.fillRect(x + 3 * scale, y + 2 * scale, size - 6 * scale, size - 10 * scale);
      break;

    case TILE.COUCH:
      ctx.fillStyle = '#6b5b7a';
      ctx.fillRect(x, y, size, size);
      ctx.fillStyle = '#7b6b8a';
      ctx.fillRect(x + 2 * scale, y + 2 * scale, size - 4 * scale, size - 4 * scale);
      ctx.fillStyle = '#5b4b6a';
      ctx.fillRect(x, y + size - 4 * scale, size, 4 * scale);
      break;

    case TILE.COUCH_SINGLE:
      ctx.fillStyle = '#6b5b7a';
      ctx.fillRect(x, y, size, size);
      ctx.fillStyle = '#7b6b8a';
      ctx.fillRect(x + 2 * scale, y + 2 * scale, size - 4 * scale, size - 4 * scale);
      break;

    case TILE.TABLE:
      ctx.fillStyle = '#6a5a4a';
      ctx.fillRect(x + 2 * scale, y + 2 * scale, size - 4 * scale, size - 4 * scale);
      ctx.fillStyle = '#5a4a3a';
      ctx.fillRect(x + 3 * scale, y + 3 * scale, size - 6 * scale, size - 6 * scale);
      break;

    case TILE.PLANT_SMALL:
      ctx.fillStyle = '#4a7a5a';
      ctx.fillRect(x + 4 * scale, y + 6 * scale, size - 8 * scale, size - 6 * scale);
      ctx.fillStyle = '#6a4a3a';
      ctx.fillRect(x + 5 * scale, y + size - 4 * scale, size - 10 * scale, 4 * scale);
      // Leaves
      ctx.fillStyle = '#5a9a6a';
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2 - 2 * scale, 4 * scale, 0, Math.PI * 2);
      ctx.fill();
      break;

    case TILE.PLANT_LARGE:
      ctx.fillStyle = '#4a7a5a';
      ctx.fillRect(x + 3 * scale, y + 4 * scale, size - 6 * scale, size - 4 * scale);
      ctx.fillStyle = '#6a4a3a';
      ctx.fillRect(x + 4 * scale, y + size - 4 * scale, size - 8 * scale, 4 * scale);
      // Leaves
      ctx.fillStyle = '#5a9a6a';
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, 6 * scale, 0, Math.PI * 2);
      ctx.fill();
      break;

    case TILE.WATER_COOLER:
      ctx.fillStyle = '#6a8afa';
      ctx.fillRect(x + 3 * scale, y + 2 * scale, size - 6 * scale, size - 4 * scale);
      ctx.fillStyle = '#aaa';
      ctx.fillRect(x + 4 * scale, y + size - 5 * scale, size - 8 * scale, 3 * scale);
      ctx.fillStyle = '#8ac';
      ctx.fillRect(x + 5 * scale, y + size - 3 * scale, size - 10 * scale, 2 * scale);
      break;

    case TILE.TV:
      ctx.fillStyle = '#333';
      ctx.fillRect(x + 2 * scale, y + 3 * scale, size - 4 * scale, size - 6 * scale);
      ctx.fillStyle = '#446';
      ctx.fillRect(x + 3 * scale, y + 4 * scale, size - 6 * scale, size - 8 * scale);
      ctx.fillStyle = '#6a8afa';
      ctx.fillRect(x + 4 * scale, y + 5 * scale, size - 8 * scale, size - 10 * scale);
      break;

    case TILE.BOOKSHELF:
      ctx.fillStyle = '#5a4a3a';
      ctx.fillRect(x, y, size, size);
      ctx.fillStyle = '#4a3a2a';
      ctx.fillRect(x + 2 * scale, y + 2 * scale, size - 4 * scale, size - 4 * scale);
      // Books
      ctx.fillStyle = '#a44';
      ctx.fillRect(x + 3 * scale, y + 4 * scale, 3 * scale, 6 * scale);
      ctx.fillStyle = '#4a4';
      ctx.fillRect(x + 7 * scale, y + 3 * scale, 3 * scale, 7 * scale);
      ctx.fillStyle = '#44a';
      ctx.fillRect(x + 11 * scale, y + 5 * scale, 2 * scale, 5 * scale);
      break;

    case TILE.RUG:
      ctx.fillStyle = '#6a5a4a';
      ctx.fillRect(x, y, size, size);
      ctx.fillStyle = '#7a6a5a';
      ctx.fillRect(x + 2 * scale, y + 2 * scale, size - 4 * scale, size - 4 * scale);
      break;

    case TILE.EMPTY:
    default:
      // Don't draw
      break;
  }
}

// Render the office map
function renderOfficeMap(ctx, offsetX, offsetY, scale) {
  for (let y = 0; y < MAP_HEIGHT; y++) {
    for (let x = 0; x < MAP_WIDTH; x++) {
      const tileId = OFFICE_MAP[y][x];
      if (tileId !== TILE.EMPTY) {
        drawTile(
          ctx,
          tileId,
          offsetX + x * TILE_SIZE * scale,
          offsetY + y * TILE_SIZE * scale,
          scale
        );
      }
    }
  }
}

// Get office pixel size
function getOfficePixelSize() {
  return {
    width: MAP_WIDTH * TILE_SIZE,
    height: MAP_HEIGHT * TILE_SIZE
  };
}

// Character sprite data
const CHARACTERS_SPRITES = [
  { id: 'nova', color: '#ff6b9d', name: 'Nova' },
  { id: 'zero1', color: '#6bff6b', name: 'Zero' },
  { id: 'zero2', color: '#6bffff', name: 'Zero-2' },
  { id: 'zero3', color: '#6b6bff', name: 'Zero-3' },
  { id: 'delta', color: '#ffff6b', name: 'Delta' },
  { id: 'bestie', color: '#ff9d6b', name: 'Bestie' },
  { id: 'dexter', color: '#9d6bff', name: 'Dexter' },
  { id: 'flash', color: '#ff6b6b', name: 'Flash' }
];

// Draw a character sprite
function drawCharacterSprite(ctx, charId, x, y, scale, frame = 0) {
  const size = TILE_SIZE * scale;
  const charData = CHARACTERS_SPRITES.find(c => c.id === charId) || { color: '#ff00ff' };

  // Try to draw from sprite sheet first
  if (spritesReady.chars && spriteSheets.chars) {
    const charIndex = CHARACTERS_SPRITES.findIndex(c => c.id === charId);
    if (charIndex >= 0) {
      ctx.drawImage(
        spriteSheets.chars,
        charIndex * TILE_SIZE, 0, TILE_SIZE, TILE_SIZE,
        x - size / 2, y - size / 2, size, size
      );
      return;
    }
  }

  // Fallback: draw pixel art character
  const c = charData.color;
  const cx = x;
  const cy = y;
  const s = scale;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + size * 0.4, size * 0.3, size * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body
  ctx.fillStyle = c;
  ctx.fillRect(cx - 5 * s, cy - 6 * s, 10 * s, 10 * s);

  // Highlight
  ctx.fillStyle = c + '88';
  ctx.fillRect(cx - 4 * s, cy - 5 * s, 4 * s, 4 * s);

  // Dark side
  ctx.fillStyle = c + '44';
  ctx.fillRect(cx + 1 * s, cy + 1 * s, 4 * s, 4 * s);

  // Eyes
  ctx.fillStyle = '#fff';
  ctx.fillRect(cx - 3 * s, cy - 3 * s, 2 * s, 3 * s);
  ctx.fillRect(cx + 1 * s, cy - 3 * s, 2 * s, 3 * s);

  // Pupils
  ctx.fillStyle = '#000';
  ctx.fillRect(cx - 2 * s, cy - 2 * s, 1 * s, 1 * s);
  ctx.fillRect(cx + 2 * s, cy - 2 * s, 1 * s, 1 * s);

  // Border
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1;
  ctx.strokeRect(cx - 5 * s, cy - 6 * s, 10 * s, 10 * s);
}

// Export
window.TILE_SIZE = TILE_SIZE;
window.MAP_WIDTH = MAP_WIDTH;
window.MAP_HEIGHT = MAP_HEIGHT;
window.OFFICE_MAP = OFFICE_MAP;
window.TILE = TILE;
window.initTileRenderer = initTileRenderer;
window.renderOfficeMap = renderOfficeMap;
window.getOfficePixelSize = getOfficePixelSize;
window.drawCharacterSprite = drawCharacterSprite;
window.CHARACTERS_SPRITES = CHARACTERS_SPRITES;
window.spritesReady = spritesReady;
