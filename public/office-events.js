// ============================================================================
// Office Events System - Phase 6
// ============================================================================

// Event types
const OfficeEventTypes = {
  PIZZA_DELIVERY: 'pizza_delivery',
  RUBBER_DUCK: 'rubber_duck',
  COFFEE_BREAK: 'coffee_break'
};

// ============================================================================
// Visitor System - Phase 7
// ============================================================================

// Visitor types
const VisitorTypes = {
  CLIENT: 'client',
  FRIEND: 'friend',
  DELIVERY: 'delivery',
  INTERVIEWER: 'interviewer'
};

// Visitor configuration
const VISITOR_CONFIG = {
  [VisitorTypes.CLIENT]: {
    name: 'Client',
    color: '#4488ff',
    arrivalInterval: 30 * 60 * 1000,
    arrivalIntervalMax: 60 * 60 * 1000,
    behaviorDuration: 8000,
    greeting: "Hello! I'm here for a meeting.",
    destination: 'desk', // walks to a random desk
    leavesWith: 'speech'
  },
  [VisitorTypes.FRIEND]: {
    name: 'Friend',
    color: '#ff88ff',
    arrivalInterval: 45 * 60 * 1000,
    arrivalIntervalMax: 90 * 60 * 1000,
    behaviorDuration: 6000,
    greeting: "Hey! Just stopping by!",
    destination: 'lounge', // waves in lounge area
    leavesWith: 'wave'
  },
  [VisitorTypes.DELIVERY]: {
    name: 'Delivery',
    color: '#ffaa44',
    arrivalInterval: 20 * 60 * 1000,
    arrivalIntervalMax: 40 * 60 * 1000,
    behaviorDuration: 3000,
    greeting: "Package delivery!",
    destination: 'reception', // drops at reception
    leavesWith: 'drop'
  },
  [VisitorTypes.INTERVIEWER]: {
    name: 'Interviewer',
    color: '#44ff88',
    arrivalInterval: 60 * 60 * 1000,
    arrivalIntervalMax: 90 * 60 * 1000,
    behaviorDuration: 10000,
    greeting: "Hi! I'm here for the interview.",
    destination: 'meeting', // walks to meeting area
    leavesWith: 'speech'
  }
};

// Visitor waypoints
const VisitorWaypoints = {
  // Entrance (front door)
  ENTRANCE: { x: 0.50, y: 0.95 },
  
  // Reception (where Bestie sits)
  RECEPTION: { x: 0.22, y: 0.62 },
  
  // Lounge area
  LOUNGE: { x: 0.15, y: 0.65 },
  
  // Meeting rooms
  MEETING_1: { x: 0.74, y: 0.78 },
  MEETING_2: { x: 0.88, y: 0.78 },
  
  // Random desk destinations
  DESK_AREAS: [
    { x: 0.15, y: 0.12 }, // Nova area
    { x: 0.12, y: 0.40 }, // Zero-1
    { x: 0.44, y: 0.40 }, // Zero-2
    { x: 0.76, y: 0.40 }, // Zero-3
    { x: 0.72, y: 0.12 }, // Delta
    { x: 0.78, y: 0.62 }  // Dexter
  ],
  
  // Exit
  EXIT: { x: 0.50, y: 1.0 }
};

// Visitor state
let currentVisitor = null;
let visitorTimer = null;
let visitorCount = 0;

// Visitor speech bubble timeout
let visitorGreetingTimeout = null;

// Create a visitor
function createVisitor(type) {
  const config = VISITOR_CONFIG[type];
  return {
    id: `visitor_${Date.now()}`,
    type: type,
    name: config.name,
    color: config.color,
    offsetX: VisitorWaypoints.ENTRANCE.x,
    offsetY: VisitorWaypoints.ENTRANCE.y,
    state: 'entering', // entering, greeting, behaving, leaving
    frame: 0,
    visible: true,
    greetingShown: false,
    destination: null,
    startTime: Date.now()
  };
}

// Get random visitor type
function getRandomVisitorType() {
  const types = Object.values(VisitorTypes);
  return types[Math.floor(Math.random() * types.length)];
}

// Get random desk destination
function getRandomDeskDestination() {
  const desks = VisitorWaypoints.DESK_AREAS;
  return desks[Math.floor(Math.random() * desks.length)];
}

// Get greeting message for visitor type
function getVisitorGreeting(type) {
  return VISITOR_CONFIG[type]?.greeting || "Hello!";
}

// Show Bestie greeting speech bubble
function showBestieGreeting(visitor) {
  const bestie = window.CHARACTERS?.find(c => c.id === 'bestie');
  if (!bestie || typeof speechBubbles === 'undefined') return;
  
  // Bestie greets the visitor
  speechBubbles.push({
    id: Date.now() + Math.random(),
    characterId: 'bestie_greeting',
    text: `Welcome! ${visitor.name}, right?`,
    x: bestie.offsetX,
    y: bestie.offsetY - 0.05,
    createdAt: Date.now(),
    duration: 3000,
    opacity: 0,
    state: 'appearing'
  });
}

// Trigger visitor arrival
function triggerVisitorArrival() {
  if (currentVisitor || !currentEvent) return; // Don't interrupt other events
  
  const type = getRandomVisitorType();
  const config = VISITOR_CONFIG[type];
  
  console.log(`👋 Visitor arriving: ${type}`);
  
  // Play notification sound (Phase 8)
  if (window.onOfficeEvent) {
    window.onOfficeEvent('visitor');
  }
  
  currentVisitor = createVisitor(type);
  visitorCount++;
  
  // Set destination based on visitor type
  switch (type) {
    case VisitorTypes.CLIENT:
      currentVisitor.destination = getRandomDeskDestination();
      break;
    case VisitorTypes.FRIEND:
      currentVisitor.destination = VisitorWaypoints.LOUNGE;
      break;
    case VisitorTypes.DELIVERY:
      currentVisitor.destination = VisitorWaypoints.RECEPTION;
      break;
    case VisitorTypes.INTERVIEWER:
      currentVisitor.destination = Math.random() > 0.5 ? VisitorWaypoints.MEETING_1 : VisitorWaypoints.MEETING_2;
      break;
  }
  
  // Schedule greeting after arrival at reception
  visitorGreetingTimeout = setTimeout(() => {
    if (currentVisitor) {
      currentVisitor.state = 'greeting';
      currentVisitor.greetingShown = true;
      
      // Show visitor's greeting at reception
      if (typeof speechBubbles !== 'undefined') {
        speechBubbles.push({
          id: Date.now() + Math.random(),
          characterId: currentVisitor.id,
          text: getVisitorGreeting(currentVisitor.type),
          x: VisitorWaypoints.RECEPTION.x,
          y: VisitorWaypoints.RECEPTION.y - 0.05,
          createdAt: Date.now(),
          duration: 3000,
          opacity: 0,
          state: 'appearing'
        });
      }
      
      // Bestie reacts with greeting
      showBestieGreeting(currentVisitor);
      
      // After greeting, visitor goes to their destination
      setTimeout(() => {
        if (currentVisitor) {
          currentVisitor.state = 'behaving';
          moveVisitorToDestination(currentVisitor, currentVisitor.destination, () => {
            // Arrived at destination - wait for behavior duration
            setTimeout(() => {
              if (currentVisitor) {
                currentVisitor.state = 'leaving';
                moveVisitorToDestination(currentVisitor, VisitorWaypoints.EXIT, () => {
                  endVisitorVisit();
                });
              }
            }, config.behaviorDuration);
          });
        }
      }, 2500);
    }
  }, 1500);
}

// Move visitor to destination
function moveVisitorToTarget(visitor, targetX, targetY, callback) {
  visitor.state = 'walking';
  visitor.targetX = targetX;
  visitor.targetY = targetY;
  
  visitor.movingToTarget = {
    targetX,
    targetY,
    callback,
    startX: visitor.offsetX,
    startY: visitor.offsetY,
    startTime: Date.now(),
    duration: 2500 // 2.5 seconds to reach destination
  };
}

// Alias for compatibility
function moveVisitorToDestination(visitor, destination, callback) {
  moveVisitorToTarget(visitor, destination.x, destination.y, callback);
}

// Update visitor movement
function updateVisitorMovement(visitor, deltaTime) {
  if (!visitor?.movingToTarget) return;
  
  const move = visitor.movingToTarget;
  const elapsed = Date.now() - move.startTime;
  const progress = Math.min(elapsed / move.duration, 1);
  
  // Ease out cubic
  const eased = 1 - Math.pow(1 - progress, 3);
  
  visitor.offsetX = move.startX + (move.targetX - move.startX) * eased;
  visitor.offsetY = move.startY + (move.targetY - move.startY) * eased;
  
  if (progress >= 1) {
    delete visitor.movingToTarget;
    if (move.callback) {
      move.callback();
    }
  }
}

// End visitor visit
function endVisitorVisit() {
  if (!currentVisitor) return;
  
  console.log(`👋 Visitor left: ${currentVisitor.type}`);
  
  // Clear any pending greeting timeout
  if (visitorGreetingTimeout) {
    clearTimeout(visitorGreetingTimeout);
    visitorGreetingTimeout = null;
  }
  
  // Remove visitor's speech bubbles
  if (typeof speechBubbles !== 'undefined') {
    for (let i = speechBubbles.length - 1; i >= 0; i--) {
      const bubble = speechBubbles[i];
      if (bubble.characterId === currentVisitor.id || bubble.characterId === 'bestie_greeting') {
        speechBubbles.splice(i, 1);
      }
    }
  }
  
  // Add timeline event for visitor
  if (window.addTimelineEvent) {
    window.addTimelineEvent('Bestie', 'visitor', currentVisitor.name);
  }
  
  // Hide visitor
  currentVisitor.visible = false;
  currentVisitor = null;
  
  // Schedule next visitor
  scheduleNextVisitor();
}

// Schedule next visitor
function scheduleNextVisitor() {
  const type = getRandomVisitorType();
  const config = VISITOR_CONFIG[type];
  
  const minTime = config.arrivalInterval;
  const maxTime = config.arrivalIntervalMax;
  const randomTime = Math.random() * (maxTime - minTime) + minTime;
  
  console.log(`📅 Next visitor scheduled in ${Math.round(randomTime / 60000)} minutes: ${type}`);
  
  visitorTimer = setTimeout(() => {
    triggerVisitorArrival();
  }, randomTime);
}

// Update visitor (called from game loop)
function updateVisitors(deltaTime) {
  if (currentVisitor && currentVisitor.visible) {
    updateVisitorMovement(currentVisitor, deltaTime);
    
    // Animate frame
    currentVisitor.frameTime = (currentVisitor.frameTime || 0) + deltaTime;
    if (currentVisitor.frameTime > 400) {
      currentVisitor.frame = (currentVisitor.frame + 1) % 3;
      currentVisitor.frameTime = 0;
    }
  }
}

// Draw visitor
function drawVisitor() {
  if (!currentVisitor || !currentVisitor.visible) return;
  
  const { x, y, w, h, scale } = getOfficeBounds();
  const visitor = currentVisitor;
  
  const charX = x + w * visitor.offsetX;
  const charY = y + h * visitor.offsetY;
  const spriteW = 28 * scale;
  const spriteH = 36 * scale;
  
  // Walking animation offset
  const walkOffset = visitor.state === 'walking' ? [0, -2, 0][visitor.frame] * scale : 0;
  
  // Body
  ctx.fillStyle = visitor.color;
  ctx.fillRect(charX - spriteW / 2, charY - spriteH / 2 + walkOffset, spriteW, spriteH);
  
  // Border
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2 * scale;
  ctx.strokeRect(charX - spriteW / 2, charY - spriteH / 2 + walkOffset, spriteW, spriteH);
  
  // Visitor type indicator
  const typeIcon = {
    [VisitorTypes.CLIENT]: '💼',
    [VisitorTypes.FRIEND]: '👋',
    [VisitorTypes.DELIVERY]: '📦',
    [VisitorTypes.INTERVIEWER]: '📋'
  }[visitor.type] || '👤';
  
  // Small icon above head
  ctx.font = `${12 * scale}px Arial`;
  ctx.textAlign = 'center';
  ctx.fillText(typeIcon, charX, charY - spriteH / 2 - 6 * scale + walkOffset);
  
  // Name
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${9 * scale}px Arial`;
  ctx.fillText(visitor.name, charX, charY - spriteH / 2 - 16 * scale + walkOffset);
}

// Get visitor count for stats
function getVisitorCount() {
  return visitorCount;
}

// Export for use
window.VisitorTypes = VisitorTypes;
window.updateVisitors = updateVisitors;
window.drawVisitor = drawVisitor;
window.getVisitorCount = getVisitorCount;

// ============================================================================
// End Visitor System
// ============================================================================

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
  
  // Play notification sound (Phase 8)
  if (window.onOfficeEvent) {
    window.onOfficeEvent('pizza');
  }
  
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
  
  // Initialize visitor system (Phase 7)
  // Visitors come every 30-60 minutes (random)
  setTimeout(scheduleNextVisitor, 90000); // First visitor in 1.5 minutes
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
