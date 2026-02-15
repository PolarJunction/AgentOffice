/**
 * Tile-based Office Renderer
 * Uses 16x16 pixel tiles rendered from actual tileset sprite sheets
 * 
 * Tilesets:
 *   - office_furniture_16x16.png (256×848, 16col × 53row) - Office furniture
 *   - floors_16x16.png (240×640, 15col × 40row) - Floor tiles
 *   - walls_16x16.png (512×640, 32col × 40row) - Wall tiles
 *   - characters/agent01-07.png (896×656 each) - Character sprites
 */

const TILE_SIZE = 16;
const MAP_WIDTH = 50;
const MAP_HEIGHT = 35;

// Character frame dimensions in the sprite sheets
const CHAR_FRAME_W = 16;
const CHAR_FRAME_H = 32;

// Tile types
const TILE = {
  EMPTY: 0,
  FLOOR_DARK: 1,
  FLOOR_LIGHT: 2,
  WALL_TOP: 10,
  WALL_FRONT: 11,
  WALL_LEFT: 12,
  WALL_RIGHT: 13,
  WALL: 10,
  WALL_CORNER_TL: 14,
  WALL_CORNER_TR: 15,
  WALL_CORNER_BL: 16,
  WALL_CORNER_BR: 17,
  COUNTER: 30,
  COUNTER_EDGE: 31,
  SINK: 32,
  FRIDGE: 33,
  COFFEE: 34,
  DESK_TOP: 40,
  DESK_FRONT: 41,
  DESK_PC: 42,
  CHAIR: 43,
  COUCH_L: 50,
  COUCH_M: 51,
  COUCH_R: 52,
  TABLE: 53,
  PLANT_SMALL: 60,
  PLANT_LARGE: 61,
  WATER_COOLER: 62,
  TV: 63,
  BOOKSHELF: 64,
  RUG: 70,
  DIVIDER: 80,
};

// Character color map (fallback)
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

// ============================================================================
// Tile coordinate mapping (verified via tile-viewer.html grid overlay)
// ============================================================================
// Each entry: { sheet, col, row, w?, h? }
// sheet: 'office' | 'floor' | 'wall'
// col/row: tile column/row in sheet (16px grid)
// w/h: size in tiles (default 1)
// ============================================================================

const TILE_COORDS = {
  // --- Floors (from floors_16x16.png, 15col × 40row) ---
  // 5 color groups of 3 cols each: 0-2=blue/gray, 3-5=cream, 6-8=pink, 9-11=gray, 12-14=dark/wood
  // rows 0-1 are basic solids, rows 2-3 = subtle grid pattern
  [TILE.FLOOR_DARK]: { sheet: 'floor', col: 10, row: 2 },   // neutral gray tile
  [TILE.FLOOR_LIGHT]: { sheet: 'floor', col: 4, row: 2 },   // warm cream tile
  [TILE.RUG]: { sheet: 'floor', col: 13, row: 0 },   // dark wood look

  // --- Walls (from walls_16x16.png, 32col × 40row) ---
  // Wall color groups span 4 cols × 5 rows each
  // cols 0-3 = diamond/decorative, 4-7 = white/light, 8-11 = tan/beige, 12-15 = wood
  // Within each 4-col group: row+0 = top crown/trim, row+1 = body upper, row+2 = body center
  //                          row+3 = baseboard, row+4 = shadow
  // The white walls are at cols 4-7, starting at row 0
  [TILE.WALL]: { sheet: 'wall', col: 5, row: 0 },   // wall top (white trim)
  [TILE.WALL_FRONT]: { sheet: 'wall', col: 5, row: 2 },   // wall body (white, clean)
  [TILE.WALL_LEFT]: { sheet: 'wall', col: 4, row: 1 },   // left edge
  [TILE.WALL_RIGHT]: { sheet: 'wall', col: 7, row: 1 },   // right edge
  [TILE.WALL_CORNER_TL]: { sheet: 'wall', col: 4, row: 0 },   // top-left corner
  [TILE.WALL_CORNER_TR]: { sheet: 'wall', col: 7, row: 0 },   // top-right corner

  // --- Kitchen items (from office_furniture_16x16.png, 16col × 53row) ---
  // Verified from tile viewer grid:
  // Rows 0-3: Large beige desks (each ~5 tiles × 2 rows for top+front)
  //   - cols 0-4 = beige desk, 5-9 = darker desk, 10-13 = gray desk
  // Row 8: Gray office chairs (cols 0-3), tall plant (col 5), small monitors
  // Row 10-11: Brown leather armchairs
  // Row 12-13: Wall art, plants, blue chairs, electronics
  [TILE.COUNTER]: { sheet: 'office', col: 1, row: 0 },   // beige desk top as counter surface
  [TILE.COUNTER_EDGE]: { sheet: 'office', col: 1, row: 2 },   // desk front as counter edge
  [TILE.FRIDGE]: { sheet: 'office', col: 15, row: 0 },   // use picture/tall item
  [TILE.COFFEE]: { sheet: 'office', col: 6, row: 10 },  // small appliance-like item

  // --- Desks (from office_furniture_16x16.png) ---
  // Desk set at cols 5-9: top row=0 (surface), row 2 (front panel with dark drawers)
  [TILE.DESK_TOP]: { sheet: 'office', col: 6, row: 0 },   // desk surface center tile
  [TILE.DESK_FRONT]: { sheet: 'office', col: 6, row: 2 },   // desk front/drawer panel
  [TILE.DESK_PC]: { sheet: 'office', col: 7, row: 8 },   // small monitor on desk
  [TILE.CHAIR]: { sheet: 'office', col: 0, row: 8 },   // gray office chair

  // --- Lounge furniture (from office_furniture_16x16.png) ---
  // Purple/lavender couch at row 4, cols 0-3 (the large panel piece)
  [TILE.COUCH_L]: { sheet: 'office', col: 0, row: 4 },   // couch left
  [TILE.COUCH_M]: { sheet: 'office', col: 1, row: 4 },   // couch middle
  [TILE.COUCH_R]: { sheet: 'office', col: 3, row: 4 },   // couch right
  [TILE.TABLE]: { sheet: 'office', col: 7, row: 0 },   // desk surface used as table

  // --- Decorations (from office_furniture_16x16.png) ---
  [TILE.PLANT_SMALL]: { sheet: 'office', col: 5, row: 8 },  // potted plant
  [TILE.PLANT_LARGE]: { sheet: 'office', col: 5, row: 9 },  // plant bottom/large
  [TILE.WATER_COOLER]: { sheet: 'office', col: 6, row: 11 },  // appliance or cooler
  [TILE.TV]: { sheet: 'office', col: 8, row: 11 },  // monitor/TV
  [TILE.BOOKSHELF]: { sheet: 'office', col: 10, row: 0 },  // gray desk/shelf top
  [TILE.DIVIDER]: { sheet: 'office', col: 10, row: 2 },  // gray desk front as divider
};

// ============================================================================
// Sprite sheet management
// ============================================================================

const spriteSheets = {};
const charSheets = {};  // Individual character sprite sheets
const spritesReady = { office: false, floor: false, wall: false, chars: false };
let sheetsLoaded = false;

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => {
      console.warn('Failed to load:', src);
      resolve(null);
    };
    img.src = src;
  });
}

// Character sheet mapping: id -> sheet file number
const CHAR_SHEET_MAP = {
  nova: 'agent01',
  zero1: 'agent02',
  zero2: 'agent03',
  zero3: 'agent04',
  delta: 'agent05',
  bestie: 'agent06',
  dexter: 'agent07',
  flash: 'agent01'  // fallback to agent01 for flash
};

async function initTileRenderer() {
  // Load tile sheets
  const [officeImg, floorImg, wallImg] = await Promise.all([
    loadImage('/tiles/office_furniture_16x16.png'),
    loadImage('/tiles/floors_16x16.png'),
    loadImage('/tiles/walls_16x16.png'),
  ]);

  if (officeImg) {
    spriteSheets.office = officeImg;
    spritesReady.office = true;
    console.log(`Office tileset loaded: ${officeImg.width}×${officeImg.height}`);
  }
  if (floorImg) {
    spriteSheets.floor = floorImg;
    spritesReady.floor = true;
    console.log(`Floor tileset loaded: ${floorImg.width}×${floorImg.height}`);
  }
  if (wallImg) {
    spriteSheets.wall = wallImg;
    spritesReady.wall = true;
    console.log(`Wall tileset loaded: ${wallImg.width}×${wallImg.height}`);
  }

  // Load individual character sprite sheets
  const charIds = ['agent01', 'agent02', 'agent03', 'agent04', 'agent05', 'agent06', 'agent07'];
  const charPromises = charIds.map(id => loadImage(`/tiles/characters/${id}.png`));
  const charImages = await Promise.all(charPromises);

  let charsLoaded = 0;
  charIds.forEach((id, i) => {
    if (charImages[i]) {
      charSheets[id] = charImages[i];
      charsLoaded++;
    }
  });

  if (charsLoaded > 0) {
    spritesReady.chars = true;
    console.log(`Character sprite sheets loaded: ${charsLoaded}/7`);
  }

  sheetsLoaded = true;
  console.log('Tile renderer ready -',
    'office:', spritesReady.office,
    'floor:', spritesReady.floor,
    'wall:', spritesReady.wall,
    'chars:', spritesReady.chars);
  return true;
}

// ============================================================================
// Office map layout
// ============================================================================

function createOfficeMap() {
  const map = [];
  for (let y = 0; y < MAP_HEIGHT; y++) {
    map[y] = new Array(MAP_WIDTH).fill(TILE.FLOOR_DARK);
  }

  // === Outer walls ===
  for (let x = 0; x < MAP_WIDTH; x++) {
    map[0][x] = TILE.WALL;
    map[1][x] = TILE.WALL_FRONT;
    map[MAP_HEIGHT - 1][x] = TILE.WALL;
  }
  for (let y = 0; y < MAP_HEIGHT; y++) {
    map[y][0] = TILE.WALL;
    map[y][MAP_WIDTH - 1] = TILE.WALL;
  }
  // Corners
  map[0][0] = TILE.WALL_CORNER_TL;
  map[0][MAP_WIDTH - 1] = TILE.WALL_CORNER_TR;

  // === Kitchen area (top-left: x 2-17, y 2-9) ===
  for (let y = 2; y < 10; y++) {
    for (let x = 2; x < 18; x++) {
      map[y][x] = TILE.FLOOR_LIGHT;
    }
  }
  // Counter along top wall
  for (let x = 2; x < 16; x++) {
    map[3][x] = TILE.COUNTER;
    map[4][x] = TILE.COUNTER_EDGE;
  }
  map[3][12] = TILE.FRIDGE;
  map[3][14] = TILE.COFFEE;
  map[3][15] = TILE.COFFEE;
  // Plants
  map[6][3] = TILE.PLANT_SMALL;
  map[6][16] = TILE.PLANT_SMALL;

  // === Lounge area (left: x 2-17, y 11-22) ===
  for (let y = 11; y < 22; y++) {
    for (let x = 2; x < 18; x++) {
      map[y][x] = TILE.FLOOR_DARK;
    }
  }
  // Rug under seating
  for (let y = 13; y < 18; y++) {
    for (let x = 5; x < 14; x++) {
      map[y][x] = TILE.RUG;
    }
  }
  // Couch (top, horizontal)
  map[13][5] = TILE.COUCH_L;
  map[13][6] = TILE.COUCH_M;
  map[13][7] = TILE.COUCH_M;
  map[13][8] = TILE.COUCH_M;
  map[13][9] = TILE.COUCH_M;
  map[13][10] = TILE.COUCH_M;
  map[13][11] = TILE.COUCH_M;
  map[13][12] = TILE.COUCH_M;
  map[13][13] = TILE.COUCH_R;
  // Coffee table
  for (let x = 7; x < 12; x++) {
    map[15][x] = TILE.TABLE;
  }
  // TV on wall
  map[11][9] = TILE.TV;
  map[11][10] = TILE.TV;
  // Plants in lounge
  map[11][3] = TILE.PLANT_LARGE;
  map[11][16] = TILE.PLANT_LARGE;
  map[19][3] = TILE.PLANT_SMALL;
  // Water cooler
  map[19][16] = TILE.WATER_COOLER;

  // === Divider wall between kitchen/lounge and desk area ===
  for (let y = 2; y < 23; y++) {
    map[y][18] = TILE.DIVIDER;
  }

  // === Desk area (right: x 20-48, y 2-33) ===
  // Nova's office (top-right corner: x 38-48, y 2-8)
  for (let y = 2; y < 9; y++) {
    for (let x = 38; x < 48; x++) {
      map[y][x] = TILE.FLOOR_LIGHT;
    }
  }
  // Wall divider for Nova's office
  for (let y = 2; y < 9; y++) {
    map[y][37] = TILE.DIVIDER;
  }
  // Nova's desk
  for (let x = 40; x < 46; x++) {
    map[5][x] = TILE.DESK_TOP;
    map[6][x] = TILE.DESK_FRONT;
  }
  map[5][42] = TILE.DESK_PC;
  map[5][43] = TILE.DESK_PC;
  map[7][42] = TILE.CHAIR;
  map[7][43] = TILE.CHAIR;
  // Nova's bookshelf
  map[3][46] = TILE.BOOKSHELF;
  map[4][46] = TILE.BOOKSHELF;
  map[3][47] = TILE.BOOKSHELF;
  map[4][47] = TILE.BOOKSHELF;
  // Plant
  map[3][39] = TILE.PLANT_LARGE;

  // === Desk rows (x 20-36) ===
  // Row 1: y 4-6
  for (let x = 20; x < 36; x++) {
    map[4][x] = TILE.DESK_TOP;
    map[5][x] = TILE.DESK_FRONT;
  }
  for (let x = 20; x < 36; x += 2) {
    map[4][x] = TILE.DESK_PC;
  }
  for (let x = 20; x < 36; x += 2) {
    map[6][x] = TILE.CHAIR;
  }

  // Row 2: y 9-11
  for (let x = 20; x < 36; x++) {
    map[9][x] = TILE.DESK_TOP;
    map[10][x] = TILE.DESK_FRONT;
  }
  for (let x = 20; x < 36; x += 2) {
    map[9][x] = TILE.DESK_PC;
  }
  for (let x = 20; x < 36; x += 2) {
    map[11][x] = TILE.CHAIR;
  }

  // Row 3: y 14-16
  for (let x = 20; x < 36; x++) {
    map[14][x] = TILE.DESK_TOP;
    map[15][x] = TILE.DESK_FRONT;
  }
  for (let x = 20; x < 36; x += 2) {
    map[14][x] = TILE.DESK_PC;
  }
  for (let x = 20; x < 36; x += 2) {
    map[16][x] = TILE.CHAIR;
  }

  // Row 4 (right desks): y 14-16, x 38-48
  for (let x = 38; x < 48; x++) {
    map[14][x] = TILE.DESK_TOP;
    map[15][x] = TILE.DESK_FRONT;
  }
  for (let x = 38; x < 48; x += 2) {
    map[14][x] = TILE.DESK_PC;
  }
  for (let x = 38; x < 48; x += 2) {
    map[16][x] = TILE.CHAIR;
  }

  // === Conference area (bottom center: x 20-36, y 20-30) ===
  for (let y = 20; y < 30; y++) {
    for (let x = 20; x < 36; x++) {
      map[y][x] = TILE.FLOOR_LIGHT;
    }
  }
  // Conference table
  for (let y = 22; y < 28; y++) {
    for (let x = 25; x < 31; x++) {
      map[y][x] = TILE.TABLE;
    }
  }
  // Chairs around table
  for (let x = 25; x < 31; x++) {
    map[21][x] = TILE.CHAIR;
    map[28][x] = TILE.CHAIR;
  }
  for (let y = 23; y < 27; y++) {
    map[y][24] = TILE.CHAIR;
    map[y][31] = TILE.CHAIR;
  }

  // === Bottom area plants and decorations ===
  map[23][3] = TILE.PLANT_SMALL;
  map[30][3] = TILE.PLANT_LARGE;
  map[30][16] = TILE.PLANT_SMALL;
  map[32][9] = TILE.BOOKSHELF;
  map[32][10] = TILE.BOOKSHELF;

  // Bottom-right more desks: y 20-22, x 38-48
  for (let x = 38; x < 48; x++) {
    map[20][x] = TILE.DESK_TOP;
    map[21][x] = TILE.DESK_FRONT;
  }
  for (let x = 38; x < 48; x += 2) {
    map[20][x] = TILE.DESK_PC;
  }
  for (let x = 38; x < 48; x += 2) {
    map[22][x] = TILE.CHAIR;
  }

  return map;
}

const OFFICE_MAP = createOfficeMap();

// ============================================================================
// Tile drawing
// ============================================================================

function drawTile(ctx, tileId, x, y, scale) {
  const size = TILE_SIZE * scale;

  // Try spritesheet rendering
  const coords = TILE_COORDS[tileId];
  if (coords) {
    const sheet = spriteSheets[coords.sheet];
    if (sheet) {
      const sx = coords.col * TILE_SIZE;
      const sy = coords.row * TILE_SIZE;
      const sw = (coords.w || 1) * TILE_SIZE;
      const sh = (coords.h || 1) * TILE_SIZE;
      const dw = (coords.w || 1) * size;
      const dh = (coords.h || 1) * size;

      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(sheet, sx, sy, sw, sh, x, y, dw, dh);
      return;
    }
  }

  // Programmatic fallback
  drawTileFallback(ctx, tileId, x, y, scale);
}

function drawTileFallback(ctx, tileId, x, y, scale) {
  const size = TILE_SIZE * scale;

  switch (tileId) {
    case TILE.FLOOR_DARK:
      ctx.fillStyle = '#2d2d44';
      ctx.fillRect(x, y, size, size);
      ctx.fillStyle = '#252540';
      ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
      break;
    case TILE.FLOOR_LIGHT:
      ctx.fillStyle = '#3d3d54';
      ctx.fillRect(x, y, size, size);
      ctx.fillStyle = '#353548';
      ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
      break;
    case TILE.WALL:
    case TILE.WALL_TOP:
    case TILE.WALL_FRONT:
    case TILE.WALL_LEFT:
    case TILE.WALL_RIGHT:
    case TILE.WALL_CORNER_TL:
    case TILE.WALL_CORNER_TR:
    case TILE.WALL_CORNER_BL:
    case TILE.WALL_CORNER_BR:
      ctx.fillStyle = '#4a4a6a';
      ctx.fillRect(x, y, size, size);
      ctx.fillStyle = '#5a5a7a';
      ctx.fillRect(x, y, size, 2 * scale);
      break;
    case TILE.COUNTER:
      ctx.fillStyle = '#6a7a8a';
      ctx.fillRect(x, y, size, size);
      ctx.fillStyle = '#7a8a9a';
      ctx.fillRect(x, y, size, 3 * scale);
      break;
    case TILE.COUNTER_EDGE:
      ctx.fillStyle = '#5a6a7a';
      ctx.fillRect(x, y, size, size);
      break;
    case TILE.FRIDGE:
      ctx.fillStyle = '#aaa';
      ctx.fillRect(x, y, size, size);
      ctx.fillStyle = '#888';
      ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
      break;
    case TILE.COFFEE:
      ctx.fillStyle = '#5a5a5a';
      ctx.fillRect(x + 2, y + 4, size - 4, size - 8);
      ctx.fillStyle = '#8a5a3a';
      ctx.fillRect(x + 4, y + 2, size - 8, 4);
      break;
    case TILE.DESK_TOP:
      ctx.fillStyle = '#5a4a3a';
      ctx.fillRect(x, y, size, size);
      ctx.fillStyle = '#6a5a4a';
      ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
      break;
    case TILE.DESK_FRONT:
      ctx.fillStyle = '#4a3a2a';
      ctx.fillRect(x, y, size, size);
      break;
    case TILE.DESK_PC:
      ctx.fillStyle = '#5a4a3a';
      ctx.fillRect(x, y, size, size);
      ctx.fillStyle = '#3a3a5a';
      ctx.fillRect(x + 3, y + 4, size - 6, size * 0.6);
      ctx.fillStyle = '#6a8aff';
      ctx.fillRect(x + 4, y + 5, size - 8, size * 0.4);
      break;
    case TILE.CHAIR:
      ctx.fillStyle = '#8a5a7a';
      ctx.fillRect(x + 3, y + 2, size - 6, size - 4);
      break;
    case TILE.COUCH_L:
    case TILE.COUCH_M:
    case TILE.COUCH_R:
      ctx.fillStyle = '#6b5b7a';
      ctx.fillRect(x, y, size, size);
      ctx.fillStyle = '#7b6b8a';
      ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
      break;
    case TILE.TABLE:
      ctx.fillStyle = '#6a5a4a';
      ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
      break;
    case TILE.PLANT_SMALL:
      ctx.fillStyle = '#5a9a6a';
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, size * 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#6a4a3a';
      ctx.fillRect(x + size * 0.35, y + size * 0.7, size * 0.3, size * 0.25);
      break;
    case TILE.PLANT_LARGE:
      ctx.fillStyle = '#5a9a6a';
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size * 0.4, size * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#6a4a3a';
      ctx.fillRect(x + size * 0.3, y + size * 0.65, size * 0.4, size * 0.3);
      break;
    case TILE.WATER_COOLER:
      ctx.fillStyle = '#6a8afa';
      ctx.fillRect(x + 3, y + 2, size - 6, size - 4);
      ctx.fillStyle = '#aaa';
      ctx.fillRect(x + 4, y + size - 5, size - 8, 3);
      break;
    case TILE.TV:
      ctx.fillStyle = '#333';
      ctx.fillRect(x + 2, y + 3, size - 4, size - 6);
      ctx.fillStyle = '#6a8afa';
      ctx.fillRect(x + 3, y + 4, size - 6, size - 8);
      break;
    case TILE.BOOKSHELF:
      ctx.fillStyle = '#5a4a3a';
      ctx.fillRect(x, y, size, size);
      ctx.fillStyle = '#a44';
      ctx.fillRect(x + 2, y + 3, 4, 5);
      ctx.fillStyle = '#4a4';
      ctx.fillRect(x + 7, y + 2, 3, 6);
      ctx.fillStyle = '#44a';
      ctx.fillRect(x + 11, y + 4, 2, 4);
      break;
    case TILE.RUG:
      ctx.fillStyle = '#6a5a4a';
      ctx.fillRect(x, y, size, size);
      ctx.fillStyle = '#7a6a5a';
      ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
      break;
    case TILE.DIVIDER:
      ctx.fillStyle = '#5a5a7a';
      ctx.fillRect(x + size * 0.3, y, size * 0.4, size);
      break;
    default:
      break;
  }
}

// ============================================================================
// Map rendering
// ============================================================================

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

function getOfficePixelSize() {
  return {
    width: MAP_WIDTH * TILE_SIZE,
    height: MAP_HEIGHT * TILE_SIZE
  };
}

// ============================================================================
// Character sprites
// ============================================================================

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

function drawCharacterSprite(ctx, charId, x, y, scale, frame = 0) {
  const charData = CHARACTERS_SPRITES.find(c => c.id === charId) || { color: '#ff00ff' };

  // Sprite sheet character rendering
  // Each character sheet (896×656) has the front-facing idle pose at position (0, 0)
  // Frame size: 16px wide × 32px tall (full head + body)
  if (spritesReady.chars) {
    const sheetId = CHAR_SHEET_MAP[charId];
    const sheet = sheetId ? charSheets[sheetId] : null;

    if (sheet) {
      const srcW = CHAR_FRAME_W;
      const srcH = CHAR_FRAME_H;

      // Destination size: match sprites.js SPRITE_WIDTH (32) × SPRITE_HEIGHT (40) 
      const destW = 32 * scale;
      const destH = 40 * scale;

      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(
        sheet,
        0, 0,         // source position: front idle frame at top-left
        srcW, srcH,   // source size: 16×32 pixels
        x - destW / 2, y - destH / 2,  // center on character position
        destW, destH  // destination size
      );
      return;
    }
  }

  // Fallback pixel art character (sized to match SPRITE_WIDTH=32, SPRITE_HEIGHT=40)
  const c = charData.color;
  const w = 32 * scale;
  const h = 40 * scale;
  const cx = x - w / 2;
  const cy = y - h / 2;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(x, cy + h + 2 * scale, w * 0.4, 3 * scale, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body (lower half)
  ctx.fillStyle = c;
  ctx.fillRect(cx + 6 * scale, cy + 18 * scale, 20 * scale, 22 * scale);

  // Head (upper half, slightly wider)
  const headColor = lightenColor(c, 30);
  ctx.fillStyle = headColor;
  ctx.fillRect(cx + 4 * scale, cy + 2 * scale, 24 * scale, 20 * scale);

  // Hair
  ctx.fillStyle = darkenColor(c, 40);
  ctx.fillRect(cx + 4 * scale, cy + 2 * scale, 24 * scale, 6 * scale);

  // Eyes
  ctx.fillStyle = '#fff';
  ctx.fillRect(cx + 8 * scale, cy + 10 * scale, 6 * scale, 6 * scale);
  ctx.fillRect(cx + 18 * scale, cy + 10 * scale, 6 * scale, 6 * scale);
  ctx.fillStyle = '#222';
  ctx.fillRect(cx + 10 * scale, cy + 12 * scale, 3 * scale, 3 * scale);
  ctx.fillRect(cx + 20 * scale, cy + 12 * scale, 3 * scale, 3 * scale);

  // Legs
  ctx.fillStyle = darkenColor(c, 30);
  ctx.fillRect(cx + 8 * scale, cy + 34 * scale, 7 * scale, 6 * scale);
  ctx.fillRect(cx + 17 * scale, cy + 34 * scale, 7 * scale, 6 * scale);
}

// Color utility helpers
function lightenColor(hex, amount) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, (num >> 16) + amount);
  const g = Math.min(255, ((num >> 8) & 0xff) + amount);
  const b = Math.min(255, (num & 0xff) + amount);
  return `rgb(${r},${g},${b})`;
}

function darkenColor(hex, amount) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, (num >> 16) - amount);
  const g = Math.max(0, ((num >> 8) & 0xff) - amount);
  const b = Math.max(0, (num & 0xff) - amount);
  return `rgb(${r},${g},${b})`;
}

// ============================================================================
// Window exports
// ============================================================================

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
