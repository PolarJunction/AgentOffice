// AgentOffice - Office Floor Plan Canvas Rendering
const canvas = document.getElementById('office');
window.canvas = canvas;
const ctx = canvas.getContext('2d');

// Animation timestamp for requestAnimationFrame
let animationTimestamp = 0;

// Whiteboard variables (declared early to avoid TDZ)
let whiteboardDiagrams = [
  { type: 'flowchart', color: '#8aff8a' },
  { type: 'boxes', color: '#ff8a8a' },
  { type: 'circles', color: '#8a8aff' }
];
let currentWhiteboardDiagram = 0;
let whiteboardProgress = 0;

// Water cooler bubbles (declared early to avoid TDZ)
let waterCoolerBubbles = [];

// Clock variables (declared early to avoid TDZ)
let clockTime = new Date();
let clockAngle = 0;

// Speech bubbles (declared early to avoid TDZ)
const speechBubbles = [];

// Coffee steam particles (declared early to avoid TDZ)
const coffeeSteamParticles = [];

// Timeline events (declared early to avoid TDZ)
const timelineEvents = [];

// Celebration particles (declared early to avoid TDZ)
let celebrationParticles = [];

// Office dimensions and layout
let scale = 1;
window.scale = scale;

const MIN_WIDTH = 1200;
const MIN_HEIGHT = 800;
window.MIN_WIDTH = MIN_WIDTH;
window.MIN_HEIGHT = MIN_HEIGHT;

// ============================================================================
// Day/Night Cycle System
// ============================================================================

// Get current time (real-world)
function getCurrentTime() {
  return new Date();
}

// Get current hour (0-23)
function getCurrentHour() {
  return getCurrentTime().getHours();
}

// Get current minutes
function getCurrentMinutes() {
  return getCurrentTime().getMinutes();
}

// Get current time as decimal hours (e.g., 14.5 = 2:30 PM)
function getTimeAsDecimal() {
  const now = getCurrentTime();
  return now.getHours() + now.getMinutes() / 60;
}

// Lighting states
const LIGHTING_STATES = {
  DAY: 'day',           // 6 AM - 6 PM
  EVENING: 'evening',   // 6 PM - 9 PM
  NIGHT: 'night'        // 9 PM - 6 AM
};

// Get current lighting state based on real time
function getLightingState() {
  const hour = getCurrentHour();
  if (hour >= 6 && hour < 18) {
    return LIGHTING_STATES.DAY;
  } else if (hour >= 18 && hour < 21) {
    return LIGHTING_STATES.EVENING;
  } else {
    return LIGHTING_STATES.NIGHT;
  }
}

// Get transition progress (0-1) for gradual color shifts during transition periods
function getTransitionProgress() {
  const hour = getCurrentHour();
  const minutes = getCurrentMinutes();
  const timeDecimal = hour + minutes / 60;
  
  // Morning transition: 5:30 AM - 6:00 AM
  if (timeDecimal >= 5.5 && timeDecimal < 6) {
    return (timeDecimal - 5.5) / 0.5;
  }
  // Evening transition: 5:30 PM - 6:00 PM
  else if (timeDecimal >= 17.5 && timeDecimal < 18) {
    return (timeDecimal - 17.5) / 0.5;
  }
  // Night transition: 8:30 PM - 9:00 PM
  else if (timeDecimal >= 20.5 && timeDecimal < 21) {
    return (timeDecimal - 20.5) / 0.5;
  }
  // Early morning transition: 5:30 AM - 6:00 AM (night to day)
  else if (timeDecimal >= 5.5 && timeDecimal < 6) {
    return (timeDecimal - 5.5) / 0.5;
  }
  return null;
}

// Interpolate between two colors
function lerpColor(color1, color2, t) {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  
  const r = Math.round(c1.r + (c2.r - c1.r) * t);
  const g = Math.round(c1.g + (c2.g - c1.g) * t);
  const b = Math.round(c1.b + (c2.b - c1.b) * t);
  
  return rgbToHex(r, g, b);
}

// Convert hex to RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

// Convert RGB to hex
function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

// Get desk lamp state based on time
function areDeskLampsOn() {
  const hour = getCurrentHour();
  // Lamps on during evening and night
  return hour >= 17 || hour < 6;
}

// Get monitor glow state
function areMonitorsOn() {
  const hour = getCurrentHour();
  // Monitors on during work hours and evening
  return hour >= 7 && hour < 22;
}

// Get sky color for window
function getSkyColor() {
  const state = getLightingState();
  const transition = getTransitionProgress();
  
  if (state === LIGHTING_STATES.DAY) {
    if (transition !== null) {
      // Transition from night to day
      return lerpColor('#1a1a3a', '#87CEEB', transition);
    }
    return '#87CEEB'; // Bright blue day sky
  } else if (state === LIGHTING_STATES.EVENING) {
    if (transition !== null) {
      // Transition from day to evening
      return lerpColor('#87CEEB', '#FF6B35', transition);
    }
    return '#FF6B35'; // Orange sunset
  } else {
    if (transition !== null) {
      // Transition from evening to night
      return lerpColor('#FF6B35', '#0a0a1a', transition);
    }
    return '#0a0a1a'; // Dark night sky
  }
}

// Get ambient light overlay color
function getAmbientOverlay() {
  const state = getLightingState();
  const transition = getTransitionProgress();
  
  if (state === LIGHTING_STATES.DAY) {
    return { color: 'rgba(255, 250, 220, 0.15)', intensity: 0.15 };
  } else if (state === LIGHTING_STATES.EVENING) {
    if (transition !== null) {
      const intensity = 0.15 + transition * 0.2;
      return { color: lerpColor('rgba(255, 250, 220, 0.15)', 'rgba(255, 180, 100, 0.35)', transition), intensity };
    }
    return { color: 'rgba(255, 180, 100, 0.35)', intensity: 0.35 };
  } else {
    // Night - dark blue ambient
    if (transition !== null) {
      const intensity = 0.35 + transition * 0.15;
      return { color: lerpColor('rgba(255, 180, 100, 0.35)', 'rgba(20, 20, 60, 0.5)', transition), intensity };
    }
    return { color: 'rgba(20, 20, 60, 0.5)', intensity: 0.5 };
  }
}

// Get time display string
function getTimeDisplay() {
  const now = getCurrentTime();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, '0');
  return `${displayHours}:${displayMinutes} ${ampm}`;
}

// ============================================================================
// End Day/Night Cycle System
// ============================================================================

// ============================================================================
// Agent Speech Bubbles - Phase 5
// ============================================================================

// Agent quips by character name
const AGENT_QUIPS = {
  'Nova': {
    start: ["I have a plan...", "Let me design this...", "Got it!", "Starting now!"],
    complete: ["Excellent progress!", "Done!", "Perfect!", "All set!"]
  },
  'Zero': {
    start: ["Time to code!", "One sec...", "On it!", "Let's build!"],
    complete: ["Almost done!", "Done!", "Code complete!", "Works!"]
  },
  'Delta': {
    start: ["Reviewing...", "Let me check...", "Analyzing...", "Looking into it"],
    complete: ["LGTM!", "Looks good!", "Approved!", "Found no issues!"]
  },
  'Bestie': {
    start: ["Got it!", "On it!", "How can I help?", "Right away!"],
    complete: ["All done!", "Complete!", "Handled!", "Ready!"]
  },
  'Dexter': {
    start: ["Testing...", "Interesting...", "Let me try that...", "Debug time!"],
    complete: ["Interesting...", "Tests pass!", "Works!", "Fixed it!"]
  }
};

// Get random quip based on agent name and action type
function getQuip(agentName, actionType) {
  const quips = AGENT_QUIPS[agentName] || AGENT_QUIPS['Zero'];
  const quipList = quips[actionType] || quips.start;
  return quipList[Math.floor(Math.random() * quipList.length)];
}

// Show speech bubble for an agent
function showSpeechBubble(characterId, agentName, actionType, taskName = null) {
  const character = window.CHARACTERS?.find(c => c.id === characterId);
  if (!character) return;
  
  const text = taskName 
    ? `${getQuip(agentName, actionType)}\n${taskName}`
    : getQuip(agentName, actionType);
  
  speechBubbles.push({
    id: Date.now() + Math.random(),
    characterId: characterId,
    text: text,
    x: character.offsetX,
    y: character.offsetY,
    createdAt: Date.now(),
    duration: 3500, // 3.5 seconds
    opacity: 0,
    state: 'appearing' // appearing, visible, disappearing
  });
}

// Update and draw speech bubbles
function updateAndDrawSpeechBubbles(timestamp) {
  const now = Date.now();
  
  // Update bubble states
  speechBubbles.forEach((bubble, index) => {
    const age = now - bubble.createdAt;
    
    // Update opacity based on age
    if (age < 300) {
      bubble.state = 'appearing';
      bubble.opacity = age / 300;
    } else if (age < bubble.duration - 300) {
      bubble.state = 'visible';
      bubble.opacity = 1;
    } else if (age < bubble.duration) {
      bubble.state = 'disappearing';
      bubble.opacity = 1 - (age - (bubble.duration - 300)) / 300;
    } else {
      bubble.opacity = 0;
    }
  });
  
  // Remove expired bubbles
  while (speechBubbles.length > 0 && (now - speechBubbles[0].createdAt) > speechBubbles[0].duration) {
    speechBubbles.shift();
  }
  
  // Draw active bubbles
  speechBubbles.forEach(bubble => {
    if (bubble.opacity <= 0) return;
    
    const canvas = document.getElementById('office');
    const rect = canvas.getBoundingClientRect();
    const bubbleX = bubble.x * rect.width;
    const bubbleY = bubble.y * rect.height - 60; // Position above character
    
    // Speech bubble background
    ctx.save();
    ctx.globalAlpha = bubble.opacity * 0.95;
    
    // Bubble body
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#6a6a8a';
    ctx.lineWidth = 2;
    
    // Measure text for bubble size
    const lines = bubble.text.split('\n');
    ctx.font = '13px Arial';
    const maxWidth = Math.max(...lines.map(line => ctx.measureText(line).width));
    const bubbleWidth = maxWidth + 20;
    const bubbleHeight = lines.length * 18 + 16;
    const bubbleBX = bubbleX - bubbleWidth / 2;
    const bubbleBY = bubbleY - bubbleHeight;
    
    // Draw rounded rectangle
    const radius = 8;
    ctx.beginPath();
    ctx.moveTo(bubbleBX + radius, bubbleBY);
    ctx.lineTo(bubbleBX + bubbleWidth - radius, bubbleBY);
    ctx.quadraticCurveTo(bubbleBX + bubbleWidth, bubbleBY, bubbleBX + bubbleWidth, bubbleBY + radius);
    ctx.lineTo(bubbleBX + bubbleWidth, bubbleBY + bubbleHeight - radius);
    ctx.quadraticCurveTo(bubbleBX + bubbleWidth, bubbleBY + bubbleHeight, bubbleBX + bubbleWidth - radius, bubbleBY + bubbleHeight);
    ctx.lineTo(bubbleBX + radius, bubbleBY + bubbleHeight);
    ctx.quadraticCurveTo(bubbleBX, bubbleBY + bubbleHeight, bubbleBX, bubbleBY + bubbleHeight - radius);
    ctx.lineTo(bubbleBX, bubbleBY + radius);
    ctx.quadraticCurveTo(bubbleBX, bubbleBY, bubbleBX + radius, bubbleBY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Draw pointer triangle
    ctx.beginPath();
    ctx.moveTo(bubbleX - 8, bubbleBY + bubbleHeight);
    ctx.lineTo(bubbleX, bubbleBY + bubbleHeight + 10);
    ctx.lineTo(bubbleX + 8, bubbleBY + bubbleHeight);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Draw text
    ctx.fillStyle = '#333333';
    ctx.textAlign = 'center';
    lines.forEach((line, i) => {
      ctx.fillText(line, bubbleX, bubbleBY + 18 + i * 18);
    });
    
    ctx.restore();
  });
}

// ============================================================================
// End Speech Bubbles
// ============================================================================

// Color palette - cozy office colors (base colors, will be modified by lighting)
const COLORS = {
  floor: '#2d2d44',
  wall: '#4a4a6a',
  kitchen: '#3d5a5a',
  lounge: '#4a3d5a',
  desk: '#5a4a3d',
  floorAccent: '#363654',
  couch: '#6b5b7a',
  plant: '#4a7a5a',
  coffeeMachine: '#7a6b5b',
  zeroPod: '#5a6b7a',
  novaOffice: '#7a5a6b',
  deltaStation: '#6b7a5a',
  bestieReception: '#7a6b5a',
  dexterDesk: '#5a7a6b',
  hallway: '#3a3a5a',
  wallOutline: '#6a6a8a'
};

// Set canvas size to full window with HiDPI support
function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';
  
  ctx.scale(dpr, dpr);
  
  // Calculate scale based on window size
  scale = Math.min(canvas.width / MIN_WIDTH / dpr, canvas.height / MIN_HEIGHT / dpr);
  
  // Enforce min/max scale constraints
  const MIN_SCALE = 0.4;
  const MAX_SCALE = 1.5;
  scale = Math.max(MIN_SCALE, Math.min(scale, MAX_SCALE));
  
  window.scale = scale;
  
  // Update scale indicator if exists
  updateScaleIndicator();
  
  draw();
}

// Scale indicator for mobile visibility
function updateScaleIndicator() {
  let indicator = document.getElementById('scale-indicator');
  if (!indicator) {
    indicator = document.createElement('div');
    indicator.id = 'scale-indicator';
    indicator.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      background: rgba(30, 30, 50, 0.9);
      color: #aaa;
      padding: 8px 12px;
      border-radius: 6px;
      font-family: Arial, sans-serif;
      font-size: 12px;
      z-index: 100;
      display: none;
    `;
    document.body.appendChild(indicator);
  }
  
  // Show indicator only on small screens
  if (window.innerWidth < 768 || window.innerHeight < 600) {
    indicator.textContent = `Scale: ${Math.round(scale * 100)}%`;
    indicator.style.display = 'block';
  } else {
    indicator.style.display = 'none';
  }
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Draw the office layout
function draw(timestamp = 0) {
  animationTimestamp = timestamp;
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const w = MIN_WIDTH * scale;
  const h = MIN_HEIGHT * scale;
  const x = cx - w / 2;
  const y = cy - h / 2;
  
  // Clear canvas
  ctx.fillStyle = COLORS.floor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Apply day/night ambient overlay
  const ambient = getAmbientOverlay();
  ctx.fillStyle = ambient.color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw time display in corner
  ctx.fillStyle = '#ffffff';
  ctx.font = `${14 * scale}px Arial`;
  ctx.textAlign = 'left';
  ctx.fillText(getTimeDisplay(), 20 * scale, 30 * scale);
  
  // Draw lighting state indicator
  const lightingState = getLightingState();
  const stateLabel = lightingState.charAt(0).toUpperCase() + lightingState.slice(1);
  ctx.fillStyle = lightingState === 'night' ? '#8888ff' : lightingState === 'evening' ? '#ffaa55' : '#ffff88';
  ctx.fillText(stateLabel, 20 * scale, 50 * scale);
  
  // Office outer walls
  ctx.strokeStyle = COLORS.wallOutline;
  ctx.lineWidth = 4 * scale;
  ctx.strokeRect(x, y, w, h);
  
  // Hallway (center connecting left and right)
  const hallwayY = y + h * 0.35;
  const hallwayH = h * 0.3;
  ctx.fillStyle = COLORS.hallway;
  ctx.fillRect(x + w * 0.3, hallwayY, w * 0.4, hallwayH);
  
  // LEFT SIDE - Kitchen/Lounge Area
  const leftX = x + w * 0.02;
  const leftW = w * 0.28;
  const leftY = y + h * 0.05;
  const leftH = h * 0.9;
  
  // Kitchen area
  ctx.fillStyle = COLORS.kitchen;
  ctx.fillRect(leftX, leftY, leftW, leftH * 0.45);
  
  // Lounge area
  ctx.fillStyle = COLORS.lounge;
  ctx.fillRect(leftX, leftY + leftH * 0.45, leftW, leftH * 0.55);
  
  // Kitchen elements - Coffee machine
  ctx.fillStyle = COLORS.coffeeMachine;
  ctx.fillRect(leftX + leftW * 0.1, leftY + leftH * 0.1, leftW * 0.3, leftH * 0.15);
  
  // Kitchen counter
  ctx.fillStyle = '#5a5a7a';
  ctx.fillRect(leftX + leftW * 0.5, leftY + leftH * 0.05, leftW * 0.45, leftH * 0.12);
  
  // Lounge elements - Couches
  ctx.fillStyle = COLORS.couch;
  ctx.fillRect(leftX + leftW * 0.1, leftY + leftH * 0.55, leftW * 0.35, leftH * 0.12);
  ctx.fillRect(leftX + leftW * 0.55, leftY + leftH * 0.55, leftW * 0.35, leftH * 0.12);
  
  // Lounge coffee table
  ctx.fillStyle = '#6a5a4a';
  ctx.fillRect(leftX + leftW * 0.35, leftY + leftH * 0.7, leftW * 0.3, leftH * 0.08);
  
  // Plants
  ctx.fillStyle = COLORS.plant;
  ctx.beginPath();
  ctx.arc(leftX + leftW * 0.15, leftY + leftH * 0.42, leftW * 0.06, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(leftX + leftW * 0.85, leftY + leftH * 0.42, leftW * 0.06, 0, Math.PI * 2);
  ctx.fill();
  
  // Kitchen/Lounge label
  ctx.fillStyle = '#aaa';
  ctx.font = `${14 * scale}px Arial`;
  ctx.textAlign = 'center';
  ctx.fillText('KITCHEN', leftX + leftW / 2, leftY + leftH * 0.25);
  ctx.fillText('LOUNGE', leftX + leftW / 2, leftY + leftH * 0.7);
  
  // Draw ping pong table in lounge (Phase 7)
  if (window.drawPingPongTable) {
    const tableX = leftX + leftW * 0.55;
    const tableY = leftY + leftH * 0.72;
    const tableW = leftW * 0.4;
    const tableH = leftH * 0.22;
    window.drawPingPongTable(ctx, tableX, tableY, tableW, tableH, scale);
    
    // Draw active ping pong game if running
    window.drawPingPongGame(ctx, tableX, tableY, tableW, tableH, scale);
  }
  
  // Draw arcade machine in lounge (Phase 7)
  if (window.drawArcadeMachine) {
    const arcadeX = leftX + leftW * 0.08;
    const arcadeY = leftY + leftH * 0.52;
    const arcadeW = leftW * 0.2;
    const arcadeH = leftH * 0.25;
    window.drawArcadeMachine(ctx, arcadeX, arcadeY, arcadeW, arcadeH, scale);
    
    // Draw active arcade game if running
    window.drawArcadeScreen(ctx, arcadeX, arcadeY, arcadeW, arcadeH);
  }
  
  // RIGHT SIDE - Desk Area
  const rightX = x + w * 0.7;
  const rightW = w * 0.28;
  const rightY = y + h * 0.05;
  const rightH = h * 0.9;
  
  // Desk area floor
  ctx.fillStyle = COLORS.floorAccent;
  ctx.fillRect(rightX, rightY, rightW, rightH);
  
  // RIGHT TOP - Nova's Corner Office
  const novaX = rightX + rightW * 0.05;
  const novaY = rightY + rightH * 0.03;
  const novaW = rightW * 0.4;
  const novaH = rightH * 0.25;
  ctx.fillStyle = COLORS.novaOffice;
  ctx.fillRect(novaX, novaY, novaW, novaH);
  
  // Whiteboard in Nova's office
  drawWhiteboard(novaX, novaY, novaW, novaH);
  
  // Motivational poster
  drawMotivationalPoster(rightX, rightY, rightW, rightH, scale);
  
  // Nova's desk details - monitor
  ctx.fillStyle = '#3a3a5a';
  ctx.fillRect(novaX + novaW * 0.15, novaY + novaH * 0.5, novaW * 0.25, novaH * 0.15);
  ctx.fillStyle = '#6a8aff';
  ctx.fillRect(novaX + novaW * 0.17, novaY + novaH * 0.52, novaW * 0.21, novaH * 0.11);
  // Nova's desk chair
  ctx.fillStyle = '#8a5a7a';
  ctx.fillRect(novaX + novaW * 0.6, novaY + novaH * 0.55, novaW * 0.2, novaH * 0.25);
  // Nova name plate
  ctx.fillStyle = '#ccaacc';
  ctx.fillRect(novaX + novaW * 0.7, novaY + novaH * 0.85, novaW * 0.2, novaH * 0.08);
  ctx.fillStyle = '#000';
  ctx.font = `${8 * scale}px Arial`;
  ctx.fillText('NOVA', novaX + novaW * 0.8, novaY + novaH * 0.9);
  
  ctx.fillStyle = '#fff';
  ctx.font = `${10 * scale}px Arial`;
  ctx.fillText('NOVA', novaX + novaW / 2, novaY + novaH / 2);
  ctx.fillText('OFFICE', novaX + novaW / 2, novaY + novaH / 2 + 14 * scale);
  
  // RIGHT TOP - Delta Station
  const deltaX = rightX + rightW * 0.55;
  const deltaY = rightY + rightH * 0.03;
  const deltaW = rightW * 0.4;
  const deltaH = rightH * 0.25;
  ctx.fillStyle = COLORS.deltaStation;
  ctx.fillRect(deltaX, deltaY, deltaW, deltaH);
  
  // Delta's desk details - dual monitors
  ctx.fillStyle = '#3a3a5a';
  ctx.fillRect(deltaX + deltaW * 0.1, deltaY + deltaH * 0.45, deltaW * 0.2, deltaH * 0.12);
  ctx.fillRect(deltaX + deltaW * 0.35, deltaY + deltaH * 0.45, deltaW * 0.2, deltaH * 0.12);
  ctx.fillStyle = '#8aff8a';
  ctx.fillRect(deltaX + deltaW * 0.12, deltaY + deltaH * 0.47, deltaW * 0.16, deltaH * 0.08);
  ctx.fillRect(deltaX + deltaW * 0.37, deltaY + deltaH * 0.47, deltaW * 0.16, deltaH * 0.08);
  // Delta's review chair
  ctx.fillStyle = '#7a7a5a';
  ctx.fillRect(deltaX + deltaW * 0.65, deltaY + deltaH * 0.5, deltaW * 0.2, deltaH * 0.3);
  // Delta name plate
  ctx.fillStyle = '#cccc88';
  ctx.fillRect(deltaX + deltaW * 0.7, deltaY + deltaH * 0.85, deltaW * 0.2, deltaH * 0.08);
  ctx.fillStyle = '#000';
  ctx.font = `${8 * scale}px Arial`;
  ctx.fillText('DELTA', deltaX + deltaW * 0.8, deltaY + deltaH * 0.9);
  
  ctx.fillStyle = '#fff';
  ctx.fillText('DELTA', deltaX + deltaW / 2, deltaY + deltaH / 2);
  ctx.fillText('STATION', deltaX + deltaW / 2, deltaY + deltaH / 2 + 14 * scale);
  
  // RIGHT MIDDLE - 3 Zero Pods (Row of 3)
  const podY = rightY + rightH * 0.32;
  const podH = rightH * 0.18;
  const podW = rightW * 0.28;
  
  const podNames = ['ZERO-1', 'ZERO-2', 'ZERO-3'];
  for (let i = 0; i < 3; i++) {
    const podX = rightX + rightW * (0.05 + i * 0.32);
    const currentPodName = podNames[i];
    ctx.fillStyle = COLORS.zeroPod;
    ctx.fillRect(podX, podY, podW, podH);
    
    // Zero pod desk details - monitor
    ctx.fillStyle = '#3a3a5a';
    ctx.fillRect(podX + podW * 0.15, podY + podH * 0.4, podW * 0.25, podH * 0.2);
    ctx.fillStyle = '#8a8aff';
    ctx.fillRect(podX + podW * 0.17, podY + podH * 0.42, podW * 0.21, podH * 0.16);
    // Zero pod chair
    ctx.fillStyle = '#5a6a7a';
    ctx.fillRect(podX + podW * 0.6, podY + podH * 0.45, podW * 0.25, podH * 0.35);
    // Zero name plate
    ctx.fillStyle = '#aaaacc';
    ctx.fillRect(podX + podW * 0.7, podY + podH * 0.8, podW * 0.2, podH * 0.1);
    ctx.fillStyle = '#000';
    ctx.font = `${7 * scale}px Arial`;
    ctx.fillText(currentPodName, podX + podW * 0.8, podY + podH * 0.87);
    
    ctx.fillStyle = '#fff';
    ctx.font = `${10 * scale}px Arial`;
    ctx.fillText('ZERO', podX + podW / 2, podY + podH / 2);
    ctx.fillText('POD ' + (i + 1), podX + podW / 2, podY + podH / 2 + 12 * scale);
  }
  
  // RIGHT BOTTOM LEFT - Bestie Reception
  const bestieX = rightX + rightW * 0.05;
  const bestieY = rightY + rightH * 0.55;
  const bestieW = rightW * 0.4;
  const bestieH = rightH * 0.2;
  ctx.fillStyle = COLORS.bestieReception;
  ctx.fillRect(bestieX, bestieY, bestieW, bestieH);
  
  // Bestie reception desk details - computer
  ctx.fillStyle = '#3a3a5a';
  ctx.fillRect(bestieX + bestieW * 0.15, bestieY + bestieH * 0.35, bestieW * 0.25, bestieH * 0.25);
  ctx.fillStyle = '#8aff8a';
  ctx.fillRect(bestieX + bestieW * 0.17, bestieY + bestieH * 0.38, bestieW * 0.21, bestieH * 0.19);
  // Bestie chair
  ctx.fillStyle = '#7a5a4a';
  ctx.fillRect(bestieX + bestieW * 0.55, bestieY + bestieH * 0.4, bestieW * 0.3, bestieH * 0.4);
  // Reception sign
  ctx.fillStyle = '#ccaa88';
  ctx.fillRect(bestieX + bestieW * 0.1, bestieY - bestieH * 0.15, bestieW * 0.35, bestieH * 0.12);
  ctx.fillStyle = '#000';
  ctx.font = `${7 * scale}px Arial`;
  ctx.fillText('WELCOME', bestieX + bestieW * 0.27, bestieY - bestieH * 0.06);
  
  ctx.fillStyle = '#fff';
  ctx.font = `${10 * scale}px Arial`;
  ctx.fillText('BESTIE', bestieX + bestieW / 2, bestieY + bestieH / 2);
  ctx.fillText('RECEPTION', bestieX + bestieW / 2, bestieY + bestieH / 2 + 12 * scale);
  
  // RIGHT BOTTOM RIGHT - Dexter Flex Desk
  const dexterX = rightX + rightW * 0.55;
  const dexterY = rightY + rightH * 0.55;
  const dexterW = rightW * 0.4;
  const dexterH = rightH * 0.2;
  ctx.fillStyle = COLORS.dexterDesk;
  ctx.fillRect(dexterX, dexterY, dexterW, dexterH);
  
  // Dexter flex desk details - laptop
  ctx.fillStyle = '#3a3a5a';
  ctx.fillRect(dexterX + dexterW * 0.15, dexterY + dexterH * 0.4, dexterW * 0.3, dexterH * 0.2);
  ctx.fillStyle = '#8affff';
  ctx.fillRect(dexterX + dexterW * 0.17, dexterY + dexterH * 0.42, dexterW * 0.26, dexterH * 0.16);
  // Dexter chair (stool)
  ctx.fillStyle = '#6a5a7a';
  ctx.fillRect(dexterX + dexterW * 0.55, dexterY + dexterH * 0.5, dexterW * 0.15, dexterH * 0.3);
  // Hot desk sign
  ctx.fillStyle = '#aaccff';
  ctx.fillRect(dexterX + dexterW * 0.7, dexterY + dexterH * 0.8, dexterW * 0.25, dexterH * 0.12);
  ctx.fillStyle = '#000';
  ctx.font = `${7 * scale}px Arial`;
  ctx.fillText('HOT', dexterX + dexterW * 0.82, dexterY + dexterH * 0.88);
  
  ctx.fillStyle = '#fff';
  ctx.font = `${10 * scale}px Arial`;
  ctx.fillText('DEXTER', dexterX + dexterW / 2, dexterY + dexterH / 2);
  ctx.fillText('FLEX', dexterX + dexterW / 2, dexterY + dexterH / 2 + 12 * scale);
  
  // Meeting pods at bottom
  const meetingY = rightY + rightH * 0.8;
  const meetingW = rightW * 0.28;
  const meetingH = rightH * 0.17;
  
  for (let i = 0; i < 2; i++) {
    const meetingX = rightX + rightW * (0.05 + i * 0.5);
    ctx.fillStyle = '#5a5a7a';
    ctx.fillRect(meetingX, meetingY, meetingW, meetingH);
    ctx.fillStyle = '#fff';
    ctx.fillText('MEETING', meetingX + meetingW / 2, meetingY + meetingH / 2);
    ctx.fillText('ROOM ' + (i + 1), meetingX + meetingW / 2, meetingY + meetingH / 2 + 12 * scale);
  }
  
  // Hallway labels
  ctx.fillStyle = '#777';
  ctx.font = `${12 * scale}px Arial`;
  ctx.fillText('HALLWAY', x + w * 0.5, hallwayY + hallwayH / 2 + 4 * scale);
  
  // Water cooler in hallway/middle area
  drawWaterCooler(x + w * 0.5, hallwayY + hallwayH / 2, scale);
  
  // Arrow indicators in hallway
  ctx.strokeStyle = '#666';
  ctx.lineWidth = 2 * scale;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.38, hallwayY + hallwayH / 2);
  ctx.lineTo(x + w * 0.43, hallwayY + hallwayH / 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + w * 0.62, hallwayY + hallwayH / 2);
  ctx.lineTo(x + w * 0.57, hallwayY + hallwayH / 2);
  ctx.stroke();
  
  // Draw ambient animations (Phase 4)
  drawAmbientAnimations(timestamp);
  
  // Draw day/night elements (desk lamps, window)
  const bounds = getOfficeBounds();
  drawDeskLamps(bounds.x, bounds.y, bounds.w, bounds.h);
  drawWindow(bounds.x, bounds.y, bounds.w, bounds.h);
  
  // Draw character sprites on top of the office layout
  if (window.drawCharacters) {
    window.drawCharacters();
  }
}

// Animation loop for state machine
let lastTime = 0;
let stateCycleTimer = 0;
const STATE_CYCLE_INTERVAL = 5000; // 5 seconds

function gameLoop(timestamp) {
  const deltaTime = timestamp - lastTime;
  lastTime = timestamp;
  
  // Redraw the office (pass timestamp for animations)
  draw(timestamp);
  
  // Update and draw visual effects (Phase 4)
  if (window.updateCoffeeSteam) {
    window.updateCoffeeSteam(timestamp);
  }
  if (window.drawCoffeeSteam) {
    window.drawCoffeeSteam();
  }
  
  // Update character animations with deltaTime
  if (window.drawCharacters) {
    window.drawCharacters(deltaTime);
  }
  
  // Draw typing particles and monitor glow for working characters
  if (window.CHARACTERS) {
    window.CHARACTERS.forEach(character => {
      if (window.spawnTypingParticles) {
        window.spawnTypingParticles(character);
      }
      if (window.drawMonitorGlow) {
        window.drawMonitorGlow(character);
      }
    });
  }
  if (window.updateTypingParticles) {
    window.updateTypingParticles();
  }
  if (window.drawTypingParticles) {
    window.drawTypingParticles();
  }
  
  // Update and draw speech bubbles
  updateAndDrawSpeechBubbles(timestamp);
  
  // Update and draw office events (Phase 6)
  if (window.updateOfficeEvents) {
    window.updateOfficeEvents(deltaTime);
  }
  if (window.drawOfficeEvents) {
    window.drawOfficeEvents();
  }
  
  // Update and draw visitors (Phase 7)
  if (window.updateVisitors) {
    window.updateVisitors(deltaTime);
  }
  if (window.drawVisitor) {
    window.drawVisitor();
  }
  
  // Update and draw mini-games (Phase 7)
  if (window.updatePingPongGame) {
    window.updatePingPongGame();
  }
  if (window.updateArcadeGame) {
    window.updateArcadeGame();
  }
  
  // Update and draw mood indicators (Phase 5)
  if (window.updateMoods) {
    window.updateMoods(deltaTime);
  }
  if (window.drawMoodIndicators) {
    window.drawMoodIndicators();
  }
  
  // Draw achievement trophies and celebrations (Phase 6)
  drawAchievementTrophies();
  updateAndDrawCelebrations();
  
  // Note: Demo mode disabled - states now driven by live API polling
  // To re-enable demo: uncomment cycleCharacterStates() call below
  // stateCycleTimer += deltaTime;
  // if (stateCycleTimer >= STATE_CYCLE_INTERVAL) {
  //   stateCycleTimer = 0;
  //   cycleCharacterStates();
  // }
  
  requestAnimationFrame(gameLoop);
}

// Demo: Cycle characters through states
function cycleCharacterStates() {
  if (!window.CHARACTERS || !window.CharacterStates) return;
  
  const chars = window.CHARACTERS;
  const states = window.CharacterStates;
  
  chars.forEach((char, index) => {
    // Stagger state changes based on character index
    setTimeout(() => {
      const currentState = char.state;
      let nextState;
      
      // State machine transitions
      switch (currentState) {
        case states.IDLE:
          nextState = states.WALKING_TO_DESK;
          break;
        case states.WALKING_TO_DESK:
          nextState = states.WORKING;
          break;
        case states.WORKING:
          nextState = states.WALKING_TO_LOUNGE;
          break;
        case states.WALKING_TO_LOUNGE:
        default:
          nextState = states.IDLE;
          break;
      }
      
      if (window.setCharacterState) {
        window.setCharacterState(char.id, nextState);
      }
    }, index * 300); // 300ms stagger between each character
  });
}

// Start the animation loop
requestAnimationFrame(gameLoop);

// ============================================================================
// Live Status Polling - Phase 3
// ============================================================================

let statusPollingInterval = null;
let previousAgentStates = new Map();

// Map API agent IDs to character IDs
const API_TO_CHARACTER_MAP = {
  'nova': 'nova',
  'zero': 'zero1',
  'zero-2': 'zero2',
  'zero-3': 'zero3',
  'delta': 'delta',
  'bestie': 'bestie',
  'dexter': 'dexter'
};

// Start polling /api/status for live agent updates
function startStatusPolling() {
  if (statusPollingInterval) return;
  
  // Initial fetch
  fetchAgentStatus();
  
  // Poll every 5 seconds
  statusPollingInterval = setInterval(fetchAgentStatus, 5000);
}

// Stop polling
function stopStatusPolling() {
  if (statusPollingInterval) {
    clearInterval(statusPollingInterval);
    statusPollingInterval = null;
  }
}

// Fetch agent status from API
async function fetchAgentStatus() {
  try {
    const response = await fetch('/api/status');
    const data = await response.json();
    
    if (data.agents && Array.isArray(data.agents)) {
      processAgentStatus(data.agents);
    }
  } catch (err) {
    console.error('Failed to fetch agent status:', err.message);
  }
}

// Process agent status and trigger state transitions
function processAgentStatus(agents) {
  if (!window.CHARACTERS || !window.CharacterStates) return;
  
  const states = window.CharacterStates;
  
  agents.forEach(agent => {
    const characterId = API_TO_CHARACTER_MAP[agent.id];
    if (!characterId) return;
    
    const character = window.CHARACTERS.find(c => c.id === characterId);
    if (!character) return;
    
    // Get previous state
    const prevState = previousAgentStates.get(characterId);
    const currentState = character.state;
    
    // Update stored task info
    if (agent.currentTask) {
      character.currentTask = agent.currentTask;
    }
    
    // Only react to state CHANGES (not every poll)
    if (prevState !== undefined && prevState !== agent.state) {
      // State changed! Trigger transition
      if (agent.state === 'working' && currentState !== states.WORKING && 
          currentState !== states.WALKING_TO_DESK) {
        // Agent started working - walk to desk
        window.setCharacterState(characterId, states.WALKING_TO_DESK);
        // Show speech bubble for starting task
        showSpeechBubble(characterId, character.name, 'start', agent.currentTask);
        // Add timeline event (Phase 6)
        if (window.addTimelineEvent) {
          window.addTimelineEvent(character.name, 'started', agent.currentTask);
        }
        // Trigger sound on agent start (Phase 8)
        if (window.onAgentStart) {
          window.onAgentStart(character);
        }
      } else if (agent.state === 'idle' && currentState === states.WORKING) {
        // Agent stopped working - walk back to lounge
        window.setCharacterState(characterId, states.WALKING_TO_LOUNGE);
        // Show speech bubble for completing task
        showSpeechBubble(characterId, character.name, 'complete');
        // Add timeline event (Phase 6)
        if (window.addTimelineEvent) {
          window.addTimelineEvent(character.name, 'completed');
        }
        // Trigger happy mood on task completion (Phase 5)
        if (window.onTaskComplete) {
          window.onTaskComplete(character);
        }
      }
    }
    
    // Store current state for next comparison
    previousAgentStates.set(characterId, agent.state);
  });
}

// ============================================================================
// Activity Timeline - Phase 6
// ============================================================================

// Timeline state
const MAX_TIMELINE_EVENTS = 20;

// Add event to timeline
function addTimelineEvent(agentName, eventType, taskName = null) {
  const event = {
    id: Date.now() + Math.random(),
    timestamp: new Date(),
    agentName: agentName,
    eventType: eventType,
    taskName: taskName
  };
  
  timelineEvents.unshift(event);
  
  // Keep only last 20 events
  if (timelineEvents.length > MAX_TIMELINE_EVENTS) {
    timelineEvents.pop();
  }
  
  renderTimeline();
}

// Format timestamp for display
function formatEventTime(date) {
  const now = new Date();
  const diff = now - date;
  
  // Less than 1 minute ago
  if (diff < 60000) {
    return 'just now';
  }
  
  // Less than 1 hour ago
  if (diff < 3600000) {
    const mins = Math.floor(diff / 60000);
    return `${mins}m ago`;
  }
  
  // Otherwise show time
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Render timeline events
function renderTimeline() {
  const container = document.getElementById('timeline-events');
  if (!container) return;
  
  if (timelineEvents.length === 0) {
    container.innerHTML = '<div class="timeline-empty">No activity yet</div>';
    return;
  }
  
  container.innerHTML = timelineEvents.map(event => {
    const typeLabels = {
      'started': 'Started working',
      'completed': 'Completed task',
      'idle': 'Became idle'
    };
    
    return `
      <div class="timeline-event ${event.eventType}">
        <div class="event-header">
          <span class="event-agent">${event.agentName}</span>
          <span class="event-time">${formatEventTime(event.timestamp)}</span>
        </div>
        <div class="event-type">${typeLabels[event.eventType] || event.eventType}</div>
        ${event.taskName ? `<div class="event-task">${event.taskName}</div>` : ''}
      </div>
    `;
  }).join('');
  
  // Auto-scroll to top (newest)
  container.scrollTop = 0;
}

// Toggle timeline panel
function setupTimelineToggle() {
  const toggleBtn = document.getElementById('timeline-toggle');
  const panel = document.getElementById('timeline-panel');
  
  if (toggleBtn && panel) {
    toggleBtn.addEventListener('click', () => {
      panel.classList.toggle('collapsed');
      toggleBtn.textContent = panel.classList.contains('collapsed') ? '▶' : '◀';
    });
  }
}

// Highlight agent in timeline (click handler)
function highlightAgentInTimeline(characterId) {
  // Could be extended to highlight specific events
  console.log('Highlight agent:', characterId);
}

// Make functions available globally
window.addTimelineEvent = addTimelineEvent;
window.highlightAgentInTimeline = highlightAgentInTimeline;

// ============================================================================
// Ambient Animations - Phase 4 & 5 - Office Ambiance
// ============================================================================

// Draw ambient animations (clock, plants swaying, light flicker)
function drawAmbientAnimations(timestamp) {
  // Clock second hand animation - uses real time
  clockTime = new Date();
  const seconds = clockTime.getSeconds();
  const minutes = clockTime.getMinutes();
  const hours = clockTime.getHours();
  
  // Second hand angle
  clockAngle = seconds * (Math.PI / 30);
  // Minute hand angle (moves gradually)
  const minuteAngle = minutes * (Math.PI / 30) + seconds / 60 * (Math.PI / 1800);
  // Hour hand angle
  const hourAngle = (hours % 12 + minutes / 60) * (Math.PI / 6);
  
  const { x, y, w, h } = getOfficeBounds();
  
  // Draw clock in hallway
  const clockX = x + w * 0.5;
  const clockY = y + h * 0.12;
  const clockRadius = 18 * scale;
  
  // Clock face
  ctx.fillStyle = '#2a2a3a';
  ctx.beginPath();
  ctx.arc(clockX, clockY, clockRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#6a6a8a';
  ctx.lineWidth = 2 * scale;
  ctx.stroke();
  
  // Clock border
  ctx.strokeStyle = '#aaa';
  ctx.lineWidth = 1 * scale;
  ctx.beginPath();
  ctx.arc(clockX, clockY, clockRadius - 1 * scale, 0, Math.PI * 2);
  ctx.stroke();
  
  // Clock center dot
  ctx.fillStyle = '#ff6b6b';
  ctx.beginPath();
  ctx.arc(clockX, clockY, 2 * scale, 0, Math.PI * 2);
  ctx.fill();
  
  // Hour hand
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.5 * scale;
  ctx.beginPath();
  ctx.moveTo(clockX, clockY);
  ctx.lineTo(
    clockX + Math.sin(hourAngle) * (clockRadius * 0.5),
    clockY - Math.cos(hourAngle) * (clockRadius * 0.5)
  );
  ctx.stroke();
  
  // Minute hand
  ctx.strokeStyle = '#cccccc';
  ctx.lineWidth = 2 * scale;
  ctx.beginPath();
  ctx.moveTo(clockX, clockY);
  ctx.lineTo(
    clockX + Math.sin(minuteAngle) * (clockRadius * 0.7),
    clockY - Math.cos(minuteAngle) * (clockRadius * 0.7)
  );
  ctx.stroke();
  
  // Second hand (red)
  const secondHandLength = clockRadius - 4 * scale;
  ctx.strokeStyle = '#ff6b6b';
  ctx.lineWidth = 1.5 * scale;
  ctx.beginPath();
  ctx.moveTo(clockX, clockY);
  ctx.lineTo(
    clockX + Math.sin(clockAngle) * secondHandLength,
    clockY - Math.cos(clockAngle) * secondHandLength
  );
  ctx.stroke();
  
  // Clock tick marks
  ctx.strokeStyle = '#666';
  ctx.lineWidth = 1 * scale;
  for (let i = 0; i < 12; i++) {
    const tickAngle = i * (Math.PI / 6);
    const innerR = clockRadius - 6 * scale;
    const outerR = clockRadius - 2 * scale;
    ctx.beginPath();
    ctx.moveTo(clockX + Math.sin(tickAngle) * innerR, clockY - Math.cos(tickAngle) * innerR);
    ctx.lineTo(clockX + Math.sin(tickAngle) * outerR, clockY - Math.cos(tickAngle) * outerR);
    ctx.stroke();
  }
  
  // Plant swaying (in kitchen area)
  drawSwayingPlants(timestamp);
  
  // Coffee steam animation
  drawCoffeeSteam(timestamp);
  
  // Update water cooler bubbles
  updateWaterCoolerBubbles(timestamp);
  
  // Subtle fluorescent light flicker
  drawLightFlicker(timestamp);
}

// Plant swaying animation
function drawSwayingPlants(timestamp) {
  const { x, y, w, h } = getOfficeBounds();
  
  // Two plants in kitchen/lounge area
  const plantPositions = [
    { x: x + w * 0.15, y: y + h * 0.42 },
    { x: x + w * 0.85, y: y + h * 0.42 }
  ];
  
  plantPositions.forEach((pos, index) => {
    const swayOffset = Math.sin(timestamp / 1000 + index * Math.PI) * 3 * scale;
    
    // Plant pot
    ctx.fillStyle = '#5a4a3a';
    ctx.fillRect(pos.x - 8 * scale, pos.y, 16 * scale, 10 * scale);
    
    // Plant leaves with sway
    ctx.fillStyle = '#4a7a5a';
    for (let i = 0; i < 5; i++) {
      const leafAngle = (i - 2) * 0.3 + swayOffset * 0.02;
      ctx.beginPath();
      ctx.ellipse(
        pos.x + swayOffset * (i - 2) * 0.3,
        pos.y - 8 * scale - i * 4 * scale,
        4 * scale,
        8 * scale,
        leafAngle,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  });
}

// Fluorescent light flicker effect
function drawLightFlicker(timestamp) {
  // Only flicker occasionally (every ~10-30 seconds)
  const flickerChance = Math.sin(timestamp / 15000) > 0.95;
  const flickerIntensity = flickerChance ? Math.random() * 0.15 : 0;
  
  if (flickerIntensity > 0) {
    // Apply subtle overlay to simulate light flicker
    const { x, y, w, h } = getOfficeBounds();
    ctx.fillStyle = `rgba(200, 200, 255, ${flickerIntensity})`;
    ctx.fillRect(x, y, w, h);
  }
}

// ============================================================================
// Whiteboard in Nova's Office
// ============================================================================

function drawWhiteboard(novaX, novaY, novaW, novaH) {
  const wbX = novaX + novaW * 0.55;
  const wbY = novaY + novaH * 0.1;
  const wbW = novaW * 0.4;
  const wbH = novaH * 0.45;
  
  // Whiteboard frame
  ctx.fillStyle = '#5a5a6a';
  ctx.fillRect(wbX - 3 * scale, wbY - 3 * scale, wbW + 6 * scale, wbH + 6 * scale);
  
  // Whiteboard surface
  ctx.fillStyle = '#f0f0e8';
  ctx.fillRect(wbX, wbY, wbW, wbH);
  
  // Draw diagram based on Nova's working state
  const isNovaWorking = window.CHARACTERS?.find(c => c.id === 'nova')?.state === 'Working';
  
  if (isNovaWorking) {
    whiteboardProgress = Math.min(1, whiteboardProgress + 0.02);
  } else {
    whiteboardProgress = Math.max(0, whiteboardProgress - 0.01);
  }
  
  if (whiteboardProgress > 0.1) {
    drawWhiteboardDiagram(wbX, wbY, wbW, wbH);
  }
}

function drawWhiteboardDiagram(wbX, wbY, wbW, wbH) {
  const diagram = whiteboardDiagrams[currentWhiteboardDiagram];
  const progress = whiteboardProgress;
  ctx.save();
  ctx.globalAlpha = progress;
  ctx.strokeStyle = diagram.color;
  ctx.fillStyle = diagram.color;
  ctx.lineWidth = 2 * scale;
  
  const padding = wbW * 0.15;
  const innerW = wbW - padding * 2;
  const innerH = wbH - padding * 2;
  
  if (diagram.type === 'flowchart') {
    // Simple flowchart
    const boxW = innerW * 0.35;
    const boxH = innerH * 0.25;
    const startX = wbX + padding;
    const startY = wbY + padding;
    
    // Start box
    ctx.strokeRect(startX, startY + innerH * 0.1, boxW, boxH);
    ctx.fillText('START', startX + boxW/2, startY + innerH * 0.1 + boxH/2);
    
    // Arrow
    ctx.beginPath();
    ctx.moveTo(startX + boxW, startY + innerH * 0.1 + boxH/2);
    ctx.lineTo(startX + boxW + 15 * scale, startY + innerH * 0.1 + boxH/2);
    ctx.stroke();
    
    // Process box
    const processX = startX + boxW + 15 * scale;
    ctx.strokeRect(processX, startY + innerH * 0.1, boxW, boxH);
    
    // Decision diamond
    ctx.beginPath();
    ctx.moveTo(processX + boxW + innerW * 0.15, startY + innerH * 0.3);
    ctx.lineTo(processX + boxW + innerW * 0.15 + boxH * 0.5, startY + innerH * 0.45);
    ctx.lineTo(processX + boxW + innerW * 0.15, startY + innerH * 0.6);
    ctx.lineTo(processX + boxW + innerW * 0.15 - boxH * 0.5, startY + innerH * 0.45);
    ctx.closePath();
    ctx.stroke();
    
  } else if (diagram.type === 'boxes') {
    // Grid of boxes
    const boxSize = innerW * 0.25;
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 2; col++) {
        ctx.strokeRect(
          wbX + padding + col * (boxSize + 8 * scale),
          wbY + padding + row * (boxSize + 8 * scale),
          boxSize, boxSize
        );
      }
    }
    
  } else if (diagram.type === 'circles') {
    // Connected circles
    const centerX = wbX + wbW / 2;
    const centerY = wbY + wbH / 2;
    const radius = innerH * 0.25;
    
    // Three circles in triangle
    const positions = [
      { x: centerX, y: centerY - radius },
      { x: centerX - radius * 0.8, y: centerY + radius * 0.5 },
      { x: centerX + radius * 0.8, y: centerY + radius * 0.5 }
    ];
    
    positions.forEach(pos => {
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius * 0.35, 0, Math.PI * 2);
      ctx.stroke();
    });
    
    // Connecting lines
    ctx.beginPath();
    ctx.moveTo(positions[0].x, positions[0].y);
    ctx.lineTo(positions[1].x, positions[1].y);
    ctx.lineTo(positions[2].x, positions[2].y);
    ctx.lineTo(positions[0].x, positions[0].y);
    ctx.stroke();
  }
  
  ctx.restore();
}

// ============================================================================
// Motivational Poster
// ============================================================================

function drawMotivationalPoster(rightX, rightY, rightW, rightH, scale) {
  const posterX = rightX + rightW * 0.52;
  const posterY = rightY + rightH * 0.53;
  const posterW = rightW * 0.2;
  const posterH = rightH * 0.15;
  
  // Poster frame
  ctx.fillStyle = '#3a3a4a';
  ctx.fillRect(posterX - 2 * scale, posterY - 2 * scale, posterW + 4 * scale, posterH + 4 * scale);
  
  // Poster background - gradient
  const gradient = ctx.createLinearGradient(posterX, posterY, posterX, posterY + posterH);
  gradient.addColorStop(0, '#1a1a2e');
  gradient.addColorStop(1, '#2d2d44');
  ctx.fillStyle = gradient;
  ctx.fillRect(posterX, posterY, posterW, posterH);
  
  // Simple geometric design
  ctx.strokeStyle = '#ff6b35';
  ctx.lineWidth = 2 * scale;
  ctx.beginPath();
  ctx.moveTo(posterX + posterW * 0.2, posterY + posterH * 0.3);
  ctx.lineTo(posterX + posterW * 0.5, posterY + posterH * 0.7);
  ctx.lineTo(posterX + posterW * 0.8, posterY + posterH * 0.3);
  ctx.stroke();
  
  // Text - "FOCUS" at bottom
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${8 * scale}px Arial`;
  ctx.textAlign = 'center';
  ctx.fillText('FOCUS', posterX + posterW / 2, posterY + posterH * 0.9);
}

// ============================================================================
// Water Cooler with Bubble Animation
// ============================================================================

function drawWaterCooler(x, y, scale) {
  const wcX = x - 20 * scale;
  const wcY = y - 35 * scale;
  const wcW = 25 * scale;
  const wcH = 50 * scale;
  
  // Water cooler base
  ctx.fillStyle = '#4a6a8a';
  ctx.fillRect(wcX, wcY + wcH * 0.35, wcW, wcH * 0.65);
  
  // Water bottle on top
  ctx.fillStyle = '#6a8aff';
  ctx.beginPath();
  ctx.arc(wcX + wcW / 2, wcY + wcH * 0.2, wcW * 0.4, Math.PI, 0);
  ctx.fill();
  
  // Water bottle body
  ctx.fillRect(wcX + wcW * 0.2, wcY + wcH * 0.2, wcW * 0.6, wcH * 0.18);
  
  // Water level (blue)
  ctx.fillStyle = '#4a8aff';
  ctx.fillRect(wcX + wcW * 0.25, wcY + wcH * 0.22, wcW * 0.5, wcH * 0.12);
  
  // Draw bubbles
  ctx.fillStyle = 'rgba(150, 200, 255, 0.7)';
  waterCoolerBubbles.forEach(bubble => {
    ctx.beginPath();
    ctx.arc(bubble.x, bubble.y, bubble.size, 0, Math.PI * 2);
    ctx.fill();
  });
}

function updateWaterCoolerBubbles(timestamp) {
  // Spawn new bubbles occasionally
  if (Math.random() < 0.03) {
    waterCoolerBubbles.push({
      x: 0, // Will be set relative to cooler
      y: 0,
      size: 1.5 + Math.random() * 2,
      speed: 0.3 + Math.random() * 0.4,
      wobble: Math.random() * Math.PI * 2
    });
  }
  
  // Update bubble positions
  const coolerX = canvas.width / 2;
  const coolerY = canvas.height / 2 + 80;
  
  for (let i = waterCoolerBubbles.length - 1; i >= 0; i--) {
    const bubble = waterCoolerBubbles[i];
    bubble.y -= bubble.speed;
    bubble.wobble += 0.1;
    bubble.x = coolerX - 20 + Math.sin(bubble.wobble) * 5;
    
    // Remove bubbles that go off top
    if (bubble.y < coolerY - 35) {
      waterCoolerBubbles.splice(i, 1);
    }
  }
  
  // Limit max bubbles
  while (waterCoolerBubbles.length > 8) {
    waterCoolerBubbles.shift();
  }
}

// ============================================================================
// Coffee Machine with Steam Animation
// ============================================================================

function drawCoffeeSteam(timestamp) {
  const { x, y, w, h } = getOfficeBounds();
  
  // Coffee machine position (kitchen)
  const coffeeX = x + w * 0.05 + w * 0.28 * 0.1;
  const coffeeY = y + h * 0.05 + h * 0.9 * 0.45 * 0.1;
  const coffeeW = w * 0.28 * 0.3;
  const coffeeH = h * 0.9 * 0.45 * 0.15;
  
  // Update steam particles
  if (Math.random() < 0.1) {
    coffeeSteamParticles.push({
      x: coffeeX + coffeeW * 0.3 + Math.random() * coffeeW * 0.4,
      y: coffeeY,
      size: 3 + Math.random() * 4,
      alpha: 0.6,
      speedY: -0.5 - Math.random() * 0.5,
      drift: (Math.random() - 0.5) * 0.5
    });
  }
  
  // Update and draw steam
  coffeeSteamParticles.forEach((particle, index) => {
    particle.y += particle.speedY;
    particle.x += particle.drift;
    particle.alpha -= 0.008;
    particle.size *= 0.98;
    
    if (particle.alpha <= 0 || particle.size < 0.5) {
      coffeeSteamParticles.splice(index, 1);
    } else {
      ctx.fillStyle = `rgba(200, 200, 200, ${particle.alpha})`;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * scale, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  
  // Limit particles
  while (coffeeSteamParticles.length > 15) {
    coffeeSteamParticles.shift();
  }
}

// ============================================================================
// Desk Lamps (Day/Night Cycle)
// ============================================================================

// Helper function to get office bounds
function getOfficeBounds() {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const w = MIN_WIDTH * scale;
  const h = MIN_HEIGHT * scale;
  const x = cx - w / 2;
  const y = cy - h / 2;
  return { x, y, w, h };
}

// Draw desk lamps at each workstation
function drawDeskLamps(x, y, w, h) {
  const lampsOn = areDeskLampsOn();
  
  // Lamp positions for each desk area
  const lampPositions = [
    // Nova's office lamp
    { x: x + w * 0.73, y: y + h * 0.17, scale: 1 },
    // Delta's station lamp
    { x: x + w * 0.88, y: y + h * 0.10, scale: 0.8 },
    // Zero pods (row of 3)
    { x: x + w * 0.74, y: y + h * 0.38, scale: 0.7 },
    { x: x + w * 0.82, y: y + h * 0.38, scale: 0.7 },
    { x: x + w * 0.90, y: y + h * 0.38, scale: 0.7 },
    // Bestie reception lamp
    { x: x + w * 0.74, y: y + h * 0.60, scale: 0.8 },
    // Dexter desk lamp
    { x: x + w * 0.88, y: y + h * 0.60, scale: 0.8 }
  ];
  
  lampPositions.forEach(lamp => {
    const s = lamp.scale * scale;
    
    // Lamp base
    ctx.fillStyle = '#3a3a4a';
    ctx.beginPath();
    ctx.ellipse(lamp.x, lamp.y + 8 * s, 10 * s, 4 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Lamp arm
    ctx.strokeStyle = '#4a4a5a';
    ctx.lineWidth = 2 * s;
    ctx.beginPath();
    ctx.moveTo(lamp.x, lamp.y + 8 * s);
    ctx.lineTo(lamp.x, lamp.y - 5 * s);
    ctx.stroke();
    
    // Lamp shade
    ctx.fillStyle = lampsOn ? '#5a4a3a' : '#4a4a5a';
    ctx.beginPath();
    ctx.moveTo(lamp.x - 12 * s, lamp.y - 5 * s);
    ctx.lineTo(lamp.x + 12 * s, lamp.y - 5 * s);
    ctx.lineTo(lamp.x + 8 * s, lamp.y - 15 * s);
    ctx.lineTo(lamp.x - 8 * s, lamp.y - 15 * s);
    ctx.closePath();
    ctx.fill();
    
    // Lamp glow when on
    if (lampsOn) {
      // Create radial gradient for lamp glow
      const gradient = ctx.createRadialGradient(
        lamp.x, lamp.y - 5 * s, 0,
        lamp.x, lamp.y - 5 * s, 40 * s
      );
      gradient.addColorStop(0, 'rgba(255, 220, 150, 0.4)');
      gradient.addColorStop(0.5, 'rgba(255, 200, 100, 0.2)');
      gradient.addColorStop(1, 'rgba(255, 180, 50, 0)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(lamp.x, lamp.y - 5 * s, 40 * s, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

// Draw window with sky color
function drawWindow(x, y, w, h) {
  // Window position (back wall of office)
  const windowX = x + w * 0.35;
  const windowY = y + h * 0.15;
  const windowW = w * 0.25;
  const windowH = h * 0.35;
  
  // Get sky color based on time
  const skyColor = getSkyColor();
  
  // Window frame
  ctx.fillStyle = '#5a5a7a';
  ctx.fillRect(windowX - 4 * scale, windowY - 4 * scale, windowW + 8 * scale, windowH + 8 * scale);
  
  // Window glass with sky color
  ctx.fillStyle = skyColor;
  ctx.fillRect(windowX, windowY, windowW, windowH);
  
  // Window cross bars
  ctx.strokeStyle = '#6a6a8a';
  ctx.lineWidth = 3 * scale;
  ctx.beginPath();
  ctx.moveTo(windowX + windowW / 2, windowY);
  ctx.lineTo(windowX + windowW / 2, windowY + windowH);
  ctx.moveTo(windowX, windowY + windowH / 2);
  ctx.lineTo(windowX + windowW, windowY + windowH / 2);
  ctx.stroke();
  
  // Add subtle glow at night from window
  if (getLightingState() === LIGHTING_STATES.NIGHT) {
    const gradient = ctx.createLinearGradient(windowX, windowY, windowX - 30 * scale, windowY);
    gradient.addColorStop(0, 'rgba(30, 30, 80, 0.3)');
    gradient.addColorStop(1, 'rgba(30, 30, 80, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(windowX - 30 * scale, windowY, 30 * scale, windowH);
  }
}

// Update monitor colors based on time of day
function getMonitorGlowColor() {
  if (areMonitorsOn()) {
    return '#8a8aff'; // Blue monitor glow
  }
  return '#2a2a3a'; // Off/dark monitor
}

// ============================================================================
// Click Handler for Task Info
// ============================================================================

// Achievement badges configuration
// ============================================================================
// Achievement System - Phase 6
// ============================================================================

// Achievement definitions with tiers
const ACHIEVEMENT_CONFIG = {
  // Task achievements
  'first_task': { 
    label: '🎯 First Task', 
    color: '#4CAF50', 
    tier: 'bronze',
    description: 'Complete your first task'
  },
  'streak_master': { 
    label: '🔥 Streak Master', 
    color: '#FF9800', 
    tier: 'gold',
    description: 'Complete 5 tasks in a row without errors'
  },
  'speed_demon': { 
    label: '⚡ Speed Demon', 
    color: '#F44336', 
    tier: 'silver',
    description: 'Complete a task in under 5 minutes'
  },
  
  // Time-based achievements
  'night_owl': { 
    label: '🦉 Night Owl', 
    color: '#9C27B0', 
    tier: 'silver',
    description: 'Work past 10 PM'
  },
  'early_bird': { 
    label: '🌅 Early Bird', 
    color: '#03A9F4', 
    tier: 'silver',
    description: 'Work before 7 AM'
  },
  
  // Social achievements
  'pizza_lover': { 
    label: '🍕 Pizza Lover', 
    color: '#FF5722', 
    tier: 'gold',
    description: 'Attend 10 pizza parties'
  },
  'code_reviewer': { 
    label: '📝 Code Reviewer', 
    color: '#2196F3', 
    tier: 'gold',
    description: 'Have 10 PRs reviewed'
  },
  
  // Bug achievements
  'bug_hunter': { 
    label: '🐛 Bug Hunter', 
    color: '#8BC34A', 
    tier: 'silver',
    description: 'Fix 5 bugs'
  }
};

// Achievement tier colors
const TIER_COLORS = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700'
};

// Achievement state
const achievementState = {
  earned: [],           // List of earned achievement IDs
  stats: {
    tasksCompleted: 0,
    errors: 0,
    consecutiveTasks: 0,
    prsReviewed: 0,
    bugsFixed: 0,
    pizzaParties: 0,
    timeWorkedToday: 0,
    fastestTaskTime: Infinity
  },
  recentEarnings: []    // Recently earned for animation
};

// Trophy sprite drawing
function drawTrophy(x, y, size, tier, glowIntensity = 0) {
  const tierColor = TIER_COLORS[tier] || TIER_COLORS.bronze;
  
  // Glow effect when earned recently
  if (glowIntensity > 0) {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 2);
    gradient.addColorStop(0, `${tierColor}${Math.floor(glowIntensity * 99).toString(16).padStart(2, '0')}`);
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, size * 2, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Trophy base
  ctx.fillStyle = tierColor;
  ctx.beginPath();
  ctx.moveTo(x - size * 0.4, y + size * 0.3);
  ctx.lineTo(x + size * 0.4, y + size * 0.3);
  ctx.lineTo(x + size * 0.5, y + size * 0.5);
  ctx.lineTo(x - size * 0.5, y + size * 0.5);
  ctx.closePath();
  ctx.fill();
  
  // Trophy cup
  ctx.beginPath();
  ctx.moveTo(x - size * 0.35, y + size * 0.3);
  ctx.lineTo(x - size * 0.25, y - size * 0.2);
  ctx.quadraticCurveTo(x, y - size * 0.5, x + size * 0.25, y - size * 0.2);
  ctx.lineTo(x + size * 0.35, y + size * 0.3);
  ctx.closePath();
  ctx.fill();
  
  // Trophy handles
  ctx.strokeStyle = tierColor;
  ctx.lineWidth = size * 0.15;
  ctx.beginPath();
  ctx.arc(x - size * 0.35, y - size * 0.05, size * 0.2, Math.PI * 0.5, Math.PI * 1.5);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x + size * 0.35, y - size * 0.05, size * 0.2, -Math.PI * 0.5, Math.PI * 0.5);
  ctx.stroke();
  
  // Star on top
  ctx.fillStyle = '#FFF';
  drawStar(x, y - size * 0.35, size * 0.15, 5);
}

function drawStar(cx, cy, outerRadius, points) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : outerRadius * 0.4;
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

// Draw trophies above desks for characters with achievements
function drawAchievementTrophies() {
  if (!window.CHARACTERS) return;
  
  const { x, y, w, h } = getOfficeBounds();
  
  // Character to desk position mapping
  const deskPositions = {
    'nova': { x: x + w * 0.73, y: y + h * 0.17 },
    'zero1': { x: x + w * 0.74, y: y + h * 0.38 },
    'zero2': { x: x + w * 0.82, y: y + h * 0.38 },
    'zero3': { x: x + w * 0.90, y: y + h * 0.38 },
    'delta': { x: x + w * 0.88, y: y + h * 0.10 },
    'bestie': { x: x + w * 0.74, y: y + h * 0.60 },
    'dexter': { x: x + w * 0.88, y: y + h * 0.60 }
  };
  
  // Get current glow intensity based on recent earnings
  const now = Date.now();
  const glowDuration = 3000; // 3 seconds of glow
  
  achievementState.recentEarnings.forEach(earned => {
    const age = now - earned.timestamp;
    if (age < glowDuration) {
      const intensity = 1 - (age / glowDuration);
      
      // Draw trophy above the character's desk
      const charId = earned.characterId || 'nova';
      const pos = deskPositions[charId];
      if (pos) {
        drawTrophy(pos.x, pos.y - 50 * scale, 12 * scale, earned.tier, intensity);
      }
    }
  });
}

function spawnCelebration(x, y) {
  const colors = ['#FFD700', '#FF6B6B', '#4CAF50', '#2196F3', '#9C27B0', '#FF9800'];
  
  for (let i = 0; i < 30; i++) {
    celebrationParticles.push({
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 10,
      vy: (Math.random() - 1) * 8,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 3 + Math.random() * 4,
      life: 1.0
    });
  }
}

function updateAndDrawCelebrations() {
  // Update particles
  celebrationParticles.forEach((p, i) => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.3; // gravity
    p.life -= 0.02;
    
    if (p.life <= 0) {
      celebrationParticles.splice(i, 1);
    }
  });
  
  // Draw particles
  celebrationParticles.forEach(p => {
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
  });
  ctx.globalAlpha = 1;
}

// Check and award achievements
function checkAchievements(characterId = 'nova') {
  const stats = achievementState.stats;
  const newEarnings = [];
  
  // First Task
  if (!achievementState.earned.includes('first_task') && stats.tasksCompleted >= 1) {
    newEarnings.push({ id: 'first_task', characterId });
  }
  
  // Streak Master (5 consecutive tasks)
  if (!achievementState.earned.includes('streak_master') && stats.consecutiveTasks >= 5) {
    newEarnings.push({ id: 'streak_master', characterId });
  }
  
  // Speed Demon (under 5 minutes = 300 seconds)
  if (!achievementState.earned.includes('speed_demon') && stats.fastestTaskTime < 300) {
    newEarnings.push({ id: 'speed_demon', characterId });
  }
  
  // Night Owl (after 10 PM = hour >= 22)
  const currentHour = getCurrentHour();
  if (!achievementState.earned.includes('night_owl') && currentHour >= 22) {
    newEarnings.push({ id: 'night_owl', characterId });
  }
  
  // Early Bird (before 7 AM = hour < 7)
  if (!achievementState.earned.includes('early_bird') && currentHour < 7) {
    newEarnings.push({ id: 'early_bird', characterId });
  }
  
  // Pizza Lover
  if (!achievementState.earned.includes('pizza_lover') && stats.pizzaParties >= 10) {
    newEarnings.push({ id: 'pizza_lover', characterId });
  }
  
  // Code Reviewer
  if (!achievementState.earned.includes('code_reviewer') && stats.prsReviewed >= 10) {
    newEarnings.push({ id: 'code_reviewer', characterId });
  }
  
  // Bug Hunter
  if (!achievementState.earned.includes('bug_hunter') && stats.bugsFixed >= 5) {
    newEarnings.push({ id: 'bug_hunter', characterId });
  }
  
  // Award new achievements
  newEarnings.forEach(earned => {
    achievementState.earned.push(earned.id);
    earned.timestamp = Date.now();
    earned.tier = ACHIEVEMENT_CONFIG[earned.id].tier;
    achievementState.recentEarnings.push(earned);
    
    // Console log sound effect placeholder
    console.log(`🔔 Achievement earned: ${ACHIEVEMENT_CONFIG[earned.id].label}`);
    
    // Trigger celebration
    const { x, y, w, h } = getOfficeBounds();
    spawnCelebration(x + w * 0.5, y + h * 0.5);
    
    // Show notification
    showAchievementNotification(earned.id);
  });
  
  // Clean up old recent earnings (keep last 10)
  if (achievementState.recentEarnings.length > 10) {
    achievementState.recentEarnings = achievementState.recentEarnings.slice(-10);
  }
}

// Achievement notification
function showAchievementNotification(achievementId) {
  const config = ACHIEVEMENT_CONFIG[achievementId];
  if (!config) return;
  
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) scale(0);
    background: linear-gradient(135deg, ${config.color}22, ${config.color}44);
    border: 2px solid ${config.color};
    border-radius: 16px;
    padding: 20px 40px;
    color: #fff;
    font-family: 'Segoe UI', Arial, sans-serif;
    text-align: center;
    z-index: 2000;
    box-shadow: 0 0 40px ${config.color}66;
    transition: transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  `;
  
  notification.innerHTML = `
    <div style="font-size: 48px; margin-bottom: 10px;">🏆</div>
    <div style="font-size: 14px; color: #aaa; text-transform: uppercase; letter-spacing: 2px;">Achievement Unlocked!</div>
    <div style="font-size: 24px; font-weight: bold; color: ${config.color}; margin: 10px 0;">${config.label}</div>
    <div style="font-size: 12px; color: #888;">${config.description}</div>
  `;
  
  document.body.appendChild(notification);
  
  // Animate in
  setTimeout(() => {
    notification.style.transform = 'translate(-50%, -50%) scale(1)';
  }, 10);
  
  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.transform = 'translate(-50%, -50%) scale(0)';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Create Trophy Case Panel
function createTrophyCasePanel() {
  const panel = document.createElement('div');
  panel.id = 'trophy-case-panel';
  panel.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 20px;
    background: rgba(30, 30, 50, 0.95);
    border: 2px solid #6a6a8a;
    border-radius: 12px;
    padding: 16px;
    color: #fff;
    font-family: 'Segoe UI', Arial, sans-serif;
    width: 280px;
    z-index: 900;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    display: none;
  `;
  
  panel.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
      <h3 style="margin: 0; color: #FFD700; font-size: 16px;">🏆 Trophy Case</h3>
      <button id="trophy-case-close" style="
        background: none;
        border: none;
        color: #888;
        font-size: 20px;
        cursor: pointer;
        padding: 0 4px;
      ">×</button>
    </div>
    <div id="trophy-case-content" style="display: flex; flex-wrap: wrap; gap: 8px; max-height: 200px; overflow-y: auto;">
      <span style="color: #666; font-size: 12px;">No achievements yet</span>
    </div>
  `;
  
  document.body.appendChild(panel);
  
  document.getElementById('trophy-case-close').addEventListener('click', () => {
    panel.style.display = 'none';
  });
  
  return panel;
}

function updateTrophyCase() {
  const content = document.getElementById('trophy-case-content');
  if (!content) return;
  
  if (achievementState.earned.length === 0) {
    content.innerHTML = '<span style="color: #666; font-size: 12px;">No achievements yet</span>';
    return;
  }
  
  content.innerHTML = achievementState.earned.map(achId => {
    const config = ACHIEVEMENT_CONFIG[achId];
    if (!config) return '';
    const tierColor = TIER_COLORS[config.tier];
    return `
      <div style="
        background: ${config.color}22;
        border: 1px solid ${config.color};
        border-radius: 8px;
        padding: 8px;
        text-align: center;
        min-width: 60px;
      ">
        <div style="font-size: 20px;">🏆</div>
        <div style="font-size: 10px; color: ${config.color}; font-weight: bold;">${config.label}</div>
        <div style="font-size: 9px; color: ${tierColor};">${config.tier.toUpperCase()}</div>
      </div>
    `;
  }).join('');
}

function showTrophyCase() {
  const panel = document.getElementById('trophy-case-panel');
  if (!panel) return;
  updateTrophyCase();
  panel.style.display = 'block';
}

// Helper functions for external code to update stats
window.awardTaskComplete = function(taskTimeSeconds) {
  achievementState.stats.tasksCompleted++;
  achievementState.stats.consecutiveTasks++;
  if (taskTimeSeconds !== undefined && taskTimeSeconds < achievementState.stats.fastestTaskTime) {
    achievementState.stats.fastestTaskTime = taskTimeSeconds;
  }
  checkAchievements();
  // Update productivity dashboard
  if (window.updateProductivityStats) {
    window.updateProductivityStats();
  }
};

window.awardError = function() {
  achievementState.stats.errors++;
  achievementState.stats.consecutiveTasks = 0;
};

window.awardBugFix = function() {
  achievementState.stats.bugsFixed++;
  checkAchievements();
};

window.awardPRReview = function() {
  achievementState.stats.prsReviewed++;
  checkAchievements();
};

window.awardPizzaParty = function() {
  achievementState.stats.pizzaParties++;
  checkAchievements();
};

window.getAchievementState = function() {
  return achievementState;
};

// Initialize achievement UI
let trophyCasePanel = null;

// Create stats panel overlay element
function createInfoOverlay() {
  const overlay = document.createElement('div');
  overlay.id = 'agent-info-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 50%;
    right: -400px;
    transform: translateY(-50%);
    background: rgba(30, 30, 50, 0.97);
    border: 2px solid #6a6a8a;
    border-radius: 12px;
    padding: 20px;
    color: #fff;
    font-family: 'Segoe UI', Arial, sans-serif;
    width: 360px;
    max-height: 80vh;
    overflow-y: auto;
    z-index: 1000;
    box-shadow: -4px 0 30px rgba(0, 0, 0, 0.6);
    transition: right 0.3s ease-out;
  `;
  
  overlay.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
      <h2 id="overlay-agent-name" style="margin: 0; color: #ff6b9d; font-size: 22px;">Agent</h2>
      <button id="overlay-close" style="
        background: rgba(255, 100, 100, 0.2);
        border: none;
        color: #ff6b6b;
        font-size: 24px;
        cursor: pointer;
        padding: 0 8px;
        border-radius: 4px;
        transition: background 0.2s;
      ">×</button>
    </div>
    
    <!-- Stats Grid -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
      <div style="background: rgba(80, 80, 120, 0.3); padding: 12px; border-radius: 8px; text-align: center;">
        <div style="font-size: 24px; font-weight: bold; color: #4fc3f7;" id="overlay-tasks-completed">0</div>
        <div style="font-size: 11px; color: #888; text-transform: uppercase;">Tasks Done</div>
      </div>
      <div style="background: rgba(80, 80, 120, 0.3); padding: 12px; border-radius: 8px; text-align: center;">
        <div style="font-size: 24px; font-weight: bold; color: #ffcc00;" id="overlay-current-streak">0</div>
        <div style="font-size: 11px; color: #888; text-transform: uppercase;">Streak</div>
      </div>
      <div style="background: rgba(80, 80, 120, 0.3); padding: 12px; border-radius: 8px; text-align: center;">
        <div style="font-size: 24px; font-weight: bold; color: #81c784;" id="overlay-time-worked">0m</div>
        <div style="font-size: 11px; color: #888; text-transform: uppercase;">Time Today</div>
      </div>
      <div style="background: rgba(80, 80, 120, 0.3); padding: 12px; border-radius: 8px; text-align: center;">
        <div style="font-size: 14px; font-weight: bold; color: #ce93d8;" id="overlay-favorite">-</div>
        <div style="font-size: 11px; color: #888; text-transform: uppercase;">Favorite</div>
      </div>
    </div>
    
    <!-- Current Status -->
    <div style="margin-bottom: 16px; padding: 12px; background: rgba(60, 60, 90, 0.4); border-radius: 8px;">
      <div style="display: flex; align-items: center; margin-bottom: 8px;">
        <span style="color: #888; margin-right: 8px;">Status:</span>
        <span id="overlay-agent-state" style="color: #88ff88; font-weight: bold;">idle</span>
      </div>
      <div id="overlay-task-container" style="display: none;">
        <div style="color: #888; margin-bottom: 4px; font-size: 12px;">Current Task:</div>
        <div id="overlay-agent-task" style="
          background: rgba(100, 100, 150, 0.3);
          padding: 8px;
          border-radius: 4px;
          font-size: 13px;
          word-wrap: break-word;
        "></div>
      </div>
    </div>
    
    <!-- Achievement Badges -->
    <div style="margin-bottom: 16px;">
      <div style="color: #888; font-size: 12px; margin-bottom: 8px; text-transform: uppercase;">Achievements</div>
      <div id="overlay-achievements" style="display: flex; flex-wrap: wrap; gap: 6px;">
        <span style="color: #666; font-size: 12px;">No achievements yet</span>
      </div>
    </div>
    
    <!-- Progress Bars -->
    <div style="margin-bottom: 16px;">
      <div style="color: #888; font-size: 12px; margin-bottom: 8px; text-transform: uppercase;">Daily Goals</div>
      <div style="margin-bottom: 10px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span style="font-size: 12px; color: #aaa;">Daily (5 tasks)</span>
          <span style="font-size: 12px; color: #4fc3f7;" id="overlay-daily-progress-text">0/5</span>
        </div>
        <div style="background: rgba(60, 60, 80, 0.5); height: 8px; border-radius: 4px; overflow: hidden;">
          <div id="overlay-daily-progress" style="background: linear-gradient(90deg, #4fc3f7, #29b6f6); height: 100%; width: 0%; transition: width 0.3s;"></div>
        </div>
      </div>
      <div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span style="font-size: 12px; color: #aaa;">Weekly (25 tasks)</span>
          <span style="font-size: 12px; color: #ffcc00;" id="overlay-weekly-progress-text">0/25</span>
        </div>
        <div style="background: rgba(60, 60, 80, 0.5); height: 8px; border-radius: 4px; overflow: hidden;">
          <div id="overlay-weekly-progress" style="background: linear-gradient(90deg, #ffcc00, #ffb300); height: 100%; width: 0%; transition: width 0.3s;"></div>
        </div>
      </div>
    </div>
    
    <!-- Last Active -->
    <div style="padding-top: 12px; border-top: 1px solid #444;">
      <span style="color: #666; font-size: 11px;">Last active: </span>
      <span id="overlay-last-active" style="color: #888; font-size: 11px;">-</span>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  // Close button handler
  document.getElementById('overlay-close').addEventListener('click', () => {
    closeStatsPanel();
  });
  
  return overlay;
}

// Close stats panel with animation
function closeStatsPanel() {
  const overlay = document.getElementById('agent-info-overlay');
  if (overlay) {
    overlay.style.right = '-400px';
    setTimeout(() => {
      overlay.style.display = 'none';
    }, 300);
  }
}

// Show stats panel with animation
function showStatsPanel() {
  const overlay = document.getElementById('agent-info-overlay');
  if (overlay) {
    overlay.style.display = 'block';
    // Small delay to allow display:block to apply before transition
    setTimeout(() => {
      overlay.style.right = '20px';
    }, 10);
  }
}

let infoOverlay = null;

// Map character names to API agent IDs
const CHARACTER_TO_API_ID = {
  'Nova': 'nova',
  'Zero-1': 'zero',
  'Zero-2': 'zero-2',
  'Zero-3': 'zero-3',
  'Delta': 'delta',
  'Bestie': 'bestie',
  'Dexter': 'dexter',
  'Flash': 'flash'
};

// Handle canvas clicks to show agent stats
async function handleCanvasClick(event) {
  const canvas = document.getElementById('office');
  const rect = canvas.getBoundingClientRect();
  const clickX = (event.clientX - rect.left) / rect.width;
  const clickY = (event.clientY - rect.top) / rect.height;
  
  if (!window.CHARACTERS) return;
  
  // Find clicked character (within 50px radius)
  const clickRadius = 0.04; // fraction of canvas
  
  let clickedCharacter = null;
  let minDist = clickRadius;
  
  window.CHARACTERS.forEach(character => {
    const dx = clickX - character.offsetX;
    const dy = clickY - character.offsetY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < minDist) {
      minDist = dist;
      clickedCharacter = character;
    }
  });
  
  if (!infoOverlay) {
    infoOverlay = createInfoOverlay();
  }
  
  if (clickedCharacter) {
    // Update basic info
    document.getElementById('overlay-agent-name').textContent = clickedCharacter.name;
    document.getElementById('overlay-agent-name').style.color = clickedCharacter.baseColor || '#ff6b9d';
    
    const stateText = clickedCharacter.state || 'idle';
    document.getElementById('overlay-agent-state').textContent = stateText;
    
    // Show task info if available
    const taskContainer = document.getElementById('overlay-task-container');
    const taskText = clickedCharacter.currentTask || 'No active task';
    
    if (stateText === 'working' || stateText === 'walking_to_desk') {
      taskContainer.style.display = 'block';
      document.getElementById('overlay-agent-task').textContent = taskText;
    } else {
      taskContainer.style.display = 'none';
    }
    
    // Show last active time if available
    const lastActiveEl = document.getElementById('overlay-last-active');
    if (clickedCharacter.lastActive) {
      const lastActiveDate = new Date(clickedCharacter.lastActive);
      lastActiveEl.textContent = lastActiveDate.toLocaleTimeString();
    } else {
      lastActiveEl.textContent = '-';
    }
    
    // Fetch and display stats from API
    const apiAgentId = CHARACTER_TO_API_ID[clickedCharacter.name];
    if (apiAgentId) {
      try {
        const response = await fetch(`/api/stats?agentId=${apiAgentId}`);
        const data = await response.json();
        
        if (data.stats) {
          const stats = data.stats;
          
          // Update stats grid
          document.getElementById('overlay-tasks-completed').textContent = stats.tasksCompleted || 0;
          document.getElementById('overlay-current-streak').textContent = stats.currentStreak || 0;
          
          // Format time worked
          const timeWorked = stats.timeWorkedToday || 0;
          const timeText = timeWorked >= 3600 
            ? `${Math.floor(timeWorked/3600)}h ${Math.floor((timeWorked%3600)/60)}m`
            : `${Math.floor(timeWorked/60)}m`;
          document.getElementById('overlay-time-worked').textContent = timeText;
          
          // Favorite activity
          document.getElementById('overlay-favorite').textContent = stats.favoriteActivity || '-';
          
          // Update achievements
          const achievementsEl = document.getElementById('overlay-achievements');
          if (stats.achievements && stats.achievements.length > 0) {
            achievementsEl.innerHTML = stats.achievements.map(ach => {
              const config = ACHIEVEMENT_CONFIG[ach] || { label: ach, color: '#888' };
              return `<span style="
                background: ${config.color}33;
                border: 1px solid ${config.color};
                color: ${config.color};
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 11px;
                font-weight: bold;
              ">${config.label}</span>`;
            }).join('');
          } else {
            achievementsEl.innerHTML = '<span style="color: #666; font-size: 12px;">No achievements yet</span>';
          }
          
          // Update progress bars
          const dailyGoal = 5;
          const weeklyGoal = 25;
          const dailyPercent = Math.min((stats.tasksCompleted / dailyGoal) * 100, 100);
          const weeklyPercent = Math.min((stats.tasksCompleted / weeklyGoal) * 100, 100);
          
          document.getElementById('overlay-daily-progress').style.width = dailyPercent + '%';
          document.getElementById('overlay-daily-progress-text').textContent = `${stats.tasksCompleted}/${dailyGoal}`;
          document.getElementById('overlay-weekly-progress').style.width = weeklyPercent + '%';
          document.getElementById('overlay-weekly-progress-text').textContent = `${stats.tasksCompleted}/${weeklyGoal}`;
        }
      } catch (err) {
        console.error('Failed to fetch agent stats:', err);
        // Use fallback values on error
        document.getElementById('overlay-tasks-completed').textContent = '0';
        document.getElementById('overlay-current-streak').textContent = '0';
        document.getElementById('overlay-time-worked').textContent = '0m';
        document.getElementById('overlay-favorite').textContent = '-';
        document.getElementById('overlay-achievements').innerHTML = '<span style="color: #666; font-size: 12px;">Stats unavailable</span>';
      }
    }
    
    // Show the panel with animation
    showStatsPanel();
  } else {
    closeStatsPanel();
  }
}

// Start live status polling (Phase 3)
startStatusPolling();

// Initialize agent moods (Phase 5)
if (window.initializeAgentMoods) {
  window.initializeAgentMoods();
}

// Initialize office events (Phase 6)
if (window.initializeOfficeEvents) {
  window.initializeOfficeEvents();
}

// Productivity state (declared early to avoid TDZ)
const productivityState = {
  dailyTasksCompleted: 0,
  weeklyLeaderboard: [],
  deskUsageHeatmap: Array(16).fill(0), // 4x4 grid for 16 desks
  totalAgents: 8
};

// Update productivity stats (declared early to avoid TDZ)
window.updateProductivityStats = function() {
  // Get task count from achievement state
  const tasksCompleted = achievementState?.stats?.tasksCompleted || 0;

  // Update tasks completed
  const tasksEl = document.getElementById('prod-tasks-completed');
  if (tasksEl) {
    tasksEl.textContent = tasksCompleted;
  }

  // Update tasks subtext with goal progress
  const tasksSubEl = document.getElementById('prod-tasks-subtext');
  if (tasksSubEl) {
    const dailyGoal = 5;
    const progress = Math.min((tasksCompleted / dailyGoal) * 100, 100);
    tasksSubEl.textContent = `Goal: ${dailyGoal} tasks (${Math.round(progress)}%)`;
  }

  // Count active agents (agents with currentTask from CHARACTERS)
  let activeAgents = 0;
  if (window.CHARACTERS) {
    activeAgents = window.CHARACTERS.filter(c => c.currentTask).length;
  }

  const activeEl = document.getElementById('prod-active-agents');
  if (activeEl) {
    activeEl.textContent = activeAgents;
  }

  // Calculate busyness percentage
  const totalAgents = window.CHARACTERS ? window.CHARACTERS.length : productivityState.totalAgents;
  const busynessPercent = totalAgents > 0 ? Math.round((activeAgents / totalAgents) * 100) : 0;

  const busynessEl = document.getElementById('prod-busyness');
  const busynessFill = document.getElementById('prod-busyness-fill');
  if (busynessEl) {
    busynessEl.textContent = busynessPercent + '%';
  }
  if (busynessFill) {
    busynessFill.style.width = busynessPercent + '%';
  }

  // Update heatmap based on actual agent positions
  updateHeatmapFromAgents();

  // Update leaderboard
  updateLeaderboard();
};

// Initialize timeline (Phase 6)
setupTimelineToggle();
renderTimeline();

// Initialize productivity dashboard (Phase 8)
setupProductivityDashboard();

// Initialize productivity dashboard
function setupProductivityDashboard() {
  const toggleBtn = document.getElementById('productivity-toggle');
  const panel = document.getElementById('productivity-panel');
  
  if (toggleBtn && panel) {
    toggleBtn.addEventListener('click', () => {
      panel.classList.toggle('collapsed');
      toggleBtn.textContent = panel.classList.contains('collapsed') ? '▶' : '◀';
    });
  }
  
  // Initialize heatmap grid
  initHeatmapGrid();

  // Update stats every 5 seconds
  setInterval(window.updateProductivityStats, 5000);

  // Initial render
  window.updateProductivityStats();
}

// Initialize heatmap grid cells
function initHeatmapGrid() {
  const grid = document.getElementById('heatmap-grid');
  if (!grid) return;
  
  grid.innerHTML = '';
  for (let i = 0; i < 7; i++) {
    const cell = document.createElement('div');
    cell.className = 'heatmap-cell';
    cell.id = 'heatmap-cell-' + i;
    const deskNames = ['Nova', 'Zero-1', 'Zero-2', 'Zero-3', 'Zero-4', 'Delta', 'Echo'];
    cell.title = deskNames[i] || 'Desk ' + (i + 1);
    grid.appendChild(cell);
  }
}

// Update productivity stats display
// Update heatmap based on current agent positions
function updateHeatmapFromAgents() {
  if (!window.CHARACTERS || !window.CharacterStates) return;
  
  // Map characters to their desk indices based on their position
  const deskMap = {
    'nova': 0,
    'zero1': 1,
    'zero2': 2,
    'zero3': 3,
    'zero4': 4,
    'delta': 5,
    'echo': 6
  };
  
  // Count agent desk usage from CHARACTERS - who's at their desk (WORKING state)
  const heatmap = Array(7).fill(0);
  
  window.CHARACTERS.forEach(character => {
    if (character.state === CharacterStates.WORKING) {
      const deskIndex = deskMap[character.id];
      if (deskIndex !== undefined) {
        heatmap[deskIndex] = 1; // Agent is at this desk working
      }
    }
  });
  
  // Update heatmap cells (only show first 7 for actual desks)
  const maxUsage = 1;
  for (let i = 0; i < 7; i++) {
    const cell = document.getElementById('heatmap-cell-' + i);
    if (cell) {
      if (heatmap[i] === 0) {
        cell.style.background = 'rgba(40, 40, 60, 0.6)';
      } else {
        // Green for active
        cell.style.background = 'rgba(64, 192, 112, 0.8)';
      }
    }
  }
}

// Update leaderboard display
function updateLeaderboard() {
  const leaderboardEl = document.getElementById('leaderboard-list');
  if (!leaderboardEl) return;
  
  // Build leaderboard from CHARACTERS - use mood.tasksCompleted
  let agents = [];
  if (window.CHARACTERS) {
    agents = window.CHARACTERS.map(character => ({
      name: character.name,
      tasksCompleted: character.mood?.tasksCompleted || 0
    }));
  }
  
  // Sort by tasks completed (descending)
  agents.sort((a, b) => b.tasksCompleted - a.tasksCompleted);
  
  // Take top 5
  const top5 = agents.slice(0, 5);
  
  if (top5.length === 0) {
    leaderboardEl.innerHTML = '<div style="color: #606080; text-align: center; padding: 10px;">No data yet</div>';
    return;
  }
  
  const rankClasses = ['gold', 'silver', 'bronze'];
  leaderboardEl.innerHTML = top5.map((agent, index) => `
    <div class="leaderboard-item">
      <div class="leaderboard-rank ${index < 3 ? rankClasses[index] : ''}">${index + 1}</div>
      <div class="leaderboard-name">${agent.name}</div>
      <div class="leaderboard-score">${agent.tasksCompleted} tasks</div>
    </div>
  `).join('');
}

// Add desk usage when agent sits
function recordDeskUsage(agentName, deskIndex) {
  if (deskIndex >= 0 && deskIndex < 16) {
    productivityState.deskUsageHeatmap[deskIndex]++;
  }
}

// Initialize productivity dashboard on load
if (typeof window !== 'undefined') {
  window.setupProductivityDashboard = setupProductivityDashboard;
  window.updateProductivityStats = window.updateProductivityStats;
  window.recordDeskUsage = recordDeskUsage;
}

// Add click handler for agent info
// Add click handler for agent info (desktop)
document.getElementById('office').addEventListener('click', handleCanvasClick);

// Handle mini-game clicks (Phase 7)
document.getElementById('office').addEventListener('click', (event) => {
  const canvas = document.getElementById('office');
  if (window.handleMiniGameClick) {
    const handled = window.handleMiniGameClick(event.clientX, event.clientY, canvas);
    if (handled) {
      event.stopPropagation(); // Don't show agent stats if mini-game clicked
    }
  }
});

// Start mini-game random events (Phase 7)
if (window.startMiniGameEvents) {
  window.startMiniGameEvents();
}

// Start visitor events (Phase 7)
if (window.startVisitorEvents) {
  window.startVisitorEvents();
}

// Add touch handler for mobile
document.getElementById('office').addEventListener('touchstart', function(event) {
  event.preventDefault();
  const touch = event.touches[0];
  handleCanvasClick({
    clientX: touch.clientX,
    clientY: touch.clientY
  });
}, { passive: false });
