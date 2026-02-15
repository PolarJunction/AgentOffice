// AgentOffice - Office Floor Plan Canvas Rendering
const canvas = document.getElementById('office');
const ctx = canvas.getContext('2d');

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

// Speech bubble data structure
const speechBubbles = [];

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
let animationTimestamp = 0;
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
  
  // Update and draw mood indicators (Phase 5)
  if (window.updateMoods) {
    window.updateMoods(deltaTime);
  }
  if (window.drawMoodIndicators) {
    window.drawMoodIndicators();
  }
  
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
      } else if (agent.state === 'idle' && currentState === states.WORKING) {
        // Agent stopped working - walk back to lounge
        window.setCharacterState(characterId, states.WALKING_TO_LOUNGE);
        // Show speech bubble for completing task
        showSpeechBubble(characterId, character.name, 'complete');
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
// Ambient Animations - Phase 4
// ============================================================================

// Clock variables
let clockAngle = 0;

// Draw ambient animations (clock, plants swaying, light flicker)
function drawAmbientAnimations(timestamp) {
  // Clock second hand animation
  clockAngle = (timestamp / 1000) * (Math.PI / 30); // Full rotation every 60 seconds
  
  const { x, y, w, h } = getOfficeBounds();
  
  // Draw clock in hallway
  const clockX = x + w * 0.5;
  const clockY = y + h * 0.22;
  const clockRadius = 15 * scale;
  
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
  
  // Second hand
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
  
  // Plant swaying (in kitchen area)
  drawSwayingPlants(timestamp);
  
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

// Create info overlay element
function createInfoOverlay() {
  const overlay = document.createElement('div');
  overlay.id = 'agent-info-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(30, 30, 50, 0.95);
    border: 2px solid #6a6a8a;
    border-radius: 8px;
    padding: 16px;
    color: #fff;
    font-family: Arial, sans-serif;
    min-width: 250px;
    max-width: 350px;
    display: none;
    z-index: 1000;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  `;
  
  overlay.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
      <h3 id="overlay-agent-name" style="margin: 0; color: #ff6b9d;">Agent</h3>
      <button id="overlay-close" style="
        background: transparent;
        border: none;
        color: #aaa;
        font-size: 20px;
        cursor: pointer;
        padding: 0 4px;
      ">×</button>
    </div>
    <div style="margin-bottom: 8px;">
      <span style="color: #888;">Status:</span>
      <span id="overlay-agent-state" style="color: #88ff88; margin-left: 8px;">idle</span>
    </div>
    <div style="margin-bottom: 8px;">
      <span style="color: #888;">Mood:</span>
      <span id="overlay-agent-mood" style="margin-left: 8px;">Neutral</span>
    </div>
    <div style="margin-bottom: 8px;">
      <span style="color: #888;">Streak:</span>
      <span id="overlay-agent-streak" style="color: #ffcc00; margin-left: 8px;">0</span>
    </div>
    <div id="overlay-task-container" style="display: none;">
      <div style="color: #888; margin-bottom: 4px;">Current Task:</div>
      <div id="overlay-agent-task" style="
        background: rgba(100, 100, 150, 0.3);
        padding: 8px;
        border-radius: 4px;
        font-size: 13px;
        word-wrap: break-word;
      "></div>
    </div>
    <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #444;">
      <span style="color: #666; font-size: 11px;">Last active: </span>
      <span id="overlay-last-active" style="color: #888; font-size: 11px;">-</span>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  // Close button handler
  document.getElementById('overlay-close').addEventListener('click', () => {
    overlay.style.display = 'none';
  });
  
  return overlay;
}

let infoOverlay = null;

// Handle canvas clicks to show agent info
function handleCanvasClick(event) {
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
  
  const overlay = infoOverlay;
  
  if (clickedCharacter) {
    // Update overlay content
    document.getElementById('overlay-agent-name').textContent = clickedCharacter.name;
    document.getElementById('overlay-agent-name').style.color = clickedCharacter.baseColor || '#ff6b9d';
    
    const stateText = clickedCharacter.state || 'idle';
    document.getElementById('overlay-agent-state').textContent = stateText;
    
    // Show mood info (Phase 5)
    const moodEl = document.getElementById('overlay-agent-mood');
    const streakEl = document.getElementById('overlay-agent-streak');
    if (clickedCharacter.mood) {
      const moodConfig = window.MOOD_CONFIG?.[clickedCharacter.mood.state] || { label: 'Neutral' };
      moodEl.textContent = moodConfig.label;
      // Color mood text
      if (clickedCharacter.mood.state === 'happy') moodEl.style.color = '#ffcc00';
      else if (clickedCharacter.mood.state === 'frustrated') moodEl.style.color = '#ff4444';
      else moodEl.style.color = '#888888';
      
      streakEl.textContent = clickedCharacter.mood.streak || 0;
    } else {
      moodEl.textContent = 'Neutral';
      moodEl.style.color = '#888888';
      streakEl.textContent = '0';
    }
    
    // Show task info if available
    const taskContainer = document.getElementById('overlay-task-container');
    const taskText = clickedCharacter.currentTask || 'No active task';
    
    if (stateText === 'working' || stateText === 'walking_to_desk') {
      taskContainer.style.display = 'block';
      document.getElementById('overlay-agent-task').textContent = taskText;
    } else {
      taskContainer.style.display = 'none';
    }
    
    // Position overlay near the clicked character
    const canvas = document.getElementById('office');
    const rect = canvas.getBoundingClientRect();
    const charScreenX = clickedCharacter.offsetX * rect.width + rect.left;
    const charScreenY = clickedCharacter.offsetY * rect.height + rect.top;
    
    // Position to the right of character, but keep within viewport
    let posX = charScreenX + 30;
    let posY = charScreenY - 20;
    
    // Adjust if too close to right edge
    if (posX + 300 > window.innerWidth) {
      posX = charScreenX - 320;
    }
    // Adjust if too close to bottom
    if (posY + 200 > window.innerHeight) {
      posY = window.innerHeight - 220;
    }
    
    overlay.style.left = posX + 'px';
    overlay.style.top = posY + 'px';
    overlay.style.right = 'auto';
    
    // Show last active time if available
    const lastActiveEl = document.getElementById('overlay-last-active');
    if (clickedCharacter.lastActive) {
      const lastActiveDate = new Date(clickedCharacter.lastActive);
      lastActiveEl.textContent = lastActiveDate.toLocaleTimeString();
    } else {
      lastActiveEl.textContent = '-';
    }
    
    overlay.style.display = 'block';
  } else {
    overlay.style.display = 'none';
  }
}

// Start live status polling (Phase 3)
startStatusPolling();

// Initialize agent moods (Phase 5)
if (window.initializeAgentMoods) {
  window.initializeAgentMoods();
}

// Add click handler for agent info
// Add click handler for agent info (desktop)
document.getElementById('office').addEventListener('click', handleCanvasClick);

// Add touch handler for mobile
document.getElementById('office').addEventListener('touchstart', function(event) {
  event.preventDefault();
  const touch = event.touches[0];
  handleCanvasClick({
    clientX: touch.clientX,
    clientY: touch.clientY
  });
}, { passive: false });
