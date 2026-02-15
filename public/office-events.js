// ============================================================================
// Office Events System - Phase 6
// ============================================================================

// Event types
const OfficeEventTypes = {
  PIZZA_DELIVERY: 'pizza_delivery',
  RUBBER_DUCK: 'rubber_duck',
  COFFEE_BREAK: 'coffee_break'
};

// Event state
let currentEvent = null;
let eventTimer = null;
let eventStartTime = 0;

// Waypoints for events
const EventWaypoints = {
  // Pizza delivery entrance (front door)
  ENTRANCE: { x: 0.50, y: 0.95 },
  
  // Pizza gathering area (center of office)
  GATHERING_SPOT: { x: 0.50, y: 0.55 },
  
  // Kitchen area for coffee break
  KITCHEN: { x: 0.08, y: 0.15 },
  
  // Exit point
  EXIT: { x: 0.50, y: 1.0 }
};

// Event configuration
const EVENT_CONFIG = {
  [OfficeEventTypes.PIZZA_DELIVERY]: {
    triggerInterval: 30 * 60 * 1000, // 30-60 minutes (randomized)
    triggerIntervalMax: 60 * 60 * 1000,
    duration: 10000, // 10 seconds
    gatherTime: 3000, // Time for agents to gather
    message: '🍕 Pizza time!',
    characterColor: '#ff4444',
    characterName: 'Pizza'
  },
  [OfficeEventTypes.RUBBER_DUCK]: {
    triggerInterval: 15 * 60 * 1000, // 15-30 minutes
    triggerIntervalMax: 30 * 60 * 1000,
    duration: 8000, // 8 seconds
    message: '🧠 Rubber duck debugging...',
    moodBoost: true
  },
  [OfficeEventTypes.COFFEE_BREAK]: {
    triggerInterval: 45 * 60 * 1000, // 45-90 minutes
    triggerIntervalMax: 90 * 60 * 1000,
    duration: 12000, // 12 seconds
    message: '☕ Coffee break!',
    walkSpeed: 0.0006 // Slower walk for coffee break
  }
};

// Pizza delivery character
const pizzaDeliveryCharacter = {
  id: 'pizza_delivery',
  name: 'Pizza',
  color: '#ff6644',
  offsetX: 0.50,
  offsetY: 0.95,
  state: 'idle',
  visible: false,
  carryingPizza: true,
  frame: 0
};

// Rubber duck character
const rubberDuck = {
  id: 'rubber_duck',
  name: 'Duck',
  color: '#ffff44',
  offsetX: 0,
  offsetY: 0,
  visible: false,
  frame: 0
};

// Agent backup data (for restoring after event)
const agentBackup = {};

// Store agent states before event
function backupAgentStates() {
  if (!window.CHARACTERS) return;
  
  window.CHARACTERS.forEach(character => {
    agentBackup[character.id] = {
      state: character.state,
      offsetX: character.offsetX,
      offsetY: character.offsetY,
      path: character.path ? [...character.path] : null,
      pathProgress: character.pathProgress,
      targetX: character.targetX,
      targetY: character.targetY
    };
  });
}

// Restore agent states after event
function restoreAgentStates() {
  if (!window.CHARACTERS) return;
  
  window.CHARACTERS.forEach(character => {
    const backup = agentBackup[character.id];
    if (backup) {
      character.state = backup.state;
      character.offsetX = backup.offsetX;
      character.offsetY = backup.offsetY;
      character.path = backup.path;
      character.pathProgress = backup.pathProgress;
      character.targetX = backup.targetX;
      character.targetY = backup.targetY;
    }
  });
}

// Move character to target (for event animations)
function moveCharacterToTarget(character, targetX, targetY, callback) {
  character.state = 'walking_to_target';
  character.targetX = targetX;
  character.targetY = targetY;
  
  // Simple movement update
  character.movingToTarget = {
    targetX,
    targetY,
    callback,
    startX: character.offsetX,
    startY: character.offsetY,
    startTime: Date.now(),
    duration: 2000 // 2 seconds to reach target
  };
}

// Update character movement to target
function updateCharacterMovement(character, deltaTime) {
  if (!character.movingToTarget) return;
  
  const move = character.movingToTarget;
  const elapsed = Date.now() - move.startTime;
  const progress = Math.min(elapsed / move.duration, 1);
  
  // Ease out cubic
  const eased = 1 - Math.pow(1 - progress, 3);
  
  character.offsetX = move.startX + (move.targetX - move.startX) * eased;
  character.offsetY = move.startY + (move.targetY - move.startY) * eased;
  
  if (progress >= 1) {
    delete character.movingToTarget;
    if (move.callback) {
      move.callback();
    }
  }
}

// Get random working agent for rubber duck event
function getRandomWorkingAgent() {
  if (!window.CHARACTERS) return null;
  
  const workingAgents = window.CHARACTERS.filter(
    c => c.state === 'working' || c.state === 'WORKING'
  );
  
  if (workingAgents.length === 0) return null;
  return workingAgents[Math.floor(Math.random() * workingAgents.length)];
}

// Get all working agents for pizza/coffee events
function getAllWorkingAgents() {
  if (!window.CHARACTERS) return [];
  
  return window.CHARACTERS.filter(
    c => c.state === 'working' || c.state === 'WORKING'
  );
}

// ============================================================================
// Pizza Delivery Event
// ============================================================================

function triggerPizzaDeliveryEvent() {
  if (currentEvent) return; // Already in an event
  
  console.log('🍕 Pizza delivery event triggered!');
  currentEvent = {
    type: OfficeEventTypes.PIZZA_DELIVERY,
    startTime: Date.now()
  };
  
  // Backup agent states
  backupAgentStates();
  
  // Show pizza delivery character
  pizzaDeliveryCharacter.visible = true;
  pizzaDeliveryCharacter.offsetX = EventWaypoints.ENTRANCE.x;
  pizzaDeliveryCharacter.offsetY = EventWaypoints.ENTRANCE.y;
  pizzaDeliveryCharacter.state = 'walking_in';
  
  // Walk pizza character to center
  setTimeout(() => {
    moveCharacterToTarget(
      pizzaDeliveryCharacter,
      EventWaypoints.GATHERING_SPOT.x,
      EventWaypoints.GATHERING_SPOT.y,
      () => {
        // Arrived at gathering spot - show speech bubble
        pizzaDeliveryCharacter.state = 'delivering';
        
        // Create speech bubble - add directly to speechBubbles array
        if (typeof speechBubbles !== 'undefined') {
          speechBubbles.push({
            id: Date.now() + Math.random(),
            characterId: 'pizza_delivery',
            text: EVENT_CONFIG[OfficeEventTypes.PIZZA_DELIVERY].message,
            x: pizzaDeliveryCharacter.offsetX,
            y: pizzaDeliveryCharacter.offsetY,
            createdAt: Date.now(),
            duration: 8000,
            opacity: 0,
            state: 'appearing'
          });
        }
        
        // Call agents to gather
        callAgentsToGather();
      }
    );
  }, 500);
  
  // Set event end timer
  eventTimer = setTimeout(endEvent, EVENT_CONFIG[OfficeEventTypes.PIZZA_DELIVERY].duration);
}

// Move working agents to gathering spot
function callAgentsToGather() {
  if (!window.CHARACTERS) return;
  
  const gatheringX = EventWaypoints.GATHERING_SPOT.x;
  const gatheringY = EventWaypoints.GATHERING_SPOT.y;
  
  window.CHARACTERS.forEach((character, index) => {
    // Stagger movement
    setTimeout(() => {
      // Calculate position around gathering spot
      const angle = (index / window.CHARACTERS.length) * Math.PI * 2;
      const radius = 0.08;
      const targetX = gatheringX + Math.cos(angle) * radius;
      const targetY = gatheringY + Math.sin(angle) * radius * 0.6;
      
      moveCharacterToTarget(character, targetX, targetY, () => {
        character.state = 'at_pizza';
      });
    }, index * 200);
  });
}

// ============================================================================
// Rubber Duck Debugging Event
// ============================================================================

function triggerRubberDuckEvent() {
  if (currentEvent) return;
  
  const targetAgent = getRandomWorkingAgent();
  if (!targetAgent) {
    console.log('🦆 No working agent for rubber duck event');
    return; // No working agents
  }
  
  console.log('🦆 Rubber duck debugging event triggered!');
  currentEvent = {
    type: OfficeEventTypes.RUBBER_DUCK,
    startTime: Date.now(),
    targetAgent: targetAgent.id
  };
  
  // Backup agent states
  backupAgentStates();
  
  // Place rubber duck on agent's desk
  rubberDuck.visible = true;
  rubberDuck.offsetX = targetAgent.deskX;
  rubberDuck.offsetY = targetAgent.deskY;
  
  // Agent does thinking animation
  targetAgent.state = 'thinking';
  
  // Show speech bubble
  if (typeof speechBubbles !== 'undefined') {
    const targetAgent = window.CHARACTERS?.find(c => c.id === currentEvent.targetAgent);
    speechBubbles.push({
      id: Date.now() + Math.random(),
      characterId: 'rubber_duck',
      text: EVENT_CONFIG[OfficeEventTypes.RUBBER_DUCK].message,
      x: targetAgent?.offsetX || 0.5,
      y: targetAgent?.offsetY || 0.5,
      createdAt: Date.now(),
      duration: 6000,
      opacity: 0,
      state: 'appearing'
    });
  }
  
  // Boost mood after event
  if (window.onTaskComplete) {
    // Store for after event
    currentEvent.moodBoostTarget = targetAgent;
  }
  
  // Set event end timer
  eventTimer = setTimeout(endEvent, EVENT_CONFIG[OfficeEventTypes.RUBBER_DUCK].duration);
}

// ============================================================================
// Coffee Break Sync Event
// ============================================================================

function triggerCoffeeBreakEvent() {
  if (currentEvent) return;
  
  console.log('☕ Coffee break event triggered!');
  currentEvent = {
    type: OfficeEventTypes.COFFEE_BREAK,
    startTime: Date.now()
  };
  
  // Backup agent states
  backupAgentStates();
  
  // Show speech bubble
  if (typeof speechBubbles !== 'undefined') {
    speechBubbles.push({
      id: Date.now() + Math.random(),
      characterId: 'coffee_break',
      text: EVENT_CONFIG[OfficeEventTypes.COFFEE_BREAK].message,
      x: EventWaypoints.KITCHEN.x,
      y: EventWaypoints.KITCHEN.y,
      createdAt: Date.now(),
      duration: 10000,
      opacity: 0,
      state: 'appearing'
    });
  }
  
  // All agents walk to kitchen together
  const kitchenX = EventWaypoints.KITCHEN.x;
  const kitchenY = EventWaypoints.KITCHEN.y;
  
  if (!window.CHARACTERS) return;
  
  window.CHARACTERS.forEach((character, index) => {
    setTimeout(() => {
      // Position around kitchen
      const angle = (index / window.CHARACTERS.length) * Math.PI * 2;
      const radius = 0.06;
      const targetX = kitchenX + Math.cos(angle) * radius;
      const targetY = kitchenY + Math.sin(angle) * radius * 0.6;
      
      moveCharacterToTarget(character, targetX, targetY, () => {
        character.state = 'at_coffee';
      });
    }, index * 150);
  });
  
  // Set event end timer
  eventTimer = setTimeout(endEvent, EVENT_CONFIG[OfficeEventTypes.COFFEE_BREAK].duration);
}

// ============================================================================
// Event Management
// ============================================================================

function endEvent() {
  if (!currentEvent) return;
  
  console.log('🏁 Event ended:', currentEvent.type);
  
  // Clear speech bubbles
  if (typeof speechBubbles !== 'undefined') {
    // Remove event-related bubbles
    for (let i = speechBubbles.length - 1; i >= 0; i--) {
      const bubble = speechBubbles[i];
      if (bubble.characterId === 'pizza_delivery' || 
          bubble.characterId === 'rubber_duck' || 
          bubble.characterId === 'coffee_break') {
        speechBubbles.splice(i, 1);
      }
    }
  }
  
  // Hide event characters
  pizzaDeliveryCharacter.visible = false;
  rubberDuck.visible = false;
  
  // Apply mood boost for rubber duck
  if (currentEvent.type === OfficeEventTypes.RUBBER_DUCK && currentEvent.moodBoostTarget) {
    if (window.onTaskComplete) {
      window.onTaskComplete(currentEvent.moodBoostTarget);
    }
  }
  
  // Restore agent states
  restoreAgentStates();
  
  // Clear event
  currentEvent = null;
  
  // Schedule next event
  scheduleNextEvent();
}

// Schedule random event
function scheduleNextEvent() {
  const eventTypes = Object.values(OfficeEventTypes);
  const randomEvent = eventTypes[Math.floor(Math.random() * eventTypes.length)];
  const config = EVENT_CONFIG[randomEvent];
  
  // Random duration within range
  const minTime = config.triggerInterval;
  const maxTime = config.triggerIntervalMax;
  const randomTime = Math.random() * (maxTime - minTime) + minTime;
  
  console.log(`📅 Next event scheduled in ${Math.round(randomTime / 60000)} minutes:`, randomEvent);
  
  setTimeout(() => {
    switch (randomEvent) {
      case OfficeEventTypes.PIZZA_DELIVERY:
        triggerPizzaDeliveryEvent();
        break;
      case OfficeEventTypes.RUBBER_DUCK:
        triggerRubberDuckEvent();
        break;
      case OfficeEventTypes.COFFEE_BREAK:
        triggerCoffeeBreakEvent();
        break;
    }
  }, randomTime);
}

// Update event-related characters (called from game loop)
function updateOfficeEvents(deltaTime) {
  // Update pizza delivery character
  if (pizzaDeliveryCharacter.visible) {
    updateCharacterMovement(pizzaDeliveryCharacter, deltaTime);
    
    // Animate frame
    pizzaDeliveryCharacter.frameTime = (pizzaDeliveryCharacter.frameTime || 0) + deltaTime;
    if (pizzaDeliveryCharacter.frameTime > 500) {
      pizzaDeliveryCharacter.frame = (pizzaDeliveryCharacter.frame + 1) % 3;
      pizzaDeliveryCharacter.frameTime = 0;
    }
  }
  
  // Update rubber duck (bobbing animation)
  if (rubberDuck.visible) {
    rubberDuck.frameTime = (rubberDuck.frameTime || 0) + deltaTime;
    if (rubberDuck.frameTime > 300) {
      rubberDuck.frame = (rubberDuck.frame + 1) % 3;
      rubberDuck.frameTime = 0;
    }
  }
  
  // Update characters moving to targets
  if (window.CHARACTERS) {
    window.CHARACTERS.forEach(character => {
      updateCharacterMovement(character, deltaTime);
    });
  }
}

// Draw event characters
function drawOfficeEvents() {
  const { x, y, w, h, scale } = getOfficeBounds();
  
  // Draw pizza delivery character
  if (pizzaDeliveryCharacter.visible) {
    const charX = x + w * pizzaDeliveryCharacter.offsetX;
    const charY = y + h * pizzaDeliveryCharacter.offsetY;
    const spriteW = 32 * scale;
    const spriteH = 36 * scale;
    
    // Body
    ctx.fillStyle = pizzaDeliveryCharacter.color;
    ctx.fillRect(charX - spriteW / 2, charY - spriteH / 2, spriteW, spriteH);
    
    // Border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2 * scale;
    ctx.strokeRect(charX - spriteW / 2, charY - spriteH / 2, spriteW, spriteH);
    
    // Pizza box
    if (pizzaDeliveryCharacter.carryingPizza) {
      ctx.fillStyle = '#ffaa00';
      ctx.fillRect(charX - 10 * scale, charY - 5 * scale, 20 * scale, 8 * scale);
      ctx.strokeStyle = '#cc8800';
      ctx.strokeRect(charX - 10 * scale, charY - 5 * scale, 20 * scale, 8 * scale);
    }
    
    // Name
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${10 * scale}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText(pizzaDeliveryCharacter.name, charX, charY - spriteH / 2 - 4 * scale);
  }
  
  // Draw rubber duck
  if (rubberDuck.visible) {
    const charX = x + w * rubberDuck.offsetX;
    const bobOffset = [0, -3, 0][rubberDuck.frame] * scale;
    const charY = y + h * rubberDuck.offsetY + bobOffset;
    const duckSize = 20 * scale;
    
    // Body (yellow oval)
    ctx.fillStyle = '#ffdd00';
    ctx.beginPath();
    ctx.ellipse(charX, charY, duckSize * 0.7, duckSize * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Head
    ctx.beginPath();
    ctx.arc(charX + duckSize * 0.4, charY - duckSize * 0.3, duckSize * 0.35, 0, Math.PI * 2);
    ctx.fill();
    
    // Beak
    ctx.fillStyle = '#ff8800';
    ctx.beginPath();
    ctx.moveTo(charX + duckSize * 0.7, charY - duckSize * 0.3);
    ctx.lineTo(charX + duckSize * 0.95, charY - duckSize * 0.25);
    ctx.lineTo(charX + duckSize * 0.7, charY - duckSize * 0.2);
    ctx.fill();
    
    // Eye
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(charX + duckSize * 0.5, charY - duckSize * 0.35, 2 * scale, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Initialize office events
function initializeOfficeEvents() {
  console.log('🎉 Office events system initialized');
  
  // Wait a bit before first event
  setTimeout(scheduleNextEvent, 60000); // First event in 1 minute
}

// Export for use in app.js
window.OfficeEventTypes = OfficeEventTypes;
window.updateOfficeEvents = updateOfficeEvents;
window.drawOfficeEvents = drawOfficeEvents;
window.initializeOfficeEvents = initializeOfficeEvents;
window.currentEvent = currentEvent;

// ============================================================================
// End Office Events System
// ============================================================================
