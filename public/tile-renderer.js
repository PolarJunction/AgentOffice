/**
 * Tile-based Office Renderer
 * Uses 16x16 pixel tiles from sprite sheets
 */

const TILE_SIZE = 16;
const MAP_WIDTH = 50;
const MAP_HEIGHT = 40;

// Tile types - simplified mapping
const TILE = {
  EMPTY: 0,
  FLOOR: 1,
  FLOOR_LIGHT: 2,
  WALL_TOP: 10,
  WALL_BOTTOM: 11,
  WALL_LEFT: 12,
  WALL_RIGHT: 13,
  WALL_HORIZ: 14,
  WALL_VERT: 15,
  // Kitchen
  COUNTER: 30,
  COUNTER_EDGE: 31,
  SINK: 32,
  FRIDGE: 33,
  COFFEE: 34,
  MICROWAVE: 35,
  // Furniture
  DESK: 40,
  DESK_PC: 41,
  CHAIR_UP: 42,
  CHAIR_DOWN: 43,
  CHAIR_LEFT: 44,
  CHAIR_RIGHT: 45,
  // Lounge
  COUCH: 50,
  COUCH_SINGLE: 51,
  TABLE_RECT: 52,
  TABLE_SQUARE: 53,
  // Decor
  PLANT_SMALL: 60,
  PLANT_LARGE: 61,
  RUG: 62,
  LAMP: 63,
  WATER_COOLER: 64,
  TV: 65,
  CLOCK: 66,
  BOOKSHELF: 67,
  // Pods
  POD: 70,
  // Doors/Openings
  DOOR: 80,
  DOOR_OPEN: 81,
};

// Create the office map (50x40 tiles = 800x640 pixels at 16x16)
// This creates a nice office layout
function createOfficeMap() {
  const map = [];

  // Initialize with empty
  for (let y = 0; y < MAP_HEIGHT; y++) {
    map[y] = new Array(MAP_WIDTH).fill(TILE.EMPTY);
  }

  // Fill with floor
  for (let y = 2; y < MAP_HEIGHT - 2; y++) {
    for (let x = 2; x < MAP_WIDTH - 2; x++) {
      map[y][x] = TILE.FLOOR;
    }
  }

  // Top wall (row 0-1)
  for (let x = 0; x < MAP_WIDTH; x++) {
    map[0][x] = TILE.WALL_TOP;
    map[1][x] = TILE.EMPTY;
  }

  // Bottom wall
  for (let x = 0; x < MAP_WIDTH; x++) {
    map[MAP_HEIGHT - 2][x] = TILE.WALL_BOTTOM;
    map[MAP_HEIGHT - 1][x] = TILE.EMPTY;
  }

  // Left wall
  for (let y = 0; y < MAP_HEIGHT; y++) {
    map[y][0] = TILE.WALL_LEFT;
    map[y][1] = TILE.EMPTY;
  }

  // Right wall
  for (let y = 0; y < MAP_HEIGHT; y++) {
    map[y][MAP_WIDTH - 1] = TILE.WALL_RIGHT;
    map[y][MAP_WIDTH - 2] = TILE.EMPTY;
  }

  // ===== KITCHEN AREA (top-left) =====
  // Kitchen counter along top
  for (let x = 2; x < 12; x++) {
    map[3][x] = TILE.COUNTER;
    map[4][x] = TILE.COUNTER_EDGE;
  }
  // Fridge
  map[3][12] = TILE.FRIDGE;
  map[4][12] = TILE.FRIDGE;
  // Counter continue
  for (let x = 13; x < 18; x++) {
    map[3][x] = TILE.COUNTER;
    map[4][x] = TILE.COUNTER_EDGE;
  }
  // Coffee machine
  map[3][18] = TILE.COFFEE;
  map[4][18] = TILE.COUNTER_EDGE;
  // More counter
  for (let x = 19; x < 24; x++) {
    map[3][x] = TILE.COUNTER;
    map[4][x] = TILE.COUNTER_EDGE;
  }

  // Kitchen floor markers
  for (let y = 5; y < 12; y++) {
    for (let x = 2; x < 24; x++) {
      map[y][x] = TILE.FLOOR_LIGHT;
    }
  }

  // ===== LOUNGE AREA (middle-left) =====
  // Lounge floor
  for (let y = 8; y < 18; y++) {
    for (let x = 2; x < 20; x++) {
      map[y][x] = TILE.FLOOR;
    }
  }

  // Couch (top of lounge)
  for (let x = 6; x < 14; x++) {
    map[8][x] = TILE.COUCH;
  }
  // Couch chairs
  map[9][6] = TILE.COUCH_SINGLE;
  map[9][13] = TILE.COUCH_SINGLE;

  // Coffee table
  for (let x = 8; x < 12; x++) {
    map[11][x] = TILE.TABLE_RECT;
  }

  // More seating
  for (let x = 14; x < 18; x++) {
    map[14][x] = TILE.COUCH;
  }

  // Plants
  map[9][3] = TILE.PLANT_LARGE;
  map[15][3] = TILE.PLANT_SMALL;

  // Water cooler
  map[17][18] = TILE.WATER_COOLER;

  // ===== HALLWAY (center) =====
  // Hallway floor
  for (let y = 15; y < 25; y++) {
    for (let x = 20; x < 30; x++) {
      map[y][x] = TILE.FLOOR;
    }
  }

  // ===== WORKSPACE AREA (right side) =====
  // Row 1 of desks
  for (let x = 25; x < 35; x++) {
    map[8][x] = TILE.DESK;
    map[9][x] = TILE.DESK_PC;
    map[10][x] = TILE.CHAIR_UP;
  }

  // Row 2 of desks
  for (let x = 25; x < 35; x++) {
    map[13][x] = TILE.DESK;
    map[14][x] = TILE.DESK_PC;
    map[15][x] = TILE.CHAIR_UP;
  }

  // Row 3 of desks
  for (let x = 35; x < 45; x++) {
    map[13][x] = TILE.DESK;
    map[14][x] = TILE.DESK_PC;
    map[15][x] = TILE.CHAIR_UP;
  }

  // Nova's corner office (top right)
  for (let y = 3; y < 8; y++) {
    for (let x = 38; x < 48; x++) {
      map[y][x] = TILE.FLOOR_LIGHT;
    }
  }
  // Nova's desk
  for (let x = 42; x < 46; x++) {
    map[5][x] = TILE.DESK;
    map[6][x] = TILE.DESK_PC;
    map[7][x] = TILE.CHAIR_UP;
  }
  // Bookshelf
  map[3][45] = TILE.BOOKSHELF;
  map[4][45] = TILE.BOOKSHELF;
  map[5][45] = TILE.BOOKSHELF;

  // Plant in corner
  map[3][40] = TILE.PLANT_LARGE;

  // TV
  map[12][40] = TILE.TV;

  return map;
}

const OFFICE_MAP = createOfficeMap();

// Sprite sheets
const spriteSheets = {};
const spritesLoaded = { office: false, kitchen: false, living: false };

// Tile to sprite mapping - these need to be adjusted based on actual sprite sheet
const TILE_SPRITES = {
  // Generic floor
  [TILE.FLOOR]: { sheet: 'office', x: 0, y: 0 },
  [TILE.FLOOR_LIGHT]: { sheet: 'office', x: 1, y: 0 },

  // Walls
  [TILE.WALL_TOP]: { sheet: 'office', x: 0, y: 2 },
  [TILE.WALL_BOTTOM]: { sheet: 'office', x: 0, y: 3 },
  [TILE.WALL_LEFT]: { sheet: 'office', x: 1, y: 2 },
  [TILE.WALL_RIGHT]: { sheet: 'office', x: 1, y: 3 },

  // Kitchen
  [TILE.COUNTER]: { sheet: 'kitchen', x: 1, y: 5 },
  [TILE.COUNTER_EDGE]: { sheet: 'kitchen', x: 1, y: 6 },
  [TILE.SINK]: { sheet: 'kitchen', x: 2, y: 5 },
  [TILE.FRIDGE]: { sheet: 'kitchen', x: 3, y: 5 },
  [TILE.COFFEE]: { sheet: 'kitchen', x: 4, y: 5 },
  [TILE.MICROWAVE]: { sheet: 'kitchen', x: 5, y: 5 },

  // Furniture
  [TILE.DESK]: { sheet: 'office', x: 5, y: 3 },
  [TILE.DESK_PC]: { sheet: 'office', x: 6, y: 3 },
  [TILE.CHAIR_UP]: { sheet: 'office', x: 4, y: 3 },
  [TILE.CHAIR_DOWN]: { sheet: 'office', x: 4, y: 4 },
  [TILE.CHAIR_LEFT]: { sheet: 'office', x: 5, y: 4 },
  [TILE.CHAIR_RIGHT]: { sheet: 'office', x: 3, y: 3 },

  // Lounge
  [TILE.COUCH]: { sheet: 'living', x: 5, y: 6 },
  [TILE.COUCH_SINGLE]: { sheet: 'living', x: 5, y: 7 },
  [TILE.TABLE_RECT]: { sheet: 'living', x: 6, y: 6 },
  [TILE.TABLE_SQUARE]: { sheet: 'living', x: 7, y: 6 },

  // Decor
  [TILE.PLANT_SMALL]: { sheet: 'office', x: 8, y: 0 },
  [TILE.PLANT_LARGE]: { sheet: 'office', x: 9, y: 0 },
  [TILE.LAMP]: { sheet: 'office', x: 10, y: 0 },
  [TILE.WATER_COOLER]: { sheet: 'office', x: 12, y: 0 },
  [TILE.TV]: { sheet: 'office', x: 13, y: 0 },
  [TILE.CLOCK]: { sheet: 'office', x: 14, y: 0 },
  [TILE.BOOKSHELF]: { sheet: 'office', x: 15, y: 0 },
  [TILE.RUG]: { sheet: 'living', x: 8, y: 8 },

  // Pods
  [TILE.POD]: { sheet: 'office', x: 10, y: 3 },
};

// Character sprites (16x16 each)
const CHARACTER_SPRITES = {
  nova: { sheet: 'chars', frame: 0, color: '#ff6b9d' },
  zero1: { sheet: 'chars', frame: 1, color: '#6bff6b' },
  zero2: { sheet: 'chars', frame: 2, color: '#6bffff' },
  zero3: { sheet: 'chars', frame: 3, color: '#6b6bff' },
  delta: { sheet: 'chars', frame: 4, color: '#ffff6b' },
  bestie: { sheet: 'chars', frame: 5, color: '#ff9d6b' },
  dexter: { sheet: 'chars', frame: 6, color: '#9d6bff' },
  flash: { sheet: 'chars', frame: 7, color: '#ff6b6b' },
};

// Load a sprite sheet
function loadSpriteSheet(name, src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      spriteSheets[name] = img;
      spritesLoaded[name] = true;
      console.log(`Loaded sprite sheet: ${name}`);
      resolve(img);
    };
    img.onerror = () => {
      console.warn(`Failed to load sprite: ${src}`);
      resolve(null);
    };
    img.src = '/tiles/' + src;
  });
}

// Initialize tile renderer
async function initTileRenderer() {
  try {
    await Promise.all([
      loadSpriteSheet('office', 'Modern_Office_16x16.png'),
      loadSpriteSheet('kitchen', '12_Kitchen_16x16.png'),
      loadSpriteSheet('living', '2_LivingRoom_16x16.png'),
      loadSpriteSheet('generic', '1_Generic_16x16.png'),
    ]);

    // Try to load character sprites
    for (let i = 1; i <= 8; i++) {
      const name = `char${i}`;
      const img = new Image();
      img.onload = () => {
        spriteSheets[name] = img;
        console.log(`Loaded character sprite: ${name}`);
      };
      img.onerror = () => {
        // Character sprites optional
      };
      // Try different naming conventions
      img.src = `/tiles/characters/agent0${i}.png`;
    }

    console.log('Tile renderer initialized');
    return true;
  } catch (e) {
    console.error('Failed to initialize tile renderer:', e);
    return false;
  }
}

// Draw a single tile
function drawTile(ctx, tileId, x, y, scale) {
  if (tileId === TILE.EMPTY) return;

  const sprite = TILE_SPRITES[tileId];
  if (!sprite) return;

  const sheet = spriteSheets[sprite.sheet];
  if (!sheet) return;

  const size = TILE_SIZE * scale;

  ctx.drawImage(
    sheet,
    sprite.x * TILE_SIZE, sprite.y * TILE_SIZE, TILE_SIZE, TILE_SIZE,
    Math.floor(x), Math.floor(y), size, size
  );
}

// Render the entire office map
function renderOfficeMap(ctx, offsetX, offsetY, scale) {
  const mapHeight = OFFICE_MAP.length;
  const mapWidth = OFFICE_MAP[0].length;

  for (let y = 0; y < mapHeight; y++) {
    for (let x = 0; x < mapWidth; x++) {
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

// Get office dimensions in pixels
function getOfficePixelSize() {
  return {
    width: MAP_WIDTH * TILE_SIZE,
    height: MAP_HEIGHT * TILE_SIZE
  };
}

// Convert character position to tile position
function characterToTile(character) {
  return {
    x: character.offsetX * MAP_WIDTH,
    y: character.offsetY * MAP_HEIGHT
  };
}

// Convert tile to pixel position
function tileToPixel(tileX, tileY, offsetX, offsetY, scale) {
  return {
    x: offsetX + tileX * TILE_SIZE * scale,
    y: offsetY + tileY * TILE_SIZE * scale
  };
}

// Render a character sprite at position
function renderCharacterSprite(ctx, charData, x, y, scale, frame = 0) {
  const size = TILE_SIZE * scale;

  // Try to find character sprite
  const spriteKey = Object.keys(CHARACTER_SPRITES).find(k => CHARACTER_SPRITES[k].frame === frame);
  const charSprite = CHARACTER_SPRITES[spriteKey];

  if (charSprite && spriteSheets.chars) {
    // Draw from character sprite sheet
    ctx.drawImage(
      spriteSheets.chars,
      frame * TILE_SIZE, 0, TILE_SIZE, TILE_SIZE,
      Math.floor(x - size / 2), Math.floor(y - size / 2), size, size
    );
  } else {
    // Fallback: draw colored square
    ctx.fillStyle = charData.color || '#ff0000';
    ctx.fillRect(Math.floor(x - size / 2), Math.floor(y - size / 2), size, size);

    // Draw border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(Math.floor(x - size / 2), Math.floor(y - size / 2), size, size);
  }
}

// Export functions
window.TILE_SIZE = TILE_SIZE;
window.MAP_WIDTH = MAP_WIDTH;
window.MAP_HEIGHT = MAP_HEIGHT;
window.OFFICE_MAP = OFFICE_MAP;
window.TILE = TILE;
window.initTileRenderer = initTileRenderer;
window.renderOfficeMap = renderOfficeMap;
window.getOfficePixelSize = getOfficePixelSize;
window.characterToTile = characterToTile;
window.tileToPixel = tileToPixel;
window.renderCharacterSprite = renderCharacterSprite;
window.spritesLoaded = spritesLoaded;
