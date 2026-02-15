/**
 * Tiled Map Loader for AgentOffice
 * 
 * Loads Tiled JSON map exports and converts them into data structures
 * used by tile-renderer.js (tile layers) and sprites.js (zones, waypoints).
 * 
 * Tiled JSON format reference: https://doc.mapeditor.org/en/stable/reference/json-map-format/
 * 
 * Expected Tiled layers:
 *   Tile layers: 'floor', 'walls', 'furniture' (or any name)
 *   Object layers:
 *     'zones'     — rectangles with custom properties: type (desk|lounge|kitchen|walkable|conference), agent (character id)
 *     'waypoints' — point objects with custom property: connections (comma-separated waypoint names)
 */

// ============================================================================
// Tiled map data store
// ============================================================================

const tiledMapData = {
    loaded: false,
    mapWidth: 0,       // in tiles
    mapHeight: 0,      // in tiles
    tileWidth: 16,
    tileHeight: 16,
    tileLayers: [],    // array of { name, data: 2D array of { tilesetImage, srcX, srcY } or null }
    tilesets: [],      // array of { firstGid, image, imageWidth, imageHeight, tileWidth, tileHeight, columns, tileCount, name }
    tilesetImages: {}, // loaded Image objects keyed by image path
    zones: [],         // array of { name, type, x, y, width, height, agent?, properties }
    waypoints: {},     // { name: { x, y, connections: [name, ...] } }
    // Fractional-coordinate versions (0-1 range)
    zonesFrac: [],     // same as zones but x/y/w/h as fractions of map dimensions
    waypointsFrac: {}, // same as waypoints but x/y as fractions
};

// ============================================================================
// GID Resolution
// ============================================================================

/**
 * Resolve a Global Tile ID to a tileset and local tile coordinates.
 * GIDs encode flip flags in the upper bits — we mask those off.
 * 
 * @param {number} gid - Global tile ID from Tiled layer data
 * @returns {{ tilesetIndex: number, localId: number, srcX: number, srcY: number, tilesetImage: string } | null}
 */
function resolveGid(gid) {
    if (gid === 0) return null; // empty tile

    // Mask off flip flags (upper 3 bits of a 32-bit int)
    const FLIPPED_H = 0x80000000;
    const FLIPPED_V = 0x40000000;
    const FLIPPED_D = 0x20000000;
    const cleanGid = gid & ~(FLIPPED_H | FLIPPED_V | FLIPPED_D);

    // Find the tileset this GID belongs to (tilesets sorted by firstGid ascending)
    let tileset = null;
    for (let i = tiledMapData.tilesets.length - 1; i >= 0; i--) {
        if (cleanGid >= tiledMapData.tilesets[i].firstGid) {
            tileset = tiledMapData.tilesets[i];
            break;
        }
    }
    if (!tileset) return null;

    const localId = cleanGid - tileset.firstGid;
    const cols = tileset.columns || Math.floor(tileset.imageWidth / tileset.tileWidth);
    const srcX = (localId % cols) * tileset.tileWidth;
    const srcY = Math.floor(localId / cols) * tileset.tileHeight;

    return {
        tilesetIndex: tiledMapData.tilesets.indexOf(tileset),
        localId,
        srcX,
        srcY,
        tilesetImage: tileset.image,
        tileWidth: tileset.tileWidth,
        tileHeight: tileset.tileHeight,
    };
}

// ============================================================================
// Custom property extraction
// ============================================================================

/**
 * Extract custom properties from a Tiled object into a flat key-value map.
 * Tiled stores properties as: [{ name, type, value }, ...]
 */
function extractProperties(obj) {
    const props = {};
    if (obj.properties) {
        for (const prop of obj.properties) {
            props[prop.name] = prop.value;
        }
    }
    return props;
}

// ============================================================================
// Main loader
// ============================================================================

/**
 * Load a Tiled JSON map from a URL.
 * Parses tile layers, zones, waypoints, and preloads tileset images.
 * 
 * @param {string} url - Path to the Tiled JSON file (e.g. '/maps/office.json')
 * @returns {Promise<object>} The populated tiledMapData
 */
async function loadTiledMap(url) {
    console.log('[TiledLoader] Loading map:', url);

    let json;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.warn(`[TiledLoader] Failed to fetch ${url}: ${response.status}`);
            return tiledMapData;
        }
        json = await response.json();
    } catch (err) {
        console.warn('[TiledLoader] Error loading map JSON:', err);
        return tiledMapData;
    }

    // Map dimensions
    tiledMapData.mapWidth = json.width;
    tiledMapData.mapHeight = json.height;
    tiledMapData.tileWidth = json.tilewidth;
    tiledMapData.tileHeight = json.tileheight;

    // Parse tilesets
    parseTilesets(json.tilesets || []);

    // Preload tileset images
    await preloadTilesetImages();

    // Parse layers
    parseLayers(json.layers || []);

    tiledMapData.loaded = true;
    console.log('[TiledLoader] Map loaded successfully:',
        `${tiledMapData.mapWidth}×${tiledMapData.mapHeight} tiles,`,
        `${tiledMapData.tileLayers.length} tile layers,`,
        `${tiledMapData.zones.length} zones,`,
        `${Object.keys(tiledMapData.waypoints).length} waypoints`
    );

    return tiledMapData;
}

// ============================================================================
// Tileset parsing
// ============================================================================

function parseTilesets(tilesets) {
    tiledMapData.tilesets = tilesets.map(ts => {
        // Tiled can embed tilesets or reference external .tsj files
        // For embedded tilesets:
        const tileset = {
            firstGid: ts.firstgid,
            name: ts.name || '',
            image: ts.image || '',
            imageWidth: ts.imagewidth || 0,
            imageHeight: ts.imageheight || 0,
            tileWidth: ts.tilewidth || tiledMapData.tileWidth,
            tileHeight: ts.tileheight || tiledMapData.tileHeight,
            columns: ts.columns || 0,
            tileCount: ts.tilecount || 0,
            margin: ts.margin || 0,
            spacing: ts.spacing || 0,
        };
        return tileset;
    });

    // Sort by firstGid ascending (usually already sorted, but ensure it)
    tiledMapData.tilesets.sort((a, b) => a.firstGid - b.firstGid);
    console.log('[TiledLoader] Tilesets:', tiledMapData.tilesets.map(t => `${t.name} (gid ${t.firstGid}, ${t.image})`));
}

// ============================================================================
// Image preloading
// ============================================================================

function loadImage(src) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => {
            console.warn('[TiledLoader] Failed to load tileset image:', src);
            resolve(null);
        };
        img.src = src;
    });
}

async function preloadTilesetImages() {
    const imagePaths = [...new Set(tiledMapData.tilesets.map(ts => ts.image).filter(Boolean))];

    const promises = imagePaths.map(async (imagePath) => {
        // Tiled stores paths relative to the map file
        // Our maps are in /maps/, tilesets in /tiles/
        // So a Tiled path like "../tiles/floors_16x16.png" needs to resolve correctly
        // We'll try multiple path resolutions
        const candidates = [
            imagePath,                             // as-is
            '/tiles/' + imagePath.split('/').pop(), // just filename in /tiles/
            imagePath.replace('../', '/'),          // remove relative ../ prefix
        ];

        for (const candidate of candidates) {
            const img = await loadImage(candidate);
            if (img) {
                tiledMapData.tilesetImages[imagePath] = img;
                console.log('[TiledLoader] Loaded tileset image:', candidate, `(${img.width}×${img.height})`);
                return;
            }
        }
        console.warn('[TiledLoader] Could not load tileset image with any path variant:', imagePath);
    });

    await Promise.all(promises);
}

// ============================================================================
// Layer parsing
// ============================================================================

function parseLayers(layers) {
    for (const layer of layers) {
        if (layer.type === 'group') {
            // Recursively parse group layers
            parseLayers(layer.layers || []);
            continue;
        }

        if (layer.type === 'tilelayer' && layer.visible !== false) {
            parseTileLayer(layer);
        } else if (layer.type === 'objectgroup') {
            parseObjectLayer(layer);
        }
    }
}

function parseTileLayer(layer) {
    const { width, height, data, name } = layer;
    const w = width || tiledMapData.mapWidth;
    const h = height || tiledMapData.mapHeight;

    // Build 2D array of resolved tile data
    const tiles = [];
    for (let y = 0; y < h; y++) {
        tiles[y] = [];
        for (let x = 0; x < w; x++) {
            const gid = data[y * w + x];
            tiles[y][x] = resolveGid(gid);
        }
    }

    tiledMapData.tileLayers.push({
        name: name || `layer_${tiledMapData.tileLayers.length}`,
        width: w,
        height: h,
        tiles,
    });
}

function parseObjectLayer(layer) {
    const name = (layer.name || '').toLowerCase();

    for (const obj of (layer.objects || [])) {
        const props = extractProperties(obj);

        if (name === 'waypoints' || props.type === 'waypoint' || obj.point) {
            // Waypoint: a point object with connections
            parseWaypoint(obj, props);
        } else if (name === 'zones' || props.type) {
            // Zone: a rectangle
            parseZone(obj, props);
        }
    }
}

function parseZone(obj, props) {
    const mapPixelWidth = tiledMapData.mapWidth * tiledMapData.tileWidth;
    const mapPixelHeight = tiledMapData.mapHeight * tiledMapData.tileHeight;

    const zone = {
        name: obj.name || '',
        type: props.type || 'unknown',
        // Pixel coordinates
        x: obj.x,
        y: obj.y,
        width: obj.width,
        height: obj.height,
        // Agent assignment (for desk zones)
        agent: props.agent || null,
        // All custom properties
        properties: props,
    };

    tiledMapData.zones.push(zone);

    // Also store fractional coordinates (0-1 range)
    tiledMapData.zonesFrac.push({
        ...zone,
        x: obj.x / mapPixelWidth,
        y: obj.y / mapPixelHeight,
        width: obj.width / mapPixelWidth,
        height: obj.height / mapPixelHeight,
    });
}

function parseWaypoint(obj, props) {
    const mapPixelWidth = tiledMapData.mapWidth * tiledMapData.tileWidth;
    const mapPixelHeight = tiledMapData.mapHeight * tiledMapData.tileHeight;
    const name = obj.name || `wp_${Object.keys(tiledMapData.waypoints).length}`;

    // Parse connections from comma-separated string
    const connectionsStr = props.connections || '';
    const connections = connectionsStr
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

    tiledMapData.waypoints[name] = {
        x: obj.x,
        y: obj.y,
        connections,
    };

    tiledMapData.waypointsFrac[name] = {
        x: obj.x / mapPixelWidth,
        y: obj.y / mapPixelHeight,
        connections,
    };
}

// ============================================================================
// Pathfinding — Dijkstra on waypoint graph
// ============================================================================

/**
 * Find shortest path between two named waypoints using Dijkstra.
 * Returns array of { x, y } in fractional coordinates (0-1 range).
 * 
 * @param {string} fromName - Starting waypoint name
 * @param {string} toName - Target waypoint name
 * @returns {Array<{x: number, y: number}>|null} Path as array of fractional points, or null if no path
 */
function findWaypointPath(fromName, toName) {
    const wps = tiledMapData.waypointsFrac;
    if (!wps[fromName] || !wps[toName]) return null;
    if (fromName === toName) return [{ x: wps[fromName].x, y: wps[fromName].y }];

    // Dijkstra
    const dist = {};
    const prev = {};
    const visited = new Set();
    const names = Object.keys(wps);

    for (const n of names) {
        dist[n] = Infinity;
        prev[n] = null;
    }
    dist[fromName] = 0;

    while (true) {
        // Find unvisited node with smallest distance
        let current = null;
        let minDist = Infinity;
        for (const n of names) {
            if (!visited.has(n) && dist[n] < minDist) {
                minDist = dist[n];
                current = n;
            }
        }
        if (current === null || current === toName) break;

        visited.add(current);
        const wp = wps[current];

        for (const neighbor of wp.connections) {
            if (!wps[neighbor] || visited.has(neighbor)) continue;
            const dx = wps[neighbor].x - wp.x;
            const dy = wps[neighbor].y - wp.y;
            const d = Math.sqrt(dx * dx + dy * dy);
            const alt = dist[current] + d;
            if (alt < dist[neighbor]) {
                dist[neighbor] = alt;
                prev[neighbor] = current;
            }
        }
    }

    // Reconstruct path
    if (dist[toName] === Infinity) return null;

    const path = [];
    let node = toName;
    while (node) {
        path.unshift({ x: wps[node].x, y: wps[node].y });
        node = prev[node];
    }
    return path;
}

/**
 * Find the nearest waypoint to a given fractional position.
 * 
 * @param {number} fx - Fractional X (0-1)
 * @param {number} fy - Fractional Y (0-1)
 * @returns {string|null} Name of nearest waypoint
 */
function findNearestWaypoint(fx, fy) {
    const wps = tiledMapData.waypointsFrac;
    let nearest = null;
    let nearestDist = Infinity;

    for (const [name, wp] of Object.entries(wps)) {
        const dx = wp.x - fx;
        const dy = wp.y - fy;
        const d = dx * dx + dy * dy;
        if (d < nearestDist) {
            nearestDist = d;
            nearest = name;
        }
    }
    return nearest;
}

// ============================================================================
// Zone query helpers
// ============================================================================

/**
 * Get all zones of a given type.
 * @param {string} type - Zone type (e.g. 'desk', 'lounge', 'kitchen')
 * @returns {Array} Zones in fractional coordinates
 */
function getZonesByType(type) {
    return tiledMapData.zonesFrac.filter(z => z.type === type);
}

/**
 * Get the desk zone assigned to a specific agent.
 * @param {string} agentId - Agent ID (e.g. 'nova', 'zero1')
 * @returns {object|null} Zone in fractional coordinates
 */
function getAgentDesk(agentId) {
    return tiledMapData.zonesFrac.find(z => z.type === 'desk' && z.agent === agentId) || null;
}

/**
 * Get a random position within a zone (fractional coordinates).
 * @param {object} zone - Zone object with fractional x, y, width, height
 * @returns {{x: number, y: number}}
 */
function getRandomPositionInZone(zone) {
    return {
        x: zone.x + Math.random() * zone.width,
        y: zone.y + Math.random() * zone.height,
    };
}

/**
 * Get the center of a zone (fractional coordinates).
 * @param {object} zone - Zone object
 * @returns {{x: number, y: number}}
 */
function getZoneCenter(zone) {
    return {
        x: zone.x + zone.width / 2,
        y: zone.y + zone.height / 2,
    };
}

// ============================================================================
// Exports
// ============================================================================

window.loadTiledMap = loadTiledMap;
window.tiledMapData = tiledMapData;
window.resolveGid = resolveGid;
window.findWaypointPath = findWaypointPath;
window.findNearestWaypoint = findNearestWaypoint;
window.getZonesByType = getZonesByType;
window.getAgentDesk = getAgentDesk;
window.getRandomPositionInZone = getRandomPositionInZone;
window.getZoneCenter = getZoneCenter;
