// src/game/gameStateReducer.js
import { ActionTypes, PHASES, PLAYER1_ID, PLAYER2_ID, MAX_GAG_TOKENS, MAX_HAND_SIZE, SHADE_LIMIT, STARTING_SHANTAY_POINTS, STARTING_GAG_TOKENS, STARTING_HAND_SIZE, MAX_RUNWAY_QUEENS } from './constants';
import { shuffle } from '../utils/helpers';

let cardInstanceId = 0; 
const createCardInstance = (cardData) => ({
  ...cardData,
  instanceId: cardInstanceId++,
  shadeTokens: 0,
  attachedEquipment: [], 
  canAttack: false,      
  effects: [],          
  originalStats: {
    charisma: cardData.charisma,
    uniqueness: cardData.uniqueness,
    nerve: cardData.nerve,
    talent: cardData.talent,
  }
});

export const initialState = {
  player1: null,
  player2: null,
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

const checkWinCondition = (stateToCheck) => {
    if (!stateToCheck || stateToCheck.winner) return stateToCheck?.winner;
    let winner = null;
    if (stateToCheck.player1?.shantayPoints <= 0) winner = PLAYER2_ID;
    else if (stateToCheck.player2?.shantayPoints <= 0) winner = PLAYER1_ID;
    return winner;
};


export function gameStateReducer(state, action) {
  const draft = JSON.parse(JSON.stringify(state));
  const log = (message) => {
      const timestamp = new Date().toLocaleTimeString();
      draft.gameLog = [`[${timestamp}] ${message}`, ...draft.gameLog].slice(0, 50);
      // console.log(`[REDUCER_LOG] ${message}`); // Keep this for dev if needed
  };

   const checkElimination = (playerId, queenInstanceId) => {
      const player = draft[playerId];
      if (!player || !player.runway) return; 
      const queenIndex = player.runway.findIndex(q => q.instanceId === queenInstanceId);
      
      if (queenIndex !== -1) {
          const queen = player.runway[queenIndex];
          if (queen.shadeTokens >= SHADE_LIMIT) {
              const eliminatedQueen = player.runway.splice(queenIndex, 1)[0];
              player.discard.push(eliminatedQueen); 
              log(`${eliminatedQueen.queen_name} is Read for Filth and sashays away!`);
          }
      }
   };

  switch (action.type) {
    case ActionTypes.INITIALIZE_GAME: {
      const { queens, equipment } = action.payload;
      log('Initializing New Game...');
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
     case ActionTypes.PLAY_QUEEN_CARD: { /* ... no changes ... */ 
        const { playerId, cardInstanceId } = action.payload;
        const player = draft[playerId];

        if (!player) { log(`Play Error: Player ${playerId} not found.`); return draft; }
        if (draft.currentPhase !== PHASES.WERK_ROOM) { log(`Play Fail: Not in Werk Room phase (Current: ${draft.currentPhase}).`); return draft; }
        if (draft.currentTurn !== playerId) { log(`Play Fail: Not ${playerId}'s turn.`); return draft; }
        
        const cardIndexInHand = player.hand.findIndex(c => c.instanceId === cardInstanceId);
        if (cardIndexInHand === -1) { log(`Play Error: Card ${cardInstanceId} not in ${playerId}'s hand.`); return draft; }
        
        const cardToPlay = player.hand[cardIndexInHand];
        const cardName = cardToPlay.queen_name || cardToPlay.card_name || `Card ${cardToPlay.card_id}`;

        if (typeof cardToPlay.charisma === 'undefined' || 
            typeof cardToPlay.uniqueness === 'undefined' || 
            typeof cardToPlay.nerve === 'undefined' || 
            typeof cardToPlay.talent === 'undefined') {
            log(`Play Fail: ${cardName} is not a valid Queen card (missing C.U.N.T. stats).`);
            return draft;
        }

        if (player.gagTokens < cardToPlay.gag_cost) { log(`Play Fail: ${cardName} needs ${cardToPlay.gag_cost} Gag (has ${player.gagTokens}).`); return draft; }
        if (player.runway.length >= MAX_RUNWAY_QUEENS) { log(`Play Fail: Runway full for ${player.name}.`); return draft; }
        
        player.gagTokens -= cardToPlay.gag_cost;
        const playedCard = player.hand.splice(cardIndexInHand, 1)[0];
        playedCard.canAttack = false; 
        player.runway.push(playedCard);
        log(`${player.name} plays ${playedCard.queen_name} (Cost: ${playedCard.gag_cost}). Gag tokens remaining: ${player.gagTokens}.`);
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
                 draft.selectedDefender = undefined; // Reset to undefined for next selection cycle
                 draft.lipSyncCategory = null;
                 draft.lipSyncResult = null;
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
     case ActionTypes.RESOLVE_LIP_SYNC: { /* ... no changes ... */ 
         const { attackerScore, defenderScore, winner, damage, attackerShade, defenderShade } = action.payload;
         draft.lipSyncResult = { winner, damage, attackerScore, defenderScore, attackerShade, defenderShade }; 
         const attackerPlayerId = draft.currentTurn;
         const defenderPlayerId = attackerPlayerId === PLAYER1_ID ? PLAYER2_ID : PLAYER1_ID;
         
         const attackerQueenInstance = draft[attackerPlayerId]?.runway.find(q => q.instanceId === draft.selectedAttacker);
         const defenderQueenInstance = draft.selectedDefender ? draft[defenderPlayerId]?.runway.find(q => q.instanceId === draft.selectedDefender) : null;

        //  log(`Lip Sync Result: Attacker (${attackerQueenInstance?.queen_name} - ${attackerScore}) vs Defender (${defenderQueenInstance?.queen_name || 'None'} - ${defenderScore}). Winner: ${winner}, Damage: ${damage}`);

         if (damage > 0 && winner !== 'tie') {
             const loserPlayerId = (winner === attackerPlayerId) ? defenderPlayerId : attackerPlayerId;
             if (draft[loserPlayerId]) { 
                 draft[loserPlayerId].shantayPoints = Math.max(0, draft[loserPlayerId].shantayPoints - damage); 
                 log(`${draft[loserPlayerId].name} takes ${damage} damage. Shantay Points remaining: ${draft[loserPlayerId].shantayPoints}.`); 
                }
         }

         if (attackerShade && attackerQueenInstance) {
             attackerQueenInstance.shadeTokens = Math.min(SHADE_LIMIT, attackerQueenInstance.shadeTokens + 1);
             log(`${attackerQueenInstance.queen_name} gets Shade (${attackerQueenInstance.shadeTokens}/${SHADE_LIMIT}).`);
             checkElimination(attackerPlayerId, draft.selectedAttacker);
         }
         if (defenderShade && defenderQueenInstance) {
             defenderQueenInstance.shadeTokens = Math.min(SHADE_LIMIT, defenderQueenInstance.shadeTokens + 1);
             log(`${defenderQueenInstance.queen_name} gets Shade (${defenderQueenInstance.shadeTokens}/${SHADE_LIMIT}).`);
             checkElimination(defenderPlayerId, draft.selectedDefender);
         }
         
         const gameWinnerId = checkWinCondition(draft);
         if (gameWinnerId) {
             draft.winner = gameWinnerId;
             draft.currentPhase = PHASES.GAME_OVER;
             log(`GAME OVER! ${draft[gameWinnerId]?.name || gameWinnerId} snatches the crown!`);
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
                 if (!q.canAttack) { 
                     q.canAttack = true; 
                     log(`${q.queen_name} is now ready to sissy that walk (can attack next turn).`);
                 }
             });
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
    default:
      // log(`Unknown action type: ${action.type}. No state change.`);
      return state; 
  }
}
