// ============================================================================
// Mini-Games System - Phase 7
// ============================================================================

// Mini-game types
const MiniGameTypes = {
  PING_PONG: 'ping_pong',
  ARCADE: 'arcade'
};

// ============================================================================
// Ping Pong Table
// ============================================================================

// Ping pong table position (in the lounge area)
const PingPongTable = {
  x: 0.13,  // Left side of lounge
  y: 0.78,  // Bottom of lounge
  width: 0.12,
  height: 0.08
};

// Ping pong game state
let pingPongGame = null;

// Ping pong ball state
class PingPongBall {
  constructor() {
    this.reset();
  }
  
  reset() {
    this.x = 0.5;  // Center of table (relative)
    this.y = 0.5;
    this.vx = (Math.random() - 0.5) * 0.02;
    this.vy = (Math.random() > 0.5 ? 1 : -1) * 0.015;
    this.speed = 0.012;
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    
    // Bounce off side walls
    if (this.x <= 0.05 || this.x >= 0.95) {
      this.vx *= -1;
      this.x = Math.max(0.05, Math.min(0.95, this.x));
    }
    
    // Bounce off paddles
    if (this.y <= 0.15) {
      // Top paddle (player 1)
      if (this.x >= pingPongGame.p1X - 0.08 && this.x <= pingPongGame.p1X + 0.08) {
        this.vy = Math.abs(this.vy) * 1.1;
        this.vx += (this.x - pingPongGame.p1X) * 0.3;
        this.speed *= 1.05;
      } else if (this.y <= 0) {
        // Player 2 scores
        pingPongGame.score2++;
        this.reset();
      }
    }
    
    if (this.y >= 0.85) {
      // Bottom paddle (player 2)
      if (this.x >= pingPongGame.p2X - 0.08 && this.x <= pingPongGame.p2X + 0.08) {
        this.vy = -Math.abs(this.vy) * 1.1;
        this.vx += (this.x - pingPongGame.p2X) * 0.3;
        this.speed *= 1.05;
      } else if (this.y >= 1) {
        // Player 1 scores
        pingPongGame.score1++;
        this.reset();
      }
    }
    
    // Clamp speed
    const maxSpeed = 0.03;
    this.vx = Math.max(-maxSpeed, Math.min(maxSpeed, this.vx));
    this.vy = Math.max(-maxSpeed, Math.min(maxSpeed, this.vy));
  }
}

// Start a ping pong game between two agents
function startPingPongGame(agent1, agent2) {
  pingPongGame = {
    active: true,
    agent1: agent1,
    agent2: agent2,
    score1: 0,
    score2: 0,
    p1X: 0.5,
    p2X: 0.5,
    startTime: Date.now(),
    ball: new PingPongBall()
  };
  
  console.log(`🏓 Ping Pong: ${agent1.name} vs ${agent2.name}`);
}

// Update ping pong game
function updatePingPongGame() {
  if (!pingPongGame || !pingPongGame.active) return;
  
  pingPongGame.ball.update();
  
  // AI paddle movement
  const ballX = pingPongGame.ball.x;
  
  // Player 1 (top) AI - follow ball
  const targetX1 = ballX;
  pingPongGame.p1X += (targetX1 - pingPongGame.p1X) * 0.08;
  pingPongGame.p1X = Math.max(0.15, Math.min(0.85, pingPongGame.p1X));
  
  // Player 2 (bottom) AI - follow ball with delay
  const targetX2 = ballX;
  pingPongGame.p2X += (targetX2 - pingPongGame.p2X) * 0.06;
  pingPongGame.p2X = Math.max(0.15, Math.min(0.85, pingPongGame.p2X));
  
  // End game after 60 seconds or first to 5 points
  const elapsed = Date.now() - pingPongGame.startTime;
  if (elapsed > 60000 || pingPongGame.score1 >= 5 || pingPongGame.score2 >= 5) {
    endPingPongGame();
  }
}

// End ping pong game and award mood boost
function endPingPongGame() {
  if (!pingPongGame) return;
  
  const winner = pingPongGame.score1 > pingPongGame.score2 ? pingPongGame.agent1 : pingPongGame.agent2;
  const loser = pingPongGame.score1 > pingPongGame.score2 ? pingPongGame.agent2 : pingPongGame.agent1;
  
  console.log(`🏓 Ping Pong winner: ${winner.name} (${pingPongGame.score1}-${pingPongGame.score2})`);
  
  // Award mood boost to winner
  if (window.triggerHappyMood) {
    triggerHappyMood(winner);
  }
  
  pingPongGame = null;
}

// Draw ping pong table in the lounge
function drawPingPongTable(ctx, x, y, w, h, scale) {
  // Table surface
  ctx.fillStyle = '#2d5a3d';  // Green felt
  ctx.fillRect(x, y, w, h);
  
  // Table border
  ctx.strokeStyle = '#8B4513';  // Wood
  ctx.lineWidth = 4 * scale;
  ctx.strokeRect(x, y, w, h);
  
  // Center line
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2 * scale;
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y);
  ctx.lineTo(x + w / 2, y + h);
  ctx.stroke();
  
  // Net
  ctx.strokeStyle = '#cccccc';
  ctx.lineWidth = 3 * scale;
  ctx.setLineDash([5 * scale, 5 * scale]);
  ctx.beginPath();
  ctx.moveTo(x, y + h / 2);
  ctx.lineTo(x + w, y + h / 2);
  ctx.stroke();
  ctx.setLineDash([]);
  
  // Table legs
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(x + w * 0.1, y + h, w * 0.08, h * 0.3);
  ctx.fillRect(x + w * 0.82, y + h, w * 0.08, h * 0.3);
}

// Draw active ping pong game
function drawPingPongGame(ctx, tableX, tableY, tableW, tableH, scale) {
  if (!pingPongGame || !pingPongGame.active) return;
  
  const ball = pingPongGame.ball;
  
  // Draw paddles
  ctx.fillStyle = '#ff6b35';
  // Player 1 paddle (top)
  const p1W = tableW * 0.15;
  const p1H = tableH * 0.12;
  ctx.fillRect(
    tableX + pingPongGame.p1X * tableW - p1W / 2,
    tableY + tableH * 0.05,
    p1W,
    p1H
  );
  
  // Player 2 paddle (bottom)
  ctx.fillStyle = '#35a7ff';
  ctx.fillRect(
    tableX + pingPongGame.p2X * tableW - p1W / 2,
    tableY + tableH * 0.88 - p1H,
    p1W,
    p1H
  );
  
  // Draw ball
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(
    tableX + ball.x * tableW,
    tableY + ball.y * tableH,
    tableW * 0.03,
    0,
    Math.PI * 2
  );
  ctx.fill();
  
  // Draw score
  ctx.fillStyle = '#ffffff';
  ctx.font = `${16 * scale}px Arial`;
  ctx.textAlign = 'center';
  ctx.fillText(
    `${pingPongGame.score1} - ${pingPongGame.score2}`,
    tableX + tableW / 2,
    tableY + tableH / 2 + 6 * scale
  );
}

// ============================================================================
// Arcade Machine - Phase 7
// ============================================================================

// Arcade machine position
const ArcadeMachine = {
  x: 0.25,
  y: 0.72,
  width: 0.06,
  height: 0.10
};

// Arcade game state
let arcadeGame = null;
let arcadeHighScore = 0;

// Simple space invader game
class ArcadeGame {
  constructor() {
    this.reset();
  }
  
  reset() {
    this.playerX = 0.5;
    this.playerY = 0.85;
    this.bullets = [];
    this.enemies = [];
    this.score = 0;
    this.gameOver = false;
    this.won = false;
    
    // Create enemies grid
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 6; col++) {
        this.enemies.push({
          x: 0.15 + col * 0.12,
          y: 0.15 + row * 0.1,
          alive: true
        });
      }
    }
    
    this.enemyDirection = 1;
    this.enemyMoveTimer = 0;
  }
  
  update() {
    if (this.gameOver || this.won) return;
    
    // Update bullets
    this.bullets = this.bullets.filter(b => {
      b.y -= 0.02;
      return b.y > 0;
    });
    
    // Check bullet-enemy collisions
    this.bullets.forEach(bullet => {
      this.enemies.forEach(enemy => {
        if (enemy.alive &&
            Math.abs(bullet.x - enemy.x) < 0.06 &&
            Math.abs(bullet.y - enemy.y) < 0.06) {
          enemy.alive = false;
          bullet.hit = true;
          this.score += 100;
        }
      });
    });
    this.bullets = this.bullets.filter(b => !b.hit);
    
    // Move enemies
    this.enemyMoveTimer++;
    if (this.enemyMoveTimer > 30) {
      this.enemyMoveTimer = 0;
      
      let hitEdge = false;
      this.enemies.forEach(enemy => {
        if (enemy.alive) {
          enemy.x += 0.03 * this.enemyDirection;
          if (enemy.x > 0.9 || enemy.x < 0.1) {
            hitEdge = true;
          }
        }
      });
      
      if (hitEdge) {
        this.enemyDirection *= -1;
        this.enemies.forEach(enemy => {
          if (enemy.alive) enemy.y += 0.1;
        });
      }
      
      // Check if enemies reached player level
      this.enemies.forEach(enemy => {
        if (enemy.alive && enemy.y > 0.85) {
          this.gameOver = true;
        }
      });
    }
    
    // Check win
    const aliveEnemies = this.enemies.filter(e => e.alive).length;
    if (aliveEnemies === 0) {
      this.won = true;
    }
  }
  
  shoot() {
    if (this.gameOver || this.won) return;
    this.bullets.push({
      x: this.playerX,
      y: 0.75
    });
  }
  
  movePlayer(direction) {
    if (this.gameOver || this.won) return;
    this.playerX += direction * 0.08;
    this.playerX = Math.max(0.1, Math.min(0.9, this.playerX));
  }
}

// Start arcade game
function startArcadeGame(agent) {
  arcadeGame = {
    active: true,
    agent: agent,
    game: new ArcadeGame(),
    startTime: Date.now()
  };
  
  console.log(`🎮 Arcade: ${agent.name} started playing`);
}

// Update arcade game
function updateArcadeGame() {
  if (!arcadeGame || !arcadeGame.active) return;
  
  arcadeGame.game.update();
  
  // End game after 45 seconds
  const elapsed = Date.now() - arcadeGame.startTime;
  if (arcadeGame.game.gameOver || arcadeGame.game.won || elapsed > 45000) {
    endArcadeGame();
  }
}

// End arcade game
function endArcadeGame() {
  if (!arcadeGame) return;
  
  const score = arcadeGame.game.score;
  const won = arcadeGame.game.won;
  
  console.log(`🎮 Arcade: ${arcadeGame.agent.name} scored ${score}`);
  
  if (score > arcadeHighScore) {
    arcadeHighScore = score;
    console.log(`🎮 New high score: ${arcadeHighScore}!`);
  }
  
  // Award mood boost for playing well or winning
  if (window.triggerHappyMood) {
    if (won || score > 300) {
      triggerHappyMood(arcadeGame.agent);
    }
  }
  
  arcadeGame = null;
}

// Draw arcade machine
function drawArcadeMachine(ctx, x, y, w, h, scale) {
  // Cabinet body
  ctx.fillStyle = '#2a2a4a';
  ctx.fillRect(x, y, w, h);
  
  // Screen bezel
  ctx.fillStyle = '#1a1a2a';
  ctx.fillRect(x + w * 0.1, y + h * 0.15, w * 0.8, h * 0.35);
  
  // Screen (lit if game active)
  if (arcadeGame && arcadeGame.active) {
    ctx.fillStyle = '#00ff88';
  } else {
    ctx.fillStyle = '#004422';
  }
  ctx.fillRect(x + w * 0.15, y + h * 0.2, w * 0.7, h * 0.25);
  
  // Control panel
  ctx.fillStyle = '#3a3a5a';
  ctx.fillRect(x + w * 0.1, y + h * 0.55, w * 0.8, h * 0.2);
  
  // Joystick
  ctx.fillStyle = '#ff4444';
  ctx.beginPath();
  ctx.arc(x + w * 0.35, y + h * 0.65, w * 0.05, 0, Math.PI * 2);
  ctx.fill();
  
  // Buttons
  ctx.fillStyle = '#ffff00';
  ctx.beginPath();
  ctx.arc(x + w * 0.6, y + h * 0.62, w * 0.04, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ff00ff';
  ctx.beginPath();
  ctx.arc(x + w * 0.75, y + h * 0.62, w * 0.04, 0, Math.PI * 2);
  ctx.fill();
  
  // Coin slot
  ctx.fillStyle = '#ffd700';
  ctx.fillRect(x + w * 0.4, y + h * 0.82, w * 0.2, h * 0.08);
  
  // Marquee (top)
  ctx.fillStyle = '#ff6b35';
  ctx.fillRect(x + w * 0.05, y + h * 0.02, w * 0.9, h * 0.1);
  ctx.fillStyle = '#ffffff';
  ctx.font = `${8 * scale}px Arial`;
  ctx.textAlign = 'center';
  ctx.fillText('ARCADE', x + w / 2, y + h * 0.09);
  
  // High score display
  if (arcadeHighScore > 0) {
    ctx.fillStyle = '#ffd700';
    ctx.font = `${6 * scale}px Arial`;
    ctx.fillText(`HI: ${arcadeHighScore}`, x + w / 2, y + h * 0.13);
  }
}

// Draw active arcade game on screen
function drawArcadeScreen(ctx, machineX, machineY, machineW, machineH) {
  if (!arcadeGame || !arcadeGame.active) return;
  
  const game = arcadeGame.game;
  
  // Clear screen area
  const screenX = machineX + machineW * 0.15;
  const screenY = machineY + machineH * 0.2;
  const screenW = machineW * 0.7;
  const screenH = machineH * 0.25;
  
  ctx.fillStyle = '#000000';
  ctx.fillRect(screenX, screenY, screenW, screenH);
  
  // Draw player
  ctx.fillStyle = '#00ff00';
  ctx.fillRect(screenX + game.playerX * screenW - 4, screenY + game.playerY * screenH, 8, 8);
  
  // Draw enemies
  ctx.fillStyle = '#ff0000';
  game.enemies.forEach(enemy => {
    if (enemy.alive) {
      ctx.fillRect(
        screenX + enemy.x * screenW - 5,
        screenY + enemy.y * screenH - 5,
        10,
        10
      );
    }
  });
  
  // Draw bullets
  ctx.fillStyle = '#ffff00';
  game.bullets.forEach(bullet => {
    ctx.fillRect(
      screenX + bullet.x * screenW - 2,
      screenY + bullet.y * screenH,
      4,
      6
    );
  });
  
  // Draw score
  ctx.fillStyle = '#ffffff';
  ctx.font = '10px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(`Score: ${game.score}`, screenX + 2, screenY + 12);
  
  // Draw game over / won
  if (game.gameOver) {
    ctx.fillStyle = '#ff0000';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', screenX + screenW / 2, screenY + screenH / 2);
  } else if (game.won) {
    ctx.fillStyle = '#00ff00';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('YOU WIN!', screenX + screenW / 2, screenY + screenH / 2);
  }
}

// ============================================================================
// Random Game Events
// ============================================================================

let miniGameEventTimer = null;

// Start random mini-game events
function startMiniGameEvents() {
  // Random event every 15-30 minutes
  scheduleNextMiniGame();
}

function scheduleNextMiniGame() {
  const delay = 15 * 60 * 1000 + Math.random() * 15 * 60 * 1000;
  miniGameEventTimer = setTimeout(triggerRandomMiniGame, delay);
}

function triggerRandomMiniGame() {
  if (!window.CHARACTERS || window.CHARACTERS.length < 2) {
    scheduleNextMiniGame();
    return;
  }
  
  // Find agents that are idle
  const idleAgents = window.CHARACTERS.filter(c => c.state === CharacterStates.IDLE);
  
  if (idleAgents.length >= 2) {
    // Randomly pick two agents
    const shuffled = idleAgents.sort(() => Math.random() - 0.5);
    const agent1 = shuffled[0];
    const agent2 = shuffled[1];
    
    // 70% chance of ping pong, 30% arcade
    if (Math.random() < 0.7) {
      startPingPongGame(agent1, agent2);
    } else {
      startArcadeGame(agent1);
    }
  }
  
  scheduleNextMiniGame();
}

// Stop mini-game events
function stopMiniGameEvents() {
  if (miniGameEventTimer) {
    clearTimeout(miniGameEventTimer);
    miniGameEventTimer = null;
  }
}

// ============================================================================
// Click Interaction
// ============================================================================

function handleMiniGameClick(mouseX, mouseY, canvas) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  
  const x = (mouseX - rect.left) * scaleX / canvas.width;
  const y = (mouseY - rect.top) * scaleY / canvas.height;
  
  // Check arcade machine click
  if (x >= ArcadeMachine.x && x <= ArcadeMachine.x + ArcadeMachine.width &&
      y >= ArcadeMachine.y && y <= ArcadeMachine.y + ArcadeMachine.height) {
    
    if (arcadeGame && arcadeGame.active) {
      // Shoot in game
      arcadeGame.game.shoot();
    } else if (window.CHARACTERS) {
      // Find closest idle agent
      const idleAgents = window.CHARACTERS.filter(c => c.state === CharacterStates.IDLE);
      if (idleAgents.length > 0) {
        const closest = idleAgents.reduce((prev, curr) => {
          const prevDist = Math.abs(prev.x - x) + Math.abs(prev.y - y);
          const currDist = Math.abs(curr.x - x) + Math.abs(curr.y - y);
          return currDist < prevDist ? curr : prev;
        });
        startArcadeGame(closest);
      }
    }
    return true;
  }
  
  return false;
}

// ============================================================================
// Export
// ============================================================================

window.MiniGameTypes = MiniGameTypes;
window.PingPongTable = PingPongTable;
window.ArcadeMachine = ArcadeMachine;
window.startPingPongGame = startPingPongGame;
window.updatePingPongGame = updatePingPongGame;
window.drawPingPongTable = drawPingPongTable;
window.drawPingPongGame = drawPingPongGame;
window.startArcadeGame = startArcadeGame;
window.updateArcadeGame = updateArcadeGame;
window.drawArcadeMachine = drawArcadeMachine;
window.drawArcadeScreen = drawArcadeScreen;
window.startMiniGameEvents = startMiniGameEvents;
window.stopMiniGameEvents = stopMiniGameEvents;
window.handleMiniGameClick = handleMiniGameClick;
window.arcadeHighScore = arcadeHighScore;
