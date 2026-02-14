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

// Color palette - cozy office colors
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

// Set canvas size to full window
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  // Calculate scale based on window size
  scale = Math.min(canvas.width / MIN_WIDTH, canvas.height / MIN_HEIGHT);
  scale = Math.max(scale, 0.5);
  window.scale = scale;
  
  draw();
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Draw the office layout
function draw() {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const w = MIN_WIDTH * scale;
  const h = MIN_HEIGHT * scale;
  const x = cx - w / 2;
  const y = cy - h / 2;
  
  // Clear canvas
  ctx.fillStyle = COLORS.floor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
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
  
  // Redraw the office
  draw();
  
  // Update character animations with deltaTime
  if (window.drawCharacters) {
    window.drawCharacters(deltaTime);
  }
  
  // Cycle character states every 5 seconds (demo mode)
  stateCycleTimer += deltaTime;
  if (stateCycleTimer >= STATE_CYCLE_INTERVAL) {
    stateCycleTimer = 0;
    cycleCharacterStates();
  }
  
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
