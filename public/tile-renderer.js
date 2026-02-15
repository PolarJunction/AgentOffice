/**
 * Tile-based Office Renderer
 * Uses 16x16 pixel tiles from sprite sheets
 */

const TILE_SIZE = 16;

// Tile IDs for the office map
const TILES = {
  // Floor types
  FLOOR_DARK: 0,
  FLOOR_LIGHT: 1,
  FLOOR_WOOD: 2,
  FLOOR_CARPET: 3,

  // Walls
  WALL_TOP: 10,
  WALL_BOTTOM: 11,
  WALL_LEFT: 12,
  WALL_RIGHT: 13,
  WALL_CORNER_TL: 14,
  WALL_CORNER_TR: 15,
  WALL_CORNER_BL: 16,
  WALL_CORNER_BR: 17,

  // Furniture
  DESK: 20,
  DESK_WITH_PC: 21,
  CHAIR: 22,
  CHAIR_DOWN: 23,

  // Kitchen
  COUNTER: 30,
  SINK: 31,
  FRIDGE: 32,
  COFFEE_MACHINE: 33,
  MICROWAVE: 34,

  // Lounge
  COUCH: 40,
  COUCH_SINGLE: 41,
  TABLE_COFFEE: 42,
  PLANT_SMALL: 50,
  PLANT_LARGE: 51,

  // Misc
  RUG: 60,
  LAMP: 61,
  CLOCK: 62,
  WATER_COOLER: 63,
  TV: 64,

  // Pods
  POD: 70,
  POD_SIDE: 71,

  // Empty/Background
  EMPTY: 255
};

// Office layout - 40x30 tiles (640x480 pixels at 16x16)
// Each row is one Y tile, each number is the X tile
const OFFICE_MAP = [
  // Row 0-2: Top wall
  [10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10],
  [12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,13],
  [12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,13],
  // Row 3-5: Kitchen area (left side)
  [12,30,30,30,30,30,30,30,30,31,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,13],
  [12,30,32,0,0,0,33,30,30,31,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,13],
  [12,30,0,0,0,0,0,0,30,31,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,13],
  // Row 6-8: Kitchen/Lounge transition
  [12,30,0,0,0,0,0,0,30,30,30,30,30,30,30,30,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,13],
  [12,0,0,0,0,0,0,0,0,0,0,0,40,40,40,40,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,13],
  [12,0,0,0,0,0,0,0,0,0,0,0,41,0,0,41,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,13],
  // Row 9-11: Lounge area with couch
  [12,0,0,0,0,0,0,0,0,0,0,0,41,0,0,41,0,42,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,13],
  [12,0,0,0,0,0,0,0,0,0,0,0,41,0,0,41,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,13],
  [12,0,0,0,50,0,0,0,0,0,0,0,40,40,40,40,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,13],
  // Row 12-14: Lounge bottom / hallway start
  [12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,13],
  [12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,13],
  [12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,13],
  // Row 15-17: Hallway (middle)
  [12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,13],
  [12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,13],
  [12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,13],
  // Row 18-20: Right side - desks area
  [12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,20,21,22,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,13],
  [12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,20,21,22,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,13],
  [12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,20,21,22,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,13],
  // Row 21-23: More desks
  [12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,20,21,22,0,20,21,22,0,0,0,0,0,0,0,0,0,0,0,13],
  [12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,20,21,22,0,20,21,22,0,0,0,0,0,0,0,0,0,0,0,13],
  [12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,20,21,22,0,0,0,0,0,0,0,0,0,0,0,13],
  // Row 24-26: Nova's office area
  [12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,13],
  [12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,20,21,22,0,0,0,0,0,0,0,13],
  [12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,20,21,22,0,0,0,0,0,0,0,13],
  // Row 27-29: Bottom wall
  [11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

// Sprite sheet cache
const spriteSheets = {};
const TILE_SOURCES = {
  // Use the main office sprite sheet for most tiles
  DEFAULT: 'Modern_Office_16x16.png',
  // Use interiors for specific areas
  KITCHEN: '12_Kitchen_16x16.png',
  GENERIC: '1_Generic_16x16.png',
  LIVING: '2_LivingRoom_16x16.png'
};

// Load a sprite sheet
function loadSpriteSheet(name, src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      spriteSheets[name] = img;
      resolve(img);
    };
    img.onerror = reject;
    img.src = '/tiles/' + src;
  });
}

// Initialize tile renderer
async function initTileRenderer() {
  try {
    await Promise.all([
      loadSpriteSheet('office', 'Modern_Office_16x16.png'),
      loadSpriteSheet('kitchen', '12_Kitchen_16x16.png'),
      loadSpriteSheet('generic', '1_Generic_16x16.png'),
      loadSpriteSheet('living', '2_LivingRoom_16x16.png'),
      loadSpriteSheet('characters', 'Modern_Office_16x16.png')
    ]);
    console.log('Tile renderer initialized');
    return true;
  } catch (e) {
    console.error('Failed to load sprite sheets:', e);
    return false;
  }
}

// Draw a single tile
function drawTile(ctx, tileId, x, y, scale) {
  const size = TILE_SIZE * scale;

  // Default to office sprite sheet
  let sheet = spriteSheets['office'];
  let srcX = 0, srcY = 0;

  // Map tile IDs to sprite sheet coordinates
  // This is a simplified mapping - would need to be adjusted based on actual sprite sheet
  switch (tileId) {
    case TILES.FLOOR_DARK:
      srcX = 0; srcY = 0; break;
    case TILES.FLOOR_LIGHT:
      srcX = 1; srcY = 0; break;
    case TILES.WALL_TOP:
      sheet = spriteSheets['generic']; srcX = 1; srcY = 1; break;
    case TILES.WALL_BOTTOM:
      sheet = spriteSheets['generic']; srcX = 1; srcY = 2; break;
    case TILES.WALL_LEFT:
      sheet = spriteSheets['generic']; srcX = 0; srcY = 1; break;
    case TILES.WALL_RIGHT:
      sheet = spriteSheets['generic']; srcX = 2; srcY = 1; break;
    case TILES.DESK:
      sheet = spriteSheets['office']; srcX = 5; srcY = 3; break;
    case TILES.DESK_WITH_PC:
      sheet = spriteSheets['office']; srcX = 6; srcY = 3; break;
    case TILES.CHAIR:
    case TILES.CHAIR_DOWN:
      sheet = spriteSheets['office']; srcX = 4; srcY = 3; break;
    case TILES.COUNTER:
      sheet = spriteSheets['kitchen']; srcX = 1; srcY = 5; break;
    case TILES.SINK:
      sheet = spriteSheets['kitchen']; srcX = 2; srcY = 5; break;
    case TILES.FRIDGE:
      sheet = spriteSheets['kitchen']; srcX = 3; srcY = 5; break;
    case TILES.COFFEE_MACHINE:
      sheet = spriteSheets['kitchen']; srcX = 4; srcY = 5; break;
    case TILES.COUCH:
      sheet = spriteSheets['living']; srcX = 5; srcY = 6; break;
    case TILES.COUCH_SINGLE:
      sheet = spriteSheets['living']; srcX = 5; srcY = 7; break;
    case TILES.TABLE_COFFEE:
      sheet = spriteSheets['living']; srcX = 6; srcY = 6; break;
    case TILES.PLANT_SMALL:
      sheet = spriteSheets['office']; srcX = 8; srcY = 0; break;
    case TILES.PLANT_LARGE:
      sheet = spriteSheets['office']; srcX = 9; srcY = 0; break;
    case TILES.POD:
      sheet = spriteSheets['office']; srcX = 10; srcY = 3; break;
    case TILES.POD_SIDE:
      sheet = spriteSheets['office']; srcX = 11; srcY = 3; break;
    case TILES.WATER_COOLER:
      sheet = spriteSheets['office']; srcX = 12; srcY = 0; break;
    case TILES.EMPTY:
    default:
      return; // Don't draw anything
  }

  if (sheet) {
    ctx.drawImage(
      sheet,
      srcX * TILE_SIZE, srcY * TILE_SIZE, TILE_SIZE, TILE_SIZE,
      x, y, size, size
    );
  }
}

// Render the entire office map
function renderOfficeMap(ctx, offsetX, offsetY, scale) {
  const mapHeight = OFFICE_MAP.length;
  const mapWidth = OFFICE_MAP[0].length;

  for (let y = 0; y < mapHeight; y++) {
    for (let x = 0; x < mapWidth; x++) {
      const tileId = OFFICE_MAP[y][x];
      if (tileId !== TILES.EMPTY) {
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

// Render a character sprite
function renderCharacter(ctx, spriteSheet, frame, x, y, scale) {
  if (!spriteSheet) return;

  const size = TILE_SIZE * scale;
  // Assuming sprite sheet has characters in a row, frame animates through them
  ctx.drawImage(
    spriteSheet,
    frame * TILE_SIZE, 0, TILE_SIZE, TILE_SIZE,
    x, y, size, size
  );
}

// Export functions
window.TILE_SIZE = TILE_SIZE;
window.OFFICE_MAP = OFFICE_MAP;
window.TILES = TILES;
window.initTileRenderer = initTileRenderer;
window.renderOfficeMap = renderOfficeMap;
window.renderCharacter = renderCharacter;
window.spriteSheets = spriteSheets;
