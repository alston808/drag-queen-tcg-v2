// src/game/powerSystem.js

// Power trigger types
export const PowerTriggers = {
  ON_PLAY: 'ON_PLAY',                    // When card is played
  ON_LIP_SYNC_START: 'ON_LIP_SYNC_START', // When lip sync begins
  ON_LIP_SYNC_WIN: 'ON_LIP_SYNC_WIN',    // When queen wins lip sync
  ON_LIP_SYNC_LOSE: 'ON_LIP_SYNC_LOSE',  // When queen loses lip sync
  ON_READ: 'ON_READ',                    // When queen gets shade tokens
  ON_ACTIVATE: 'ON_ACTIVATE',            // When power is manually activated
  ON_TURN_START: 'ON_TURN_START',        // At start of turn
  ON_TURN_END: 'ON_TURN_END',            // At end of turn
  ON_PHASE_CHANGE: 'ON_PHASE_CHANGE',    // When game phase changes
  ON_STAT_CHANGE: 'ON_STAT_CHANGE',      // When a stat changes
  ON_EQUIPMENT_ATTACH: 'ON_EQUIPMENT_ATTACH', // When equipment is attached
  ON_EQUIPMENT_DETACH: 'ON_EQUIPMENT_DETACH', // When equipment is removed
  ON_ELIMINATION: 'ON_ELIMINATION',      // When queen is eliminated
  ON_DAMAGE: 'ON_DAMAGE',                // When damage is taken
  ON_HEAL: 'ON_HEAL',                    // When healing occurs
  ON_DRAW: 'ON_DRAW',                    // When cards are drawn
  ON_DISCARD: 'ON_DISCARD',              // When cards are discarded
  ON_SHADE: 'ON_SHADE',                  // When shade tokens are placed
};

// Power effect types
export const PowerEffects = {
  MODIFY_STAT: 'MODIFY_STAT',            // Change a stat value
  MODIFY_DAMAGE: 'MODIFY_DAMAGE',        // Change damage dealt/taken
  MODIFY_SHADE: 'MODIFY_SHADE',          // Change shade tokens
  DRAW_CARDS: 'DRAW_CARDS',              // Draw cards
  DISCARD_CARDS: 'DISCARD_CARDS',        // Discard cards
  GAIN_GAG: 'GAIN_GAG',                  // Gain gag tokens
  PREVENT_EFFECT: 'PREVENT_EFFECT',      // Prevent an effect
  COPY_POWER: 'COPY_POWER',              // Copy another power
  STEAL_POWER: 'STEAL_POWER',            // Steal another power
  TRANSFORM: 'TRANSFORM',                // Transform into another card
  RETURN_TO_HAND: 'RETURN_TO_HAND',      // Return to hand
  RETURN_TO_DECK: 'RETURN_TO_DECK',      // Return to deck
  SEARCH_DECK: 'SEARCH_DECK',            // Search deck for cards
  MODIFY_COST: 'MODIFY_COST',            // Change cost of cards/abilities
  MODIFY_LIMIT: 'MODIFY_LIMIT',          // Change limits (hand size, etc)
  MODIFY_CONDITION: 'MODIFY_CONDITION',  // Change win/lose conditions
  MODIFY_PHASE: 'MODIFY_PHASE',          // Change phase effects
  MODIFY_TARGETING: 'MODIFY_TARGETING',  // Change targeting rules
  MODIFY_EQUIPMENT: 'MODIFY_EQUIPMENT',  // Change equipment effects
  MODIFY_SPECIAL: 'MODIFY_SPECIAL',      // Special effects
};

// Power target types
export const PowerTargets = {
  SELF: 'SELF',                          // The card with the power
  OWNER: 'OWNER',                        // The player who owns the card
  OPPONENT: 'OPPONENT',                  // The opponent
  ALL_QUEENS: 'ALL_QUEENS',              // All queens in play
  OWN_QUEENS: 'OWN_QUEENS',              // Your queens
  OPPONENT_QUEENS: 'OPPONENT_QUEENS',    // Opponent's queens
  ALL_EQUIPMENT: 'ALL_EQUIPMENT',        // All equipment
  OWN_EQUIPMENT: 'OWN_EQUIPMENT',        // Your equipment
  OPPONENT_EQUIPMENT: 'OPPONENT_EQUIPMENT', // Opponent's equipment
  HAND: 'HAND',                          // Cards in hand
  DECK: 'DECK',                          // Cards in deck
  DISCARD: 'DISCARD',                    // Cards in discard
  BATTLE: 'BATTLE',                      // Current battle
  PHASE: 'PHASE',                        // Current phase
  GAME: 'GAME',                          // Game state
};

// Power cost types
export const PowerCosts = {
  NONE: 'NONE',                          // No cost
  GAG: 'GAG',                            // Pay gag tokens
  DISCARD: 'DISCARD',                    // Discard cards
  SACRIFICE: 'SACRIFICE',                // Sacrifice a card
  STAT_CHECK: 'STAT_CHECK',              // Check if stats meet condition
  CONDITION: 'CONDITION',                // Check other condition
  COOLDOWN: 'COOLDOWN',                  // Can't use for X turns
  LIMIT: 'LIMIT',                        // Can only use X times
  PHASE: 'PHASE',                        // Can only use in certain phase
  TARGET: 'TARGET',                      // Must have valid target
};

// Power definition structure
export class Power {
  constructor({
    id,                    // Unique identifier
    name,                  // Display name
    description,           // Display description
    trigger,               // When it activates (PowerTriggers)
    effect,                // What it does (PowerEffects)
    target,                // What it affects (PowerTargets)
    cost,                  // What it costs (PowerCosts)
    value,                 // Effect value (e.g., amount of damage)
    duration,              // How long it lasts
    condition,             // Additional conditions
    priority,              // Order of resolution
    isPassive = false,     // Whether it's always active
    isReactive = false,    // Whether it responds to events
    isActivated = false,   // Whether it needs to be activated
  }) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.trigger = trigger;
    this.effect = effect;
    this.target = target;
    this.cost = cost;
    this.value = value;
    this.duration = duration;
    this.condition = condition;
    this.priority = priority;
    this.isPassive = isPassive;
    this.isReactive = isReactive;
    this.isActivated = isActivated;
  }

  // Check if power can be used
  canUse(gameState, context) {
    // Check cost
    if (this.cost !== PowerCosts.NONE) {
      // Implement cost checking logic
      return false;
    }

    // Check condition
    if (this.condition && !this.condition(gameState, context)) {
      return false;
    }

    // Check target
    if (this.target && !this.hasValidTarget(gameState, context)) {
      return false;
    }

    return true;
  }

  // Check if power has valid target
  hasValidTarget(gameState, context) {
    // Implement target validation logic
    return true;
  }

  // Apply power effect
  apply(gameState, context) {
    if (!this.canUse(gameState, context)) {
      return null;
    }

    // Implement effect application logic
    return {
      type: this.effect,
      value: this.value,
      target: this.target,
      duration: this.duration
    };
  }
}

// Power registry
export class PowerRegistry {
  constructor() {
    this.powers = new Map();
  }

  // Register a new power
  register(power) {
    if (this.powers.has(power.id)) {
      console.warn(`Power ${power.id} already registered`);
      return false;
    }
    this.powers.set(power.id, power);
    return true;
  }

  // Get a power by ID
  get(id) {
    return this.powers.get(id);
  }

  // Get all powers
  getAll() {
    return Array.from(this.powers.values());
  }

  // Get powers by trigger
  getByTrigger(trigger) {
    return this.getAll().filter(power => power.trigger === trigger);
  }

  // Get powers by effect
  getByEffect(effect) {
    return this.getAll().filter(power => power.effect === effect);
  }

  // Get powers by target
  getByTarget(target) {
    return this.getAll().filter(power => power.target === target);
  }
}

// Create global power registry
export const powerRegistry = new PowerRegistry();

// Queen Powers
export const QueenPowers = {
  // All Stars 10 Queens
  DEATH_DROP_SUPREME: new Power({
    id: 'DEATH_DROP_SUPREME',
    name: 'Death Drop Supreme',
    description: 'If Aja wins a Lip Sync based on Talent, the opponent\'s Queen receives 1 Shade Token and you gain 1 Gag Token.',
    trigger: PowerTriggers.ON_LIP_SYNC_WIN,
    effect: PowerEffects.MODIFY_SHADE,
    target: PowerTargets.OPPONENT_QUEENS,
    cost: PowerCosts.NONE,
    value: 1,
    condition: (gameState, context) => {
      return gameState.lipSyncCategory === 'Talent';
    }
  }),

  DEMON_BELLE: new Power({
    id: 'DEMON_BELLE',
    name: 'Demon Belle',
    description: 'Once per game, if Bosco would receive a Shade Token, you may prevent it. If you do, Bosco gains +2 Nerve until your next Untuck phase.',
    trigger: PowerTriggers.ON_SHADE,
    effect: PowerEffects.PREVENT_EFFECT,
    target: PowerTargets.SELF,
    cost: PowerCosts.NONE,
    value: 'shade',
    duration: 1,
    condition: (gameState, context) => {
      return !context.powerUsed; // Track if power has been used this game
    }
  }),

  LIL_JON_YEAH: new Power({
    id: 'LIL_JON_YEAH',
    name: 'Lil Jon Yeah!',
    description: 'If the Lip Sync category is Charisma, DeJa Skye gets +3 Charisma for this Lip Sync. If DeJa Skye wins, draw 1 card.',
    trigger: PowerTriggers.ON_LIP_SYNC_START,
    effect: PowerEffects.MODIFY_STAT,
    target: PowerTargets.SELF,
    cost: PowerCosts.NONE,
    value: { charisma: 3 },
    condition: (gameState, context) => {
      return gameState.lipSyncCategory === 'Charisma';
    }
  }),

  OTHERWORLDLY_GLAMOUR: new Power({
    id: 'OTHERWORLDLY_GLAMOUR',
    name: 'Otherworldly Glamour',
    description: 'When Irene the Alien is played to the Runway, you may look at the top 3 cards of your Look Book. Put one into your hand and the rest on the bottom.',
    trigger: PowerTriggers.ON_PLAY,
    effect: PowerEffects.SEARCH_DECK,
    target: PowerTargets.OWNER,
    cost: PowerCosts.NONE,
    value: 3
  }),

  BROADWAY_POLISH: new Power({
    id: 'BROADWAY_POLISH',
    name: 'Broadway Polish',
    description: 'Olivia Lux\'s Talent cannot be reduced by opponent\'s card effects. If Olivia Lux wins a Lip Sync, opponent loses 1 additional Shantay Point.',
    trigger: PowerTriggers.ON_LIP_SYNC_WIN,
    effect: PowerEffects.MODIFY_DAMAGE,
    target: PowerTargets.BATTLE,
    cost: PowerCosts.NONE,
    value: 1,
    isPassive: true
  }),

  RISE_FROM_ASHES: new Power({
    id: 'RISE_FROM_ASHES',
    name: 'Rise From Ashes',
    description: 'If Phoenix is Read for Filth, you may pay 3 Gag Tokens to return her to your hand instead of the discard pile. Her stats become 5/5/5/5.',
    trigger: PowerTriggers.ON_ELIMINATION,
    effect: PowerEffects.RETURN_TO_HAND,
    target: PowerTargets.SELF,
    cost: PowerCosts.GAG,
    value: 3,
    condition: (gameState, context) => {
      return gameState[context.owner].gagTokens >= 3;
    }
  }),

  TINY_TWIRL_TERROR: new Power({
    id: 'TINY_TWIRL_TERROR',
    name: 'Tiny Twirl Terror',
    description: 'During a Lip Sync, if Jorgeous has lower base Talent than the opposing Queen, Jorgeous gains +3 Talent for this Lip Sync.',
    trigger: PowerTriggers.ON_LIP_SYNC_START,
    effect: PowerEffects.MODIFY_STAT,
    target: PowerTargets.SELF,
    cost: PowerCosts.NONE,
    value: { talent: 3 },
    condition: (gameState, context) => {
      const opponentQueen = context.battle.defender;
      return context.queen.talent < opponentQueen.talent;
    }
  }),

  TRANOS_REALNESS: new Power({
    id: 'TRANOS_REALNESS',
    name: 'Tranos Realness',
    description: 'Opponent\'s Queens need 1 additional Shade Token to be Read for Filth while Kerri Colby is on your Runway.',
    trigger: PowerTriggers.ON_SHADE,
    effect: PowerEffects.MODIFY_SHADE,
    target: PowerTargets.OPPONENT_QUEENS,
    cost: PowerCosts.NONE,
    value: -1,
    isPassive: true
  }),

  CINEMATIC_ODDITY: new Power({
    id: 'CINEMATIC_ODDITY',
    name: 'Cinematic Oddity',
    description: 'Once per game, during your Werk Room phase, you may force an opponent to discard 1 random card and they lose 2 Shantay Points.',
    trigger: PowerTriggers.ON_PHASE_CHANGE,
    effect: PowerEffects.DISCARD_CARDS,
    target: PowerTargets.OPPONENT,
    cost: PowerCosts.NONE,
    value: 1,
    condition: (gameState, context) => {
      return context.phase === 'WERK_ROOM' && !context.powerUsed;
    }
  }),

  HEAVYWEIGHT_CHAMP: new Power({
    id: 'HEAVYWEIGHT_CHAMP',
    name: 'The Heavyweight Champ',
    description: 'When Mistress Isabelle Brooks wins a Lip Sync, the opponent\'s Queen also loses 1 point from each C.U.N.T. stat for their next Lip Sync.',
    trigger: PowerTriggers.ON_LIP_SYNC_WIN,
    effect: PowerEffects.MODIFY_STAT,
    target: PowerTargets.OPPONENT_QUEENS,
    cost: PowerCosts.NONE,
    value: { charisma: -1, uniqueness: -1, nerve: -1, talent: -1 },
    duration: 1
  }),

  ATLANTA_LEGEND: new Power({
    id: 'ATLANTA_LEGEND',
    name: 'Atlanta Legend',
    description: 'At the start of your Spill the Tea phase, if Nicole Paige Brooks is on your Runway, gain 1 additional Gag Token.',
    trigger: PowerTriggers.ON_PHASE_CHANGE,
    effect: PowerEffects.GAIN_GAG,
    target: PowerTargets.OWNER,
    cost: PowerCosts.NONE,
    value: 1,
    condition: (gameState, context) => {
      return context.phase === 'SPILL_THE_TEA';
    }
  }),

  COMEDY_ROAST: new Power({
    id: 'COMEDY_ROAST',
    name: 'Comedy Roast',
    description: 'If Tina Burner wins a Lip Sync based on Charisma or Talent, the opponent loses Shantay Points equal to double the score difference.',
    trigger: PowerTriggers.ON_LIP_SYNC_WIN,
    effect: PowerEffects.MODIFY_DAMAGE,
    target: PowerTargets.BATTLE,
    cost: PowerCosts.NONE,
    value: (gameState, context) => {
      return context.battle.scoreDifference * 2;
    },
    condition: (gameState, context) => {
      return ['Charisma', 'Talent'].includes(gameState.lipSyncCategory);
    }
  }),

  NEON_DREAMSCAPE: new Power({
    id: 'NEON_DREAMSCAPE',
    name: 'Neon Dreamscape',
    description: 'When Acid Betty is played to the Runway, choose an opponent\'s Queen. That Queen gets -2 to all C.U.N.T. stats until your next Untuck phase.',
    trigger: PowerTriggers.ON_PLAY,
    effect: PowerEffects.MODIFY_STAT,
    target: PowerTargets.OPPONENT_QUEENS,
    cost: PowerCosts.NONE,
    value: { charisma: -2, uniqueness: -2, nerve: -2, talent: -2 },
    duration: 1
  }),

  PUERTO_RICAN_HUNTRESS: new Power({
    id: 'PUERTO_RICAN_HUNTRESS',
    name: 'Puerto Rican Huntress',
    description: 'If Alyssa Hunter is in a Lip Sync and the category is Talent or Charisma, you may pay 1 Gag Token to give her +2 in that category.',
    trigger: PowerTriggers.ON_LIP_SYNC_START,
    effect: PowerEffects.MODIFY_STAT,
    target: PowerTargets.SELF,
    cost: PowerCosts.GAG,
    value: (gameState, context) => {
      const category = gameState.lipSyncCategory.toLowerCase();
      return { [category]: 2 };
    },
    condition: (gameState, context) => {
      return ['Talent', 'Charisma'].includes(gameState.lipSyncCategory) && 
             gameState[context.owner].gagTokens >= 1;
    }
  }),

  CUCU_POWER: new Power({
    id: 'CUCU_POWER',
    name: 'Cucu Power',
    description: 'When Cynthia Lee Fontaine is played, you may remove 1 Shade Token from another Queen on your Runway. If an opponent\'s Queen has 0 Gag Cost, Cucu gets +2 Talent.',
    trigger: PowerTriggers.ON_PLAY,
    effect: PowerEffects.MODIFY_SHADE,
    target: PowerTargets.OWN_QUEENS,
    cost: PowerCosts.NONE,
    value: -1
  }),

  INSECTOID_EDGE: new Power({
    id: 'INSECTOID_EDGE',
    name: 'Insectoid Edge',
    description: 'If Daya Betty is the only Queen on your Runway, her Nerve and Uniqueness are considered 10 for Lip Syncs.',
    trigger: PowerTriggers.ON_LIP_SYNC_START,
    effect: PowerEffects.MODIFY_STAT,
    target: PowerTargets.SELF,
    cost: PowerCosts.NONE,
    value: { nerve: 10, uniqueness: 10 },
    condition: (gameState, context) => {
      return gameState[context.owner].runway.length === 1;
    },
    isPassive: true
  }),

  ICE_QUEEN_KICKS: new Power({
    id: 'ICE_QUEEN_KICKS',
    name: 'Ice Queen Kicks',
    description: 'During a Lip Sync, if the category is Talent, Denali gets an additional +1 Talent for each Equipment card attached to her.',
    trigger: PowerTriggers.ON_LIP_SYNC_START,
    effect: PowerEffects.MODIFY_STAT,
    target: PowerTargets.SELF,
    cost: PowerCosts.NONE,
    value: (gameState, context) => {
      const equipmentCount = context.queen.equipment?.length || 0;
      return { talent: equipmentCount };
    },
    condition: (gameState, context) => {
      return gameState.lipSyncCategory === 'Talent';
    }
  }),

  GLAMOUR_TOAD_RESILIENCE: new Power({
    id: 'GLAMOUR_TOAD_RESILIENCE',
    name: 'Glamour Toad Resilience',
    description: 'Ginger Minj starts with 1 extra Shantay Point. Once per game, prevent being Read for Filth by discarding 2 cards.',
    trigger: PowerTriggers.ON_ELIMINATION,
    effect: PowerEffects.PREVENT_EFFECT,
    target: PowerTargets.SELF,
    cost: PowerCosts.DISCARD,
    value: 'elimination',
    condition: (gameState, context) => {
      return gameState[context.owner].hand.length >= 2 && !context.powerUsed;
    }
  })
};

// Equipment Powers
export const EquipmentPowers = {
  SKYSCRAPER_WIG: new Power({
    id: 'SKYSCRAPER_WIG',
    name: 'The Skyscraper Wig',
    description: '+2 Charisma. If this Queen\'s base Nerve is 6 or more, also +1 Nerve.',
    trigger: PowerTriggers.ON_EQUIPMENT_ATTACH,
    effect: PowerEffects.MODIFY_STAT,
    target: PowerTargets.SELF,
    cost: PowerCosts.NONE,
    value: (gameState, context) => {
      const baseNerve = context.queen.nerve;
      return {
        charisma: 2,
        ...(baseNerve >= 6 ? { nerve: 1 } : {})
      };
    }
  }),

  SEQUIN_ILLUSION_GOWN: new Power({
    id: 'SEQUIN_ILLUSION_GOWN',
    name: 'Sequin Illusion Gown',
    description: '+2 Talent. During a Lip Sync, if the category is Uniqueness, gain +1 to the Performance Score.',
    trigger: PowerTriggers.ON_LIP_SYNC_START,
    effect: PowerEffects.MODIFY_DAMAGE,
    target: PowerTargets.BATTLE,
    cost: PowerCosts.NONE,
    value: 1,
    condition: (gameState, context) => {
      return gameState.lipSyncCategory === 'Uniqueness';
    }
  }),

  DEATH_DROP_STILETTOS: new Power({
    id: 'DEATH_DROP_STILETTOS',
    name: 'Death Drop Stilettos',
    description: '+1 Talent. If this Queen wins a Lip Sync based on Talent, the opponent\'s Queen gets 1 Shade Token.',
    trigger: PowerTriggers.ON_LIP_SYNC_WIN,
    effect: PowerEffects.MODIFY_SHADE,
    target: PowerTargets.OPPONENT_QUEENS,
    cost: PowerCosts.NONE,
    value: 1,
    condition: (gameState, context) => {
      return gameState.lipSyncCategory === 'Talent';
    }
  }),

  PADDING_PERFECTION: new Power({
    id: 'PADDING_PERFECTION',
    name: 'Padding Perfection',
    description: '+2 Nerve. This Queen can hold 4 Shade Tokens before being Read for Filth.',
    trigger: PowerTriggers.ON_EQUIPMENT_ATTACH,
    effect: PowerEffects.MODIFY_STAT,
    target: PowerTargets.SELF,
    cost: PowerCosts.NONE,
    value: { nerve: 2 },
    isPassive: true
  }),

  GAG_WORTHY_FAN: new Power({
    id: 'GAG_WORTHY_FAN',
    name: 'Gag-Worthy Fan',
    description: 'Activate during your Werk Room Phase: Pay 1 Gag Token. Draw 1 card.',
    trigger: PowerTriggers.ON_ACTIVATE,
    effect: PowerEffects.DRAW_CARDS,
    target: PowerTargets.OWNER,
    cost: PowerCosts.GAG,
    value: 1,
    condition: (gameState, context) => {
      return gameState.currentPhase === 'WERK_ROOM' && 
             gameState[context.owner].gagTokens >= 1;
    }
  }),

  TUCK_EVERLASTING_TAPE: new Power({
    id: 'TUCK_EVERLASTING_TAPE',
    name: 'The Tuck Everlasting Tape',
    description: '+1 Uniqueness. Once per game, prevent 1 Shade Token from being placed on this Queen.',
    trigger: PowerTriggers.ON_SHADE,
    effect: PowerEffects.PREVENT_EFFECT,
    target: PowerTargets.SELF,
    cost: PowerCosts.NONE,
    value: 'shade',
    condition: (gameState, context) => {
      return !context.powerUsed;
    }
  }),

  STATEMENT_NECKLACE: new Power({
    id: 'STATEMENT_NECKLACE',
    name: 'Statement Necklace of Nerve',
    description: '+3 Nerve. Opponent\'s abilities cannot reduce this Queen\'s Nerve stat.',
    trigger: PowerTriggers.ON_EQUIPMENT_ATTACH,
    effect: PowerEffects.MODIFY_STAT,
    target: PowerTargets.SELF,
    cost: PowerCosts.NONE,
    value: { nerve: 3 },
    isPassive: true
  }),

  GLITTER_BOMB_MAKEUP: new Power({
    id: 'GLITTER_BOMB_MAKEUP',
    name: 'Glitter Bomb Makeup Kit',
    description: '+1 Charisma, +1 Uniqueness. When this card is played, you may remove 1 Shade Token from this Queen.',
    trigger: PowerTriggers.ON_EQUIPMENT_ATTACH,
    effect: PowerEffects.MODIFY_SHADE,
    target: PowerTargets.SELF,
    cost: PowerCosts.NONE,
    value: -1
  }),

  SLEEK_BOB_WIG: new Power({
    id: 'SLEEK_BOB_WIG',
    name: 'The Sleek Bob Wig',
    description: '+1 Charisma. If the Lip Sync category is Charisma, gain an additional +1 Performance Score.',
    trigger: PowerTriggers.ON_LIP_SYNC_START,
    effect: PowerEffects.MODIFY_DAMAGE,
    target: PowerTargets.BATTLE,
    cost: PowerCosts.NONE,
    value: 1,
    condition: (gameState, context) => {
      return gameState.lipSyncCategory === 'Charisma';
    }
  }),

  AVANT_GARDE_SILHOUETTE: new Power({
    id: 'AVANT_GARDE_SILHOUETTE',
    name: 'Avant-Garde Silhouette',
    description: '+3 Uniqueness. Opponent cannot play Prop accessories on their Queen during their next turn.',
    trigger: PowerTriggers.ON_EQUIPMENT_ATTACH,
    effect: PowerEffects.MODIFY_TARGETING,
    target: PowerTargets.OPPONENT,
    cost: PowerCosts.NONE,
    value: { restrictedTypes: ['Prop'] },
    duration: 1
  }),

  GLAMAZON_GOWN: new Power({
    id: 'GLAMAZON_GOWN',
    name: 'The Glamazon Gown',
    description: '+2 Charisma. When this Queen wins a Lip Sync, gain 1 Gag Token.',
    trigger: PowerTriggers.ON_LIP_SYNC_WIN,
    effect: PowerEffects.GAIN_GAG,
    target: PowerTargets.OWNER,
    cost: PowerCosts.NONE,
    value: 1
  }),

  READING_RAINBOW_WIG: new Power({
    id: 'READING_RAINBOW_WIG',
    name: 'The Reading Rainbow Wig',
    description: '+1 Nerve. When this Queen is Read for Filth, reduce the Shade Tokens gained by 1.',
    trigger: PowerTriggers.ON_SHADE,
    effect: PowerEffects.MODIFY_SHADE,
    target: PowerTargets.SELF,
    cost: PowerCosts.NONE,
    value: -1
  }),

  DEATH_DROP_BOOTS: new Power({
    id: 'DEATH_DROP_BOOTS',
    name: 'The Death Drop Boots',
    description: '+2 Talent. During a Lip Sync, if this Queen\'s Talent is higher than the opponent\'s, gain +2 to the Performance Score.',
    trigger: PowerTriggers.ON_LIP_SYNC_START,
    effect: PowerEffects.MODIFY_DAMAGE,
    target: PowerTargets.BATTLE,
    cost: PowerCosts.NONE,
    value: 2,
    condition: (gameState, context) => {
      const opponentQueen = context.battle.defender;
      return context.queen.talent > opponentQueen.talent;
    }
  }),

  CROWN_JEWEL_TIARA: new Power({
    id: 'CROWN_JEWEL_TIARA',
    name: 'The Crown Jewel Tiara',
    description: '+1 to all stats. This Queen cannot be eliminated by Lip Sync losses.',
    trigger: PowerTriggers.ON_EQUIPMENT_ATTACH,
    effect: PowerEffects.MODIFY_STAT,
    target: PowerTargets.SELF,
    cost: PowerCosts.NONE,
    value: { charisma: 1, uniqueness: 1, nerve: 1, talent: 1 },
    isPassive: true
  }),

  GAG_REFLEX_MAKEUP: new Power({
    id: 'GAG_REFLEX_MAKEUP',
    name: 'The Gag Reflex Makeup Kit',
    description: '+1 Charisma. When this Queen is Read for Filth, you may discard a card from your hand to prevent gaining Shade Tokens.',
    trigger: PowerTriggers.ON_SHADE,
    effect: PowerEffects.PREVENT_EFFECT,
    target: PowerTargets.SELF,
    cost: PowerCosts.DISCARD,
    value: 'shade',
    condition: (gameState, context) => {
      return gameState[context.owner].hand.length > 0;
    }
  })
};

// Register all powers
Object.values(QueenPowers).forEach(power => {
  powerRegistry.register(power);
});

Object.values(EquipmentPowers).forEach(power => {
  powerRegistry.register(power);
});

// Export power system utilities
export const powerSystem = {
  Power,
  PowerRegistry,
  PowerTriggers,
  PowerEffects,
  PowerTargets,
  PowerCosts,
  powerRegistry,
  QueenPowers,
  EquipmentPowers
};

export default powerSystem; 