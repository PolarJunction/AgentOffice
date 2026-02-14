// AgentOffice - Office Floor Plan Canvas Rendering
const canvas = document.getElementById('office');
const ctx = canvas.getContext('2d');

// Office dimensions and layout
let scale = 1;
const MIN_WIDTH = 1200;
const MIN_HEIGHT = 800;

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
  ctx.fillStyle = '#fff';
  ctx.fillText('DELTA', deltaX + deltaW / 2, deltaY + deltaH / 2);
  ctx.fillText('STATION', deltaX + deltaW / 2, deltaY + deltaH / 2 + 14 * scale);
  
  // RIGHT MIDDLE - 3 Zero Pods (Row of 3)
  const podY = rightY + rightH * 0.32;
  const podH = rightH * 0.18;
  const podW = rightW * 0.28;
  
  for (let i = 0; i < 3; i++) {
    const podX = rightX + rightW * (0.05 + i * 0.32);
    ctx.fillStyle = COLORS.zeroPod;
    ctx.fillRect(podX, podY, podW, podH);
    ctx.fillStyle = '#fff';
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
  ctx.fillStyle = '#fff';
  ctx.fillText('BESTIE', bestieX + bestieW / 2, bestieY + bestieH / 2);
  ctx.fillText('RECEPTION', bestieX + bestieW / 2, bestieY + bestieH / 2 + 12 * scale);
  
  // RIGHT BOTTOM RIGHT - Dexter Flex Desk
  const dexterX = rightX + rightW * 0.55;
  const dexterY = rightY + rightH * 0.55;
  const dexterW = rightW * 0.4;
  const dexterH = rightH * 0.2;
  ctx.fillStyle = COLORS.dexterDesk;
  ctx.fillRect(dexterX, dexterY, dexterW, dexterH);
  ctx.fillStyle = '#fff';
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
}

// Initial draw
draw();
