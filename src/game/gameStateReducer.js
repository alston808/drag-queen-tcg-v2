// src/game/gameStateReducer.js
import { ActionTypes, PHASES, PLAYER1_ID, PLAYER2_ID, MAX_GAG_TOKENS, MAX_HAND_SIZE, SHADE_LIMIT, STARTING_SHANTAY_POINTS, STARTING_GAG_TOKENS, STARTING_HAND_SIZE, MAX_RUNWAY_QUEENS } from './constants';
import { shuffle } from '../utils/helpers';

let cardInstanceId = 0; 
const createCardInstance = (cardData) => ({
  ...cardData,
  instanceId: cardInstanceId++,
  shadeTokens: 0,
  equipment: [], 
  canAttack: false,      
  effects: [],          
  originalStats: {
    charisma: cardData.charisma,
    uniqueness: cardData.uniqueness,
    nerve: cardData.nerve,
    talent: cardData.talent,
  }
});

const EMPTY_STATS = { charisma: 0, uniqueness: 0, nerve: 0, talent: 0 };
const NUM_SLOTS = 3;

function createEmptySlot() {
  return { queen: null, stats: { ...EMPTY_STATS }, equipment: [] };
}

export const initialState = {
  player1: {
    id: PLAYER1_ID,
    name: 'Player 1',
    shantayPoints: STARTING_SHANTAY_POINTS,
    gagTokens: STARTING_GAG_TOKENS,
    deck: [],
    hand: [],
    discard: [],
    runwaySlots: Array(NUM_SLOTS).fill(0).map(createEmptySlot),
  },
  player2: {
    id: PLAYER2_ID,
    name: 'CPU',
    shantayPoints: STARTING_SHANTAY_POINTS,
    gagTokens: STARTING_GAG_TOKENS,
    deck: [],
    hand: [],
    discard: [],
    runwaySlots: Array(NUM_SLOTS).fill(0).map(createEmptySlot),
  },
  currentTurn: null,
  currentPhase: null,
  turnNumber: 0,
  winner: null,
  selectedAttacker: null,
  selectedDefender: null,
  lipSyncCategory: null,
  lipSyncResult: null,
  gameLog: [],
  allQueensData: [],
  allEquipmentData: [],
};

function findSlotByQueen(runwaySlots, queenInstanceId) {
  return runwaySlots.find(slot => slot.queen && slot.queen.instanceId === queenInstanceId);
}
function findFirstEmptySlot(runwaySlots) {
  return runwaySlots.find(slot => !slot.queen);
}
function applyEquipmentBoosts(slot, equipment, sign = 1) {
  if (equipment.stat_boost) {
    for (const boost of equipment.stat_boost) {
      slot.stats[boost.stat] += sign * boost.value;
    }
  }
}

const checkWinCondition = (stateToCheck) => {
    if (!stateToCheck || stateToCheck.winner) return stateToCheck?.winner;
    let winner = null;
    if (stateToCheck.player1?.shantayPoints <= 0) winner = PLAYER2_ID;
    else if (stateToCheck.player2?.shantayPoints <= 0) winner = PLAYER1_ID;
    return winner;
};

// Generalized equipment effect handler
function applyEquipmentEffects({ draft, phase, event, context, log, targetQueen }) {
  if (targetQueen) {
    if (!targetQueen.equipment) return;
    targetQueen.equipment.forEach(equipment => {
      // Check if this effect should trigger now
      if (
        (equipment.effect_phase && equipment.effect_phase === phase) ||
        (equipment.effect_trigger && equipment.effect_trigger === event) ||
        (equipment.effect_phase === 'always')
      ) {
        // Check conditions
        let conditionMet = true;
        if (equipment.effect_condition) {
          if (equipment.effect_condition.category && context?.category !== equipment.effect_condition.category) {
            conditionMet = false;
          }
          if (equipment.effect_condition.stat_compare) {
            const stat = equipment.effect_condition.stat_compare;
            const relation = equipment.effect_condition.relation;
            const target = equipment.effect_condition.target;
            let compareValue = 0;
            // For single queen, we can't compare to opponent, so skip
            if (relation === '>' && !(targetQueen[stat] > compareValue)) conditionMet = false;
            // Add more relations as needed
          }
        }
        if (!conditionMet) return;

        // Add/remove stat or token
        if (equipment.effect_action === 'add' && equipment.effect_stat && equipment.effect_value) {
          if (equipment.effect_target === 'self') {
            if (targetQueen[equipment.effect_stat] !== undefined) {
              targetQueen[equipment.effect_stat] += equipment.effect_value;
              log && log(`${targetQueen.queen_name} gains ${equipment.effect_value} ${equipment.effect_stat} from ${equipment.card_name}.`);
            }
          }
        }

        // Performance score
        if (equipment.effect_stat === 'performance_score' && context) {
          if (equipment.effect_target === 'self') {
            context.performanceScore = (context.performanceScore || 0) + equipment.effect_value;
            log && log(`${targetQueen.queen_name} gains ${equipment.effect_value} performance score from ${equipment.card_name}.`);
          }
        }

        // Resource gain/loss
        if (equipment.effect_stat === 'gag' && equipment.effect_action === 'add') {
          // Only applies to the owner, so you may want to pass player as context if needed
        }

        // Prevention/interception (e.g., prevent elimination, prevent shade)
        if (equipment.effect_action === 'prevent' && context) {
          context.prevented = true;
          log && log(`${targetQueen.queen_name} prevents ${equipment.effect_stat} from ${equipment.card_name}.`);
        }

        // Mark for player input if needed (e.g., discard to prevent)
        if (equipment.effect_action === 'prevent' && equipment.effect_trigger === 'discard_card') {
          context.pendingPlayerInput = true;
          log && log(`${targetQueen.queen_name} may discard a card to prevent ${equipment.effect_stat} from ${equipment.card_name}.`);
        }
      }
    });
    return;
  }
  [draft.player1, draft.player2].forEach((player, idx, arr) => {
    if (!player || !player.runway) return;
    const opponent = arr[1 - idx];
    player.runway.forEach(queen => {
      if (!queen.equipment) return;
      queen.equipment.forEach(equipment => {
        // Check if this effect should trigger now
        if (
          (equipment.effect_phase && equipment.effect_phase === phase) ||
          (equipment.effect_trigger && equipment.effect_trigger === event) ||
          (equipment.effect_phase === 'always')
        ) {
          // Check conditions
          let conditionMet = true;
          if (equipment.effect_condition) {
            if (equipment.effect_condition.category && context?.category !== equipment.effect_condition.category) {
              conditionMet = false;
            }
            if (equipment.effect_condition.stat_compare) {
              const stat = equipment.effect_condition.stat_compare;
              const relation = equipment.effect_condition.relation;
              const target = equipment.effect_condition.target;
              let compareValue = 0;
              if (target === 'opponent' && opponent && opponent.runway.length > 0) {
                compareValue = Math.max(...opponent.runway.map(q => q[stat] || 0));
              }
              if (relation === '>' && !(queen[stat] > compareValue)) conditionMet = false;
              // Add more relations as needed
            }
          }
          if (!conditionMet) return;

          // Add/remove stat or token
          if (equipment.effect_action === 'add' && equipment.effect_stat && equipment.effect_value) {
            if (equipment.effect_target === 'self') {
              if (queen[equipment.effect_stat] !== undefined) {
                queen[equipment.effect_stat] += equipment.effect_value;
                log && log(`${queen.queen_name} gains ${equipment.effect_value} ${equipment.effect_stat} from ${equipment.card_name}.`);
              }
            } else if (equipment.effect_target === 'opponent' && opponent) {
              opponent.runway.forEach(oppQueen => {
                if (oppQueen[equipment.effect_stat] !== undefined) {
                  oppQueen[equipment.effect_stat] += equipment.effect_value;
                  log && log(`${oppQueen.queen_name} gains ${equipment.effect_value} ${equipment.effect_stat} from ${equipment.card_name} (opponent effect).`);
                }
              });
            }
          }

          // Performance score
          if (equipment.effect_stat === 'performance_score' && context) {
            if (equipment.effect_target === 'self') {
              context.performanceScore = (context.performanceScore || 0) + equipment.effect_value;
              log && log(`${queen.queen_name} gains ${equipment.effect_value} performance score from ${equipment.card_name}.`);
            } else if (equipment.effect_target === 'opponent') {
              context.opponentPerformanceScore = (context.opponentPerformanceScore || 0) + equipment.effect_value;
              log && log(`Opponent gains ${equipment.effect_value} performance score from ${equipment.card_name}.`);
            }
          }

          // Resource gain/loss
          if (equipment.effect_stat === 'gag' && equipment.effect_action === 'add') {
            player.gagTokens += equipment.effect_value;
            log && log(`${player.name} gains ${equipment.effect_value} Gag from ${equipment.card_name}.`);
          }

          // Prevention/interception (e.g., prevent elimination, prevent shade)
          if (equipment.effect_action === 'prevent' && context) {
            context.prevented = true;
            log && log(`${queen.queen_name} prevents ${equipment.effect_stat} from ${equipment.card_name}.`);
          }

          // Mark for player input if needed (e.g., discard to prevent)
          if (equipment.effect_action === 'prevent' && equipment.effect_trigger === 'discard_card') {
            context.pendingPlayerInput = true;
            log && log(`${queen.queen_name} may discard a card to prevent ${equipment.effect_stat} from ${equipment.card_name}.`);
          }
        }
      });
    });
  });
}

// Helper to get dynamic shade limit for a queen
function getShadeLimitForQueen(queen, player, opponent) {
  let limit = SHADE_LIMIT;
  // Equipment: Padding Perfection
  if (queen.equipment) {
    for (const eq of queen.equipment) {
      if (eq.effect_text && eq.effect_text.toLowerCase().includes('can hold 4 shade tokens')) {
        limit = Math.max(limit, 4);
      }
    }
  }
  // Opponent global: Kerri Colby
  if (opponent && opponent.runway) {
    for (const oppQueen of opponent.runway) {
      if (
        oppQueen.queen_name === 'Kerri Colby' &&
        oppQueen.equipment &&
        oppQueen.equipment.some(eq => eq.effect_text && eq.effect_text.toLowerCase().includes('need 1 additional shade token'))
      ) {
        limit += 1;
      }
      // Some versions of Kerri Colby may not require equipment
      if (
        oppQueen.queen_name === 'Kerri Colby' &&
        oppQueen.special_power_text &&
        oppQueen.special_power_text.toLowerCase().includes('need 1 additional shade token')
      ) {
        limit += 1;
      }
    }
  }
  return limit;
}

export function gameStateReducer(state, action) {
  console.log('[gameStateReducer] Action:', action.type, action.payload ? 'with payload' : 'no payload');

  if (!state) {
    console.log('[gameStateReducer] No state provided, using initialState');
    return initialState;
  }

  if (!action || !action.type) {
    console.error("gameStateReducer: Received invalid action:", action);
    return state;
  }

  const draft = JSON.parse(JSON.stringify(state));
  const log = (message, level = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    draft.gameLog = [logMessage, ...draft.gameLog].slice(0, 50);
    
    // Log to console with appropriate level
    switch(level) {
      case 'error':
        console.error(`[REDUCER_LOG] ${message}`);
        break;
      case 'warn':
        console.warn(`[REDUCER_LOG] ${message}`);
        break;
      case 'debug':
        console.debug(`[REDUCER_LOG] ${message}`);
        break;
      default:
        console.log(`[REDUCER_LOG] ${message}`);
    }
  };

  // Move checkElimination here so it can access draft
  const checkElimination = (playerId, queenInstanceId) => {
    if (!playerId || !queenInstanceId) {
      log(`Invalid checkElimination call: playerId=${playerId}, queenInstanceId=${queenInstanceId}`, 'error');
      return;
    }
    const player = draft[playerId];
    const opponent = draft[playerId === PLAYER1_ID ? PLAYER2_ID : PLAYER1_ID];
    if (!player) {
      log(`Player ${playerId} not found during elimination check`, 'error');
      return;
    }
    if (!player.runway) {
      log(`Player ${playerId} has no runway during elimination check`, 'error');
      return;
    }
    const queenIndex = player.runway.findIndex(q => q.instanceId === queenInstanceId);
    if (queenIndex === -1) {
      log(`Queen ${queenInstanceId} not found in ${playerId}'s runway during elimination check`, 'warn');
      return;
    }
    const queen = player.runway[queenIndex];
    const shadeLimit = getShadeLimitForQueen(queen, player, opponent);
    if (queen.shadeTokens >= shadeLimit) {
      const eliminatedQueen = player.runway.splice(queenIndex, 1)[0];
      player.discard.push(eliminatedQueen);
      // Sync runwaySlots
      const slot = findSlotByQueen(player.runwaySlots, queen.instanceId);
      if (slot) slot.queen = null;
      log(`${eliminatedQueen.queen_name} is Read for Filth and sashays away!`);
    }
  };

  switch (action.type) {
    case ActionTypes.INITIALIZE_GAME: {
      const { queens, equipment } = action.payload;
      console.log('[gameStateReducer] INITIALIZE_GAME:', {
        hasQueens: !!queens,
        queensLength: queens?.length,
        hasEquipment: !!equipment,
        equipmentLength: equipment?.length
      });

      if (!queens || !equipment) {
        console.error('[gameStateReducer] Initialize game failed: Missing queens or equipment data');
        return state;
      }

      console.log('[gameStateReducer] Initializing New Game...');
      cardInstanceId = 0; 
      draft.allQueensData = queens;
      draft.allEquipmentData = equipment;
      const allQueenInstances = queens.map(q => createCardInstance({...q}));
      const allEquipmentInstances = equipment.map(eq => createCardInstance({...eq, cardType: 'Equipment'})); 
      const combinedPlayableCards = [...allQueenInstances, ...allEquipmentInstances];
      const p1DeckSize = Math.min(Math.floor(combinedPlayableCards.length / 2), 20); 
      const p2DeckSize = Math.min(combinedPlayableCards.length - p1DeckSize, 20);
      const shuffledPlayableCards = shuffle([...combinedPlayableCards]);
      const p1Deck = shuffledPlayableCards.slice(0, p1DeckSize);
      const p2Deck = shuffledPlayableCards.slice(p1DeckSize, p1DeckSize + p2DeckSize);
      const p1Hand = [];
      const p2Hand = [];
      for (let i = 0; i < STARTING_HAND_SIZE; i++) {
        if (p1Deck.length > 0) p1Hand.push(p1Deck.pop());
        if (p2Deck.length > 0) p2Hand.push(p2Deck.pop());
      }
      draft.player1 = { id: PLAYER1_ID, name: 'Player 1', shantayPoints: STARTING_SHANTAY_POINTS, gagTokens: STARTING_GAG_TOKENS, deck: p1Deck, hand: p1Hand, runway: [], discard: [] };
      draft.player2 = { id: PLAYER2_ID, name: 'CPU', shantayPoints: STARTING_SHANTAY_POINTS, gagTokens: STARTING_GAG_TOKENS, deck: p2Deck, hand: p2Hand, runway: [], discard: [] };
      draft.currentTurn = PLAYER1_ID;
      draft.currentPhase = PHASES.SPILL_THE_TEA;
      draft.turnNumber = 1;
      draft.winner = null;
      draft.selectedAttacker = null; 
      draft.selectedDefender = null;
      draft.lipSyncCategory = null;
      draft.lipSyncResult = null;
      draft.gameLog = [`Game Started! Turn 1: Player 1 - ${PHASES.SPILL_THE_TEA}`];
      log(`Init complete. P1 starts. P1 Deck: ${p1Deck.length}, P2 Deck: ${p2Deck.length}`);

      console.log('[gameStateReducer] Game initialized:', {
        player1: !!draft.player1,
        player2: !!draft.player2,
        currentTurn: draft.currentTurn,
        currentPhase: draft.currentPhase
      });

      draft.player1.runwaySlots = Array(NUM_SLOTS).fill(0).map(createEmptySlot);
      draft.player2.runwaySlots = Array(NUM_SLOTS).fill(0).map(createEmptySlot);

      return draft;
    }

    case ActionTypes.GAIN_GAG: { /* ... no changes ... */ 
        const { playerId, amount } = action.payload;
        const player = draft[playerId];
        if (player) { 
            const newGag = Math.min(player.gagTokens + amount, MAX_GAG_TOKENS); 
            if (newGag > player.gagTokens) { 
                log(`${player.name} gains ${newGag - player.gagTokens} Gag (${newGag}).`); 
                player.gagTokens = newGag; 
            } else { 
                log(`${player.name} at max Gag (${player.gagTokens}).`); 
            }
        }
        return draft;
    }
    case ActionTypes.DRAW_CARD: { /* ... no changes ... */ 
        const { playerId } = action.payload;
        const player = draft[playerId];
        if (player) { 
            if (player.deck.length > 0) { 
                if (player.hand.length < MAX_HAND_SIZE) { 
                    const card = player.deck.pop(); 
                    if (card) { 
                        player.hand.push(card); 
                        log(`${player.name} draws (${card.card_name || card.queen_name || 'Card'}). Hand: ${player.hand.length}`); 
                    } else { 
                        log(`${player.name} draw attempt failed (card undefined from deck).`); 
                    } 
                } else { 
                    log(`${player.name} hand full, cannot draw.`); 
                } 
            } else { 
                log(`${player.name} deck empty! Cannot draw.`); 
            } 
        }
        return draft;
    }
     case ActionTypes.PLAY_QUEEN_CARD: {
        const { playerId, cardInstanceId } = action.payload;
        console.log('[REDUCER] PLAY_QUEEN_CARD:', { playerId, cardInstanceId, playerHand: draft[playerId]?.hand?.map(c => c.instanceId), playerRunway: draft[playerId]?.runway?.map(q => q.instanceId), gagTokens: draft[playerId]?.gagTokens, currentPhase: draft.currentPhase, currentTurn: draft.currentTurn });
        if (!playerId || !cardInstanceId) {
          log(`[DEBUG] Invalid PLAY_QUEEN_CARD action: playerId=${playerId}, cardInstanceId=${cardInstanceId}`, 'error');
          return state;
        }

        const player = draft[playerId];
        if (!player) {
          log(`[DEBUG] Play Error: Player ${playerId} not found. State:`, 'error');
          console.log('[DEBUG] Current draft:', draft);
          return draft;
        }
        if (draft.currentPhase !== PHASES.WERK_ROOM) {
          log(`[DEBUG] Play Fail: Not in Werk Room phase (Current: ${draft.currentPhase}).`, 'warn');
          return draft;
        }
        if (draft.currentTurn !== playerId) {
          log(`[DEBUG] Play Fail: Not ${playerId}'s turn. Current turn: ${draft.currentTurn}`, 'warn');
          return draft;
        }
        const cardIndexInHand = player.hand.findIndex(c => c.instanceId === cardInstanceId);
        if (cardIndexInHand === -1) {
          log(`[DEBUG] Play Error: Card ${cardInstanceId} not in ${playerId}'s hand. Hand: ${player.hand.map(c => c.instanceId)}`);
          return draft;
        }
        const cardToPlay = player.hand[cardIndexInHand];
        const cardName = cardToPlay.queen_name || cardToPlay.card_name || `Card ${cardToPlay.card_id}`;
        if (typeof cardToPlay.charisma === 'undefined' || 
            typeof cardToPlay.uniqueness === 'undefined' || 
            typeof cardToPlay.nerve === 'undefined' || 
            typeof cardToPlay.talent === 'undefined') {
            log(`[DEBUG] Play Fail: ${cardName} is not a valid Queen card (missing C.U.N.T. stats). Card:`, cardToPlay);
            return draft;
        }
        if (player.gagTokens < cardToPlay.gag_cost) {
          log(`[DEBUG] Play Fail: ${cardName} needs ${cardToPlay.gag_cost} Gag (has ${player.gagTokens}).`, 'warn');
          return draft;
        }
        if (player.runway.length >= MAX_RUNWAY_QUEENS) {
          log(`[DEBUG] Play Fail: Runway full for ${player.name}. Runway: ${player.runway.map(q => q.instanceId)}`);
          return draft;
        }
        // Log before state
        console.log('[DEBUG] Before playing queen:', { hand: player.hand, runway: player.runway, gagTokens: player.gagTokens });
        player.gagTokens -= cardToPlay.gag_cost;
        const playedCard = player.hand.splice(cardIndexInHand, 1)[0];
        playedCard.canAttack = false; 
        player.runway.push(playedCard);
        // --- SYNC runwaySlots ---
        const emptySlot = findFirstEmptySlot(player.runwaySlots);
        if (emptySlot) {
          emptySlot.queen = playedCard;
        }
        log(`[DEBUG] ${player.name} plays ${playedCard.queen_name} (Cost: ${playedCard.gag_cost}). Gag tokens remaining: ${player.gagTokens}.`);
        // Log after state
        console.log('[DEBUG] After playing queen:', { hand: player.hand, runway: player.runway, gagTokens: player.gagTokens });
        return draft;
     }

     case ActionTypes.ADVANCE_PHASE: {
         if (draft.winner) return draft; 
         let nextPhase = draft.currentPhase;
         let nextTurn = draft.currentTurn;
         let nextTurnNumber = draft.turnNumber;
         const { selectedAttacker } = action.payload; 

         switch (draft.currentPhase) {
             case PHASES.SPILL_THE_TEA:
                 nextPhase = PHASES.WERK_ROOM;
                 break;
             case PHASES.WERK_ROOM:
                 // CPU auto-plays equipment at end of its Werk Room phase
                 if (draft.currentTurn === PLAYER2_ID) {
                     const cpu = draft[PLAYER2_ID];
                     // For each equipment in hand, try to play it on a queen
                     const equipmentCards = cpu.hand.filter(card => card.card_id?.startsWith('EQ'));
                     for (const eq of equipmentCards) {
                         // Find a queen without this equipment type
                         const targetQueen = cpu.runway.find(q => {
                             if (!q.equipment) q.equipment = [];
                             return q.equipment.filter(e => e.type === eq.type).length === 0;
                         });
                         if (targetQueen && cpu.gagTokens >= eq.gag_cost) {
                             // Simulate playing equipment
                             cpu.gagTokens -= eq.gag_cost;
                             cpu.hand = cpu.hand.filter(card => card.instanceId !== eq.instanceId);
                             // Apply stat bonuses using stat_boost array only
                             if (eq.stat_boost) {
                               for (const boost of eq.stat_boost) {
                                 if (typeof targetQueen[boost.stat] === 'number') {
                                   targetQueen[boost.stat] += boost.value;
                                 }
                               }
                             }
                             // Add equipment instance
                             const equipmentInstance = {
                                 ...eq,
                                 instanceId: `${eq.card_id}-${Date.now()}`,
                                 appliedEffects: []
                             };
                             targetQueen.equipment.push(equipmentInstance);
                             log(`CPU auto-equipped ${eq.card_name} to ${targetQueen.queen_name}`);
                         }
                     }
                 }
                 const currentPlayerRunway = draft[draft.currentTurn]?.runway;
                 const readyQueens = currentPlayerRunway?.filter(q => q.canAttack);
                 if (readyQueens?.length > 0) {
                     nextPhase = PHASES.LIP_SYNC_SELECT_ATTACKER;
                 } else {
                     log(`${draft[draft.currentTurn]?.name} has no Queens ready to Lip Sync. Skipping to Untuck.`);
                     nextPhase = PHASES.UNTUCK;
                 }
                 break;
             case PHASES.LIP_SYNC_SELECT_ATTACKER:
                 const opponentId = draft.currentTurn === PLAYER1_ID ? PLAYER2_ID : PLAYER1_ID;
                 if (!selectedAttacker) { 
                     // CLARIFIED LOG: Distinguish between player choosing to skip vs. CPU skipping
                     if (draft.currentTurn === PLAYER1_ID) {
                        log(`Player 1 chose not to initiate a Lip Sync.`);
                     } else {
                        log(`CPU (${draft[PLAYER2_ID]?.name}) skipped attacker selection (no ready queens or chose to skip).`);
                     }
                     nextPhase = PHASES.UNTUCK;
                 } else if (draft[opponentId]?.runway.length > 0) { 
                     nextPhase = PHASES.LIP_SYNC_SELECT_DEFENDER;
                 } else { 
                     log(`${draft[opponentId]?.name} has no Queens on the runway. ${draft[draft.currentTurn]?.name} performs solo!`);
                     draft.selectedDefender = null; 
                     nextPhase = PHASES.LIP_SYNC_REVEAL;
                 }
                 break;
             case PHASES.LIP_SYNC_SELECT_DEFENDER:
                 nextPhase = PHASES.LIP_SYNC_REVEAL;
                 break;
             case PHASES.LIP_SYNC_REVEAL:
                 nextPhase = PHASES.LIP_SYNC_RESOLUTION;
                 break;
             case PHASES.LIP_SYNC_RESOLUTION:
                 nextPhase = PHASES.UNTUCK;
                 break;
             case PHASES.UNTUCK:
                 nextTurn = draft.currentTurn === PLAYER1_ID ? PLAYER2_ID : PLAYER1_ID;
                 if (nextTurn === PLAYER1_ID) { 
                     nextTurnNumber++;
                 }
                 nextPhase = PHASES.SPILL_THE_TEA;
                 draft.selectedAttacker = null;
                 draft.selectedDefender = undefined;
                 draft.lipSyncCategory = null;
                 draft.lipSyncResult = null;

                 // Apply all start-of-turn and always equipment effects
                 applyEquipmentEffects({ draft, phase: 'start_of_turn', event: null, context: {}, log });
                 break;
             default:
                 log(`Cannot advance from phase: ${draft.currentPhase}`);
                 break;
         }

         if (nextPhase !== draft.currentPhase || nextTurn !== draft.currentTurn) {
             log(`Reducer advancing to: ${nextPhase}${nextTurn !== draft.currentTurn ? ` | Turn: ${nextTurnNumber} (${draft[nextTurn]?.name})` : ''}`);
             draft.currentPhase = nextPhase;
             draft.currentTurn = nextTurn;
             draft.turnNumber = nextTurnNumber;
         } else {
             // log(`Reducer: No phase change from ${draft.currentPhase}.`);
         }
         return draft;
     }

     case ActionTypes.SELECT_ATTACKER: { /* ... no changes ... */ 
         const { queenInstanceId } = action.payload;
         const player = draft[draft.currentTurn];
         if (queenInstanceId === null) { 
             draft.selectedAttacker = null;
             // Log moved to ADVANCE_PHASE for clarity on who skipped
         } else {
             const queen = player?.runway.find(q => q.instanceId === queenInstanceId);
             if (queen && queen.canAttack) {
                 draft.selectedAttacker = queenInstanceId;
                 log(`${player.name} selects ${queen.queen_name} to Lip Sync!`);
             } else {
                 log(`Cannot select ${queen?.queen_name || 'selected Queen'} as attacker. Not ready or not found.`);
                 draft.selectedAttacker = null; 
             }
         }
         return draft;
     }
     case ActionTypes.SELECT_DEFENDER: { /* ... no changes ... */ 
         const { queenInstanceId } = action.payload;
         const attackerPlayerId = draft.currentTurn;
         const defenderPlayerId = attackerPlayerId === PLAYER1_ID ? PLAYER2_ID : PLAYER1_ID;
         const defendingPlayer = draft[defenderPlayerId];

         if (queenInstanceId === null) { 
             draft.selectedDefender = null; // Explicitly null if no defender (e.g. empty runway)
             log(`${defendingPlayer.name} has no defender for this Lip Sync.`);
         } else {
             const queen = defendingPlayer?.runway.find(q => q.instanceId === queenInstanceId);
             if (queen) {
                 draft.selectedDefender = queenInstanceId;
                 log(`${defendingPlayer.name}'s ${queen.queen_name} is selected to defend!`);
             } else {
                 log(`Cannot select ${queen?.queen_name || 'selected Queen'} as defender for ${defendingPlayer.name}. Not found.`);
                 draft.selectedDefender = null; // Default to null if selection fails
             }
         }
         return draft;
     }
     case ActionTypes.SET_LIP_SYNC_CATEGORY: { /* ... no changes ... */ 
         draft.lipSyncCategory = action.payload.category;
         log(`The Lip Sync category is... ${draft.lipSyncCategory}!`);
         return draft;
     }
     case ActionTypes.RESOLVE_LIP_SYNC: {
        const { winner, damage, attackerShade, defenderShade } = action.payload;
        let finalAttackerScore = action.payload.attackerScore;
        let finalDefenderScore = action.payload.defenderScore;
        
        const attacker = draft[state.currentTurn];
        const defender = draft[state.currentTurn === PLAYER1_ID ? PLAYER2_ID : PLAYER1_ID];
        const attackerQueen = attacker.runway.find(q => q.instanceId === state.selectedAttacker);
        const defenderQueen = defender.runway.find(q => q.instanceId === state.selectedDefender);

        // Prepare context for performance score effects
        const context = {
          category: draft.lipSyncCategory,
          performanceScore: finalAttackerScore,
          opponentPerformanceScore: finalDefenderScore
        };
        // Apply equipment effects for both queens (attacker and defender)
        applyEquipmentEffects({ draft, phase: 'lip_sync', event: null, context, log, targetQueen: attackerQueen });
        applyEquipmentEffects({ draft, phase: 'lip_sync', event: null, context, log, targetQueen: defenderQueen });
        finalAttackerScore = context.performanceScore;
        finalDefenderScore = context.opponentPerformanceScore;

        // Update the draft state with the final scores
        draft.lipSyncResult = {
            attackerScore: finalAttackerScore,
            defenderScore: finalDefenderScore,
            winner,
            damage,
            attackerShade,
            defenderShade
        };

        // Apply damage and shade tokens based on winner
        if (winner === state.currentTurn) {
            if (defenderQueen) {
                const hasCrownJewel = defenderQueen.equipment?.some(eq => 
                    eq.effect_text.toLowerCase().includes('this queen cannot be eliminated by lip sync losses')
                );
                if (!hasCrownJewel) {
                    defenderQueen.shadeTokens += defenderShade;
                    checkElimination(defender.id, defenderQueen.instanceId);
                } else {
                    log(`${defenderQueen.queen_name} is protected by the Crown Jewel Tiara!`, 'info');
                }
            }
            defender.shantayPoints = Math.max(0, defender.shantayPoints - damage);
            log(`${defender.name} loses ${damage} Shantay Points! (${defender.shantayPoints} remaining)`, 'info');
        } else if (winner !== 'tie') {
            if (attackerQueen) {
                const hasCrownJewel = attackerQueen.equipment?.some(eq => 
                    eq.effect_text.toLowerCase().includes('this queen cannot be eliminated by lip sync losses')
                );
                if (!hasCrownJewel) {
                    attackerQueen.shadeTokens += attackerShade;
                    checkElimination(attacker.id, attackerQueen.instanceId);
                } else {
                    log(`${attackerQueen.queen_name} is protected by the Crown Jewel Tiara!`, 'info');
                }
            }
            attacker.shantayPoints = Math.max(0, attacker.shantayPoints - damage);
            log(`${attacker.name} loses ${damage} Shantay Points! (${attacker.shantayPoints} remaining)`, 'info');
        }

        // Check for game over condition
        if (defender.shantayPoints <= 0 || attacker.shantayPoints <= 0) {
            const winnerId = defender.shantayPoints <= 0 ? state.currentTurn : (state.currentTurn === PLAYER1_ID ? PLAYER2_ID : PLAYER1_ID);
            draft.winner = winnerId;
            log(`Game Over! ${draft[winnerId].name} wins!`, 'info');
        }

        return draft;
     }
     case ActionTypes.RESET_LIP_SYNC_STATE: { /* ... no changes ... */ 
         draft.selectedAttacker = null;
         draft.selectedDefender = undefined; // Reset to undefined
         draft.lipSyncCategory = null;
         draft.lipSyncResult = null;
         log('Resetting Lip Sync state explicitly.');
         return draft;
     }
     case ActionTypes.DISCARD_TO_HAND_SIZE: { /* ... no changes ... */ 
         const { playerId } = action.payload;
         const player = draft[playerId];
         if (player && player.hand.length > MAX_HAND_SIZE) {
             const cardsToDiscardCount = player.hand.length - MAX_HAND_SIZE;
             const discardedCards = player.hand.splice(0, cardsToDiscardCount);
             player.discard.push(...discardedCards);
             log(`${player.name} discards ${cardsToDiscardCount} card(s) to meet hand size. Discarded: ${discardedCards.map(c=>c.card_name || c.queen_name).join(', ')}.`);
         }
         return draft;
     }
     case ActionTypes.PREPARE_QUEENS_FOR_NEXT_TURN: { /* ... no changes ... */ 
         const { playerId } = action.payload; 
         const player = draft[playerId];
         if (player) {
             player.runway.forEach(q => {
                 q.canAttack = true;
                 log(`${q.queen_name} is now ready to sissy that walk (can attack next turn).`);
             });
             if (player.runwaySlots) {
                 player.runwaySlots.forEach(slot => {
                     if (slot.queen) {
                         slot.queen.canAttack = true;
                     }
                 });
             }
         }
         return draft;
     }
     case ActionTypes.SET_GAME_OVER: { /* ... no changes ... */ 
         const { winnerId } = action.payload;
         if (!draft.winner) { 
            draft.winner = winnerId;
            draft.currentPhase = PHASES.GAME_OVER;
            log(`Game Over explicitly set! Winner: ${draft[winnerId]?.name || winnerId}!`);
         }
         return draft;
     }
     case ActionTypes.PLAY_EQUIPMENT_CARD: {
       const { playerId, cardInstanceId, targetQueenInstanceId } = action.payload;
       const player = draft[playerId];
       
       if (!player || state.currentPhase !== PHASES.WERK_ROOM) {
         log('Cannot play equipment: Invalid player or not Werk Room phase', 'warn');
         return draft;
       }

       const equipment = player.hand.find(card => card.instanceId === cardInstanceId);
       if (!equipment) {
         log('Cannot play equipment: Card not found in hand', 'warn');
         return draft;
       }

       if (player.gagTokens < equipment.gag_cost) {
         log(`Play Fail: ${equipment.card_name} needs ${equipment.gag_cost} Gag (has ${player.gagTokens}).`, 'warn');
         return draft;
       }

       const targetQueen = player.runway.find(q => q.instanceId === targetQueenInstanceId);
       if (!targetQueen) {
         log('Cannot play equipment: Target queen not found', 'warn');
         return draft;
       }

       // Initialize equipment array if it doesn't exist
       if (!targetQueen.equipment) {
         targetQueen.equipment = [];
       }

       // Check for equipment type limits
       const existingEquipmentOfType = targetQueen.equipment.filter(eq => eq.type === equipment.type);
       if (existingEquipmentOfType.length >= 1) {
         log(`Cannot play equipment: Queen already has a ${equipment.type}`, 'warn');
         return draft;
       }

       // Actually attach the equipment to the queen
       targetQueen.equipment.push(equipment);

       // --- SYNC equipment to runwaySlots ---
       if (player.runwaySlots) {
         const slot = player.runwaySlots.find(slot => slot.queen && slot.queen.instanceId === targetQueenInstanceId);
         if (slot && slot.queen) {
           // Ensure the slot.queen.equipment is the same array as the runway queen
           slot.queen.equipment = targetQueen.equipment;
         }
       }

       // Pay the cost
       player.gagTokens -= equipment.gag_cost;
       
       // Remove from hand
       player.hand = player.hand.filter(card => card.instanceId !== cardInstanceId);

       // Prepare context for on play effects
       const context = { queen: targetQueen };
       applyEquipmentEffects({ draft, phase: 'on_play', event: null, context, log, targetQueen });
       
       log(`Player ${playerId} played equipment ${equipment.card_name} onto queen ${targetQueen.queen_name}`, 'info');
       return draft;
     }
     case ActionTypes.ACTIVATE_EQUIPMENT: {
       const { playerId, queenInstanceId, equipmentInstanceId } = action.payload;
       const player = draft[playerId];
       if (!player || state.currentPhase !== PHASES.WERK_ROOM) {
         log('Cannot activate equipment: Invalid player or not Werk Room phase', 'warn');
         return draft;
       }

       const queen = player.runway.find(q => q.instanceId === queenInstanceId);
       if (!queen) {
         log('Cannot activate equipment: Queen not found', 'warn');
         return draft;
       }

       const equipment = queen.equipment.find(eq => eq.instanceId === equipmentInstanceId);
       if (!equipment) {
         log('Cannot activate equipment: Equipment not found', 'warn');
         return draft;
       }

       // Handle equipment activation effects
       const effectText = equipment.effect_text.toLowerCase();
       
       // Handle Gag-Worthy Fan effect
       if (equipment.card_id === 'EQ-PRP-001' && effectText.includes('pay 1 gag token')) {
         if (player.gagTokens < 1) {
           log('Cannot activate Gag-Worthy Fan: Not enough Gag Tokens', 'warn');
           return draft;
         }
         player.gagTokens -= 1;
         // Draw a card
         if (player.deck.length > 0) {
           const drawnCard = player.deck.pop();
           player.hand.push(drawnCard);
           log(`Player ${playerId} drew a card using Gag-Worthy Fan`, 'info');
         }
       }

       // Handle other equipment activations here
       // Add more equipment activation effects as needed

       log(`Player ${playerId} activated ${equipment.card_name} on ${queen.queen_name}`, 'info');
       return draft;
     }
     case ActionTypes.ELIMINATE_QUEEN: {
       const { playerId, queenInstanceId } = action.payload;
       const player = draft[playerId];
       
       if (!player) return draft;

       // Find and remove the queen from the runway
       const updatedRunway = player.runway.filter(q => q.instanceId !== queenInstanceId);
       // --- SYNC runwaySlots ---
       const slot = findSlotByQueen(player.runwaySlots, queenInstanceId);
       if (slot) {
         slot.queen = null;
       }
       // Update player state
       const updatedPlayer = {
         ...player,
         runway: updatedRunway
       };

       // Create new state with updated player
       const newState = {
         ...draft,
         [playerId]: updatedPlayer
       };

       // Check for win condition after elimination
       const winner = checkWinCondition(newState);
       if (winner) {
         return {
           ...newState,
           winner,
           currentPhase: PHASES.GAME_OVER
         };
       }

       // Prepare context for prevention/interception
       const context = { queen: player.runway.find(q => q.instanceId === queenInstanceId), prevented: false };
       applyEquipmentEffects({ draft, phase: null, event: 'about_to_be_eliminated', context, log });
       if (context.prevented) {
         log(`${context.queen.queen_name} was saved from elimination by equipment!`);
         return draft;
       }

       return newState;
     }
     case ActionTypes.MODIFY_STAT: {
       const { queenInstanceId, stat, value } = action.payload;
       const playerId = findPlayerWithQueen(state, queenInstanceId);
       if (!playerId) return state;

       return {
         ...state,
         [playerId]: {
           ...state[playerId],
           runway: state[playerId].runway.map(queen => 
             queen.instanceId === queenInstanceId
               ? {
                   ...queen,
                   stats: {
                     ...queen.stats,
                     [stat]: Math.max(0, queen.stats[stat] + value)
                   }
                 }
               : queen
           )
         }
       };
     }
     case ActionTypes.MODIFY_BATTLE_DAMAGE: {
       const { value, context } = action.payload;
       if (!state.currentBattle) return state;

       return {
         ...state,
         currentBattle: {
           ...state.currentBattle,
           damageModifier: (state.currentBattle.damageModifier || 0) + value
         }
       };
     }
     case ActionTypes.MODIFY_SHADE: {
       const { queenInstanceId, value } = action.payload;
       const playerId = findPlayerWithQueen(state, queenInstanceId);
       if (!playerId) return state;
       const player = draft[playerId];
       const opponent = draft[playerId === PLAYER1_ID ? PLAYER2_ID : PLAYER1_ID];
       const queen = player.runway.find(q => q.instanceId === queenInstanceId);
       if (queen) {
         queen.shadeTokens = Math.max(0, queen.shadeTokens + value);
         checkElimination(playerId, queenInstanceId);
       }
       return draft;
     }
     case ActionTypes.DISCARD_CARDS: {
       const { playerId, count } = action.payload;
       const player = draft[playerId];
       if (!player) return draft;
       const remainingHand = player.hand.slice(count);
       const discardedCards = player.hand.slice(0, count);
       player.hand = remainingHand;
       player.discard.push(...discardedCards);
       log(`${player.name} discards ${count} card(s).`);
       return draft;
     }
     case ActionTypes.REMOVE_POWER_EFFECT: {
       const { powerId } = action.payload;
       // Remove any temporary stat modifications or effects associated with this power
       // This is a placeholder - implement based on how you track active effects
       return state;
     }
    default:
      log(`Unknown action type: ${action.type}. No state change.`, 'warn');
      return state; 
  }
}

// Helper function to find which player owns a queen
function findPlayerWithQueen(state, queenInstanceId) {
  if (state.player1.runway.some(queen => queen.instanceId === queenInstanceId)) {
    return 'player1';
  }
  if (state.player2.runway.some(queen => queen.instanceId === queenInstanceId)) {
    return 'player2';
  }
  return null;
}
