/**
 * Tile-based Office Renderer
 * 
 * Renders tile layers from Tiled JSON map data (loaded by tiled-loader.js).
 * Falls back to the legacy hardcoded map if no Tiled map is loaded.
 * 
 * Also handles character sprite rendering from individual spritesheets.
 * 
 * Tilesets used for characters:
 *   - characters/agent01-07.png (896×656 each) - Character sprites
 */

// ============================================================================
// Constants
// ============================================================================

const TILE_SIZE = 16;
let MAP_WIDTH = 50;   // can be overridden by Tiled map
let MAP_HEIGHT = 35;

// Character frame dimensions in the sprite sheets
const CHAR_FRAME_W = 16;
const CHAR_FRAME_H = 32;

// ============================================================================
// Character sprite sheet management
// ============================================================================

const charSheets = {};
const spritesReady = { chars: false, tiled: false };

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

// Character sprite data (for fallback rendering)
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

// ============================================================================
// Initialization
// ============================================================================

async function initTileRenderer() {
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

  // Load Tiled map if loader is available
  if (window.loadTiledMap) {
    const mapData = await window.loadTiledMap('/maps/office.json');
    if (mapData && mapData.loaded) {
      MAP_WIDTH = mapData.mapWidth;
      MAP_HEIGHT = mapData.mapHeight;
      spritesReady.tiled = true;
      console.log('[TileRenderer] Using Tiled map data');
    } else {
      console.warn('[TileRenderer] Tiled map not loaded, using fallback');
    }
  }

  console.log('Tile renderer ready —',
    `map: ${MAP_WIDTH}×${MAP_HEIGHT},`,
    'chars:', spritesReady.chars,
    'tiled:', spritesReady.tiled);
  return true;
}

// ============================================================================
// Tiled map rendering
// ============================================================================

/**
 * Render all tile layers from the loaded Tiled map.
 * Each tile is drawn from its resolved tileset image and source coordinates.
 */
function renderTiledLayers(ctx, offsetX, offsetY, scale) {
  const mapData = window.tiledMapData;
  if (!mapData || !mapData.loaded) return false;

  const tileW = mapData.tileWidth * scale;
  const tileH = mapData.tileHeight * scale;

  ctx.imageSmoothingEnabled = false;

  // Draw each tile layer in order (bottom to top)
  for (const layer of mapData.tileLayers) {
    for (let y = 0; y < layer.height; y++) {
      for (let x = 0; x < layer.width; x++) {
        const tileInfo = layer.tiles[y][x];
        if (!tileInfo) continue; // empty tile

        const { srcX, srcY, tileWidth, tileHeight, tilesetImage, h, v, d } = tileInfo;
        const img = mapData.tilesetImages[tilesetImage];
        if (!img) continue; // tileset image not loaded

        const destX = offsetX + x * tileW;
        const destY = offsetY + y * tileH;

        if (h || v || d) {
          ctx.save();
          // Translate to center of tile
          ctx.translate(destX + tileW / 2, destY + tileH / 2);

          // Apply Tiled transforms
          // Order matters: in Canvas (pre-multiply), we apply "outer" transforms first.
          // Tiled spec: "Diagonal flip is done first, followed by horizontal and vertical."
          // Which means P' = V(H(D(P))).
          // So code order: V, then H, then D.

          // Vertical flip
          if (v) {
            ctx.scale(1, -1);
          }
          // Horizontal flip
          if (h) {
            ctx.scale(-1, 1);
          }
          // Diagonal flip: swap x/y axis
          if (d) {
            ctx.transform(0, 1, 1, 0, 0, 0);
          }

          // Draw centered
          ctx.drawImage(
            img,
            srcX, srcY,
            tileWidth, tileHeight,
            -tileW / 2, -tileH / 2,
            tileW, tileH
          );
          ctx.restore();
        } else {
          // Standard draw
          ctx.drawImage(
            img,
            srcX, srcY,
            tileWidth, tileHeight,
            destX,
            destY,
            tileW, tileH
          );
        }
      }
    }
  }

  return true;
}

// ============================================================================
// Main render function
// ============================================================================

function renderOfficeMap(ctx, offsetX, offsetY, scale) {
  // Try Tiled rendering first
  if (spritesReady.tiled) {
    const rendered = renderTiledLayers(ctx, offsetX, offsetY, scale);
    if (rendered) return;
  }

  // Fallback: draw a simple colored grid
  renderFallbackMap(ctx, offsetX, offsetY, scale);
}

/**
 * Minimal fallback when no Tiled map is loaded.
 * Draws a simple floor grid so the app still functions.
 */
function renderFallbackMap(ctx, offsetX, offsetY, scale) {
  const size = TILE_SIZE * scale;

  for (let y = 0; y < MAP_HEIGHT; y++) {
    for (let x = 0; x < MAP_WIDTH; x++) {
      const px = offsetX + x * size;
      const py = offsetY + y * size;

      // Border walls
      if (x === 0 || y === 0 || x === MAP_WIDTH - 1 || y === MAP_HEIGHT - 1) {
        ctx.fillStyle = '#4a4a6a';
        ctx.fillRect(px, py, size, size);
      } else {
        // Alternating floor
        ctx.fillStyle = (x + y) % 2 === 0 ? '#2d2d44' : '#252540';
        ctx.fillRect(px, py, size, size);
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
// Character sprite rendering
// ============================================================================

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
window.initTileRenderer = initTileRenderer;
window.renderOfficeMap = renderOfficeMap;
window.getOfficePixelSize = getOfficePixelSize;
window.drawCharacterSprite = drawCharacterSprite;
window.CHARACTERS_SPRITES = CHARACTERS_SPRITES;
window.spritesReady = spritesReady;
