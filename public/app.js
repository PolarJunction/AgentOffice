// AgentOffice - Canvas rendering will be added in Phase 2
const canvas = document.getElementById('office');
const ctx = canvas.getContext('2d');

// Set canvas size to full window
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);
