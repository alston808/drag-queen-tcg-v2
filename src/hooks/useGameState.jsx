// src/hooks/useGameState.jsx
import { useReducer, useEffect, useCallback, useRef } from 'react';
import { gameStateReducer, initialState } from '../game/gameStateReducer';
// Ensure MAX_RUNWAY_QUEENS is imported from constants
import { ActionTypes, PHASES, CATEGORIES, PLAYER1_ID, PLAYER2_ID, GAG_GAIN_PER_TURN, MAX_RUNWAY_QUEENS } from '../game/constants';
import { useAudio } from '../contexts/AudioContext';

// SFX Paths - Based on available files in public/assets/audio
export const SFX_PATHS = {
  ACTION_FAIL: '/assets/audio/sfx_action_fail.mp3',
  CATEGORY_REVEAL: '/assets/audio/sfx_category_reveal.mp3',
  GAME_OVER_FANFARE: '/assets/audio/sfx_game_over_fanfare.mp3',
  LIPSYNC_TIE: '/assets/audio/sfx_lipsync_tie.mp3',
  QUEEN_SHADE: '/assets/audio/sfx_queen_shade.mp3',
  TURN_ANNOUNCEMENT: '/assets/audio/sfx_queen_shade.mp3', // Using queen_shade for turn announcements
  
  // Lip sync intro options
  LIP_SYNC_INTRO_1: '/assets/audio/sfx_lipsync_1.mp3',
  LIP_SYNC_INTRO_2: '/assets/audio/sfx_lipsync_2.mp3',
  LIP_SYNC_INTRO_3: '/assets/audio/sfx_lipsync_3.mp3',
  LIP_SYNC_INTRO_4: '/assets/audio/sfx_lipsync_4.mp3',
  
  // Currently undefined but available for future use
  CARD_DRAW: undefined,
  CARD_PLAY_QUEEN: undefined,
  CARD_PLAY_EQUIPMENT: undefined,
  GAG_GAIN: undefined,
  SHANTAY_LOSE: undefined,
  SASHAY_AWAY: undefined,
  SHANTAY_STAY: undefined,
  SCORE_REVEAL: undefined
};

// Lip sync intro options from available files
export const LIP_SYNC_INTRO_SFX_USER_OPTIONS = [
  SFX_PATHS.LIP_SYNC_INTRO_1,
  SFX_PATHS.LIP_SYNC_INTRO_2,
  SFX_PATHS.LIP_SYNC_INTRO_3,
  SFX_PATHS.LIP_SYNC_INTRO_4
];


export function useGameState(queens, equipment) {
  console.log('[useGameState] Initializing with:', { 
    hasQueens: !!queens, 
    queensLength: queens?.length,
    hasEquipment: !!equipment,
    equipmentLength: equipment?.length 
  });
  
  const [state, dispatch] = useReducer(gameStateReducer, initialState);
  const initialized = useRef(false);
  const { playSoundEffect, stopGameplayLoopMusic, stopThemeMusic } = useAudio();

  const stateRef = useRef(state);
  const prevStateRef = useRef(); 

  useEffect(() => {
    console.log('[useGameState] Effect triggered:', {
      hasQueens: !!queens,
      hasEquipment: !!equipment,
      isInitialized: initialized.current,
      currentState: state
    });

    const previousState = prevStateRef.current;
    prevStateRef.current = stateRef.current; 
    stateRef.current = state;

    if (initialized.current && previousState) {
        if (state.player1?.shantayPoints < previousState.player1?.shantayPoints) {
            playSoundEffect(SFX_PATHS.SHANTAY_LOSE, 0.6);
        }
        if (state.player2?.shantayPoints < previousState.player2?.shantayPoints) {
            playSoundEffect(SFX_PATHS.SHANTAY_LOSE, 0.6);
        }
        if (state.player1?.gagTokens > previousState.player1?.gagTokens && previousState.player1?.gagTokens !== undefined) { // Check undefined for initial load
            playSoundEffect(SFX_PATHS.GAG_GAIN, 0.4);
        }
        if (state.player2?.gagTokens > previousState.player2?.gagTokens && previousState.player2?.gagTokens !== undefined) {
            playSoundEffect(SFX_PATHS.GAG_GAIN, 0.4);
        }
    }
  }, [state, playSoundEffect]);

  const advancePhaseRef = useRef();
  const performSpillTheTeaRef = useRef();
  const performUntuckRef = useRef();
  const performLipSyncRevealRef = useRef();
  const performLipSyncResolutionRef = useRef();
  const performCPUActionRef = useRef();

  useEffect(() => {
    if (state.winner && initialized.current) {
      playSoundEffect(SFX_PATHS.GAME_OVER_FANFARE, 0.8); 
      stopGameplayLoopMusic();
      stopThemeMusic(); 
    }
  }, [state.winner, initialized, playSoundEffect, stopGameplayLoopMusic, stopThemeMusic]);


  advancePhaseRef.current = (explicitSelectedAttacker) => {
    const currentState = stateRef.current; 
    if (currentState.winner) return;
    const attackerForPayload = explicitSelectedAttacker !== undefined ? explicitSelectedAttacker : currentState.selectedAttacker;
    dispatch({ type: ActionTypes.ADVANCE_PHASE, payload: { selectedAttacker: attackerForPayload } });
  };

  performSpillTheTeaRef.current = useCallback((playerId) => {
    dispatch({ type: ActionTypes.GAIN_GAG, payload: { playerId, amount: GAG_GAIN_PER_TURN } });
    dispatch({ type: ActionTypes.DRAW_CARD, payload: { playerId } });
    setTimeout(() => {
        if (advancePhaseRef.current) advancePhaseRef.current();
    }, 50);
  }, [dispatch]);

  performUntuckRef.current = useCallback((playerId) => {
    dispatch({ type: ActionTypes.DISCARD_TO_HAND_SIZE, payload: { playerId } });
    dispatch({ type: ActionTypes.PREPARE_QUEENS_FOR_NEXT_TURN, payload: { playerId } });
    setTimeout(() => {
        if(advancePhaseRef.current) advancePhaseRef.current();
    } , 50);
  }, [dispatch]);

  performLipSyncRevealRef.current = useCallback(() => {
    const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    dispatch({ type: ActionTypes.SET_LIP_SYNC_CATEGORY, payload: { category } });
    setTimeout(() => {
        if(advancePhaseRef.current) advancePhaseRef.current();
    }, 1500);
  }, [dispatch]);

  performLipSyncResolutionRef.current = useCallback(() => {
    const currentState = stateRef.current; 
    if (!currentState || currentState.winner || !currentState.selectedAttacker || !currentState.lipSyncCategory) {
        if(advancePhaseRef.current && currentState?.currentPhase === PHASES.LIP_SYNC_RESOLUTION) {
          setTimeout(() => advancePhaseRef.current(), 50);
        }
        return;
    }
    const attackerPlayerId = currentState.currentTurn;
    const defenderPlayerId = attackerPlayerId === PLAYER1_ID ? PLAYER2_ID : PLAYER1_ID;
    const attackerPlayer = currentState[attackerPlayerId];
    const defenderPlayer = currentState[defenderPlayerId];
    const attackerQueen = attackerPlayer?.runway.find(q => q.instanceId === currentState.selectedAttacker);
    const defenderQueen = currentState.selectedDefender ? defenderPlayer?.runway.find(q => q.instanceId === currentState.selectedDefender) : null;

    if (!attackerQueen) {
         if(advancePhaseRef.current) setTimeout(() => advancePhaseRef.current(), 50);
         return;
    }
    const categoryLower = currentState.lipSyncCategory.toLowerCase();
    let attackerScore = attackerQueen[categoryLower] ?? 0;
    let defenderScore = defenderQueen ? (defenderQueen[categoryLower] ?? 0) : 0;
    let winnerId = null; let damage = 0; let attackerShade = false; let defenderShade = false;

    if (!defenderQueen) { 
      winnerId = attackerPlayerId; damage = Math.ceil(attackerScore / 2);
    } else if (attackerScore > defenderScore) { 
      winnerId = attackerPlayerId; damage = Math.max(1, attackerScore - defenderScore); defenderShade = true;
    } else if (defenderScore > attackerScore) { 
      winnerId = defenderPlayerId; attackerShade = true;
    } else {  
      winnerId = 'tie'; attackerShade = true; defenderShade = true;
    }
    
    dispatch({ type: ActionTypes.RESOLVE_LIP_SYNC, payload: { attackerScore, defenderScore, winner: winnerId, damage, attackerShade, defenderShade } });
     setTimeout(() => {
         if(advancePhaseRef.current) advancePhaseRef.current(); 
      }, 4500);
  }, [dispatch]);


  useEffect(() => {
    if (queens && equipment && !initialized.current) {
      console.log('[useGameState] Dispatching INITIALIZE_GAME');
      dispatch({ type: ActionTypes.INITIALIZE_GAME, payload: { queens, equipment } });
      initialized.current = true;
    }
  }, [queens, equipment, dispatch]);

  useEffect(() => {
    const currentState = stateRef.current;
    if (!currentState || currentState.winner || !currentState.currentPhase || !initialized.current) return;

    switch (currentState.currentPhase) {
        case PHASES.SPILL_THE_TEA:
            if (performSpillTheTeaRef.current) performSpillTheTeaRef.current(currentState.currentTurn);
            break;
        case PHASES.UNTUCK:
            if (performUntuckRef.current) performUntuckRef.current(currentState.currentTurn);
            break;
        case PHASES.LIP_SYNC_REVEAL:
              if (performLipSyncRevealRef.current) performLipSyncRevealRef.current();
             break;
        case PHASES.LIP_SYNC_RESOLUTION:
              if (performLipSyncResolutionRef.current) performLipSyncResolutionRef.current();
             break;
    }
  }, [state.currentPhase, state.turnNumber, state.currentTurn, state.winner]); // Using actual state for effect trigger


  performCPUActionRef.current = useCallback(() => {
    const currentState = stateRef.current; 
    if (!currentState || currentState.winner || !initialized.current || !currentState.player2) return;

    const cpuPlayer = currentState.player2; 
    const currentPhase = currentState.currentPhase;
    
    if (currentPhase === PHASES.LIP_SYNC_SELECT_DEFENDER && currentState.currentTurn === PLAYER1_ID) {
        if (cpuPlayer.runway && cpuPlayer.runway.length > 0) {
             const defender = cpuPlayer.runway[Math.floor(Math.random() * cpuPlayer.runway.length)];
            dispatch({ type: ActionTypes.SELECT_DEFENDER, payload: { queenInstanceId: defender.instanceId } });
             setTimeout(() => { if(advancePhaseRef.current) advancePhaseRef.current(currentState.selectedAttacker); }, 50);
        } else {
             dispatch({ type: ActionTypes.SELECT_DEFENDER, payload: { queenInstanceId: null } });
             setTimeout(() => { if(advancePhaseRef.current) advancePhaseRef.current(currentState.selectedAttacker); }, 50);
        }
        return; 
    }

    if (currentState.currentTurn !== PLAYER2_ID) return; 

    switch (currentPhase) {
        case PHASES.WERK_ROOM:
            const affordableQueens = cpuPlayer.hand.filter(c => 
                (typeof c.charisma !== 'undefined') && 
                c.gag_cost <= cpuPlayer.gagTokens
            );
            if (cpuPlayer.runway.length < MAX_RUNWAY_QUEENS && affordableQueens.length > 0) { // Used MAX_RUNWAY_QUEENS
                const queenToPlay = affordableQueens[0];
                dispatch({ type: ActionTypes.PLAY_QUEEN_CARD, payload: { playerId: PLAYER2_ID, cardInstanceId: queenToPlay.instanceId } });
                playSoundEffect(SFX_PATHS.CARD_PLAY_QUEEN); 
                setTimeout(() => { if(advancePhaseRef.current) advancePhaseRef.current(); }, 1000); 
            } else {
                if(advancePhaseRef.current) advancePhaseRef.current();
            }
            break;

        case PHASES.LIP_SYNC_SELECT_ATTACKER:
            const currentCPURunway = currentState.player2.runway; 
            const readyQueensToAttack = currentCPURunway ? currentCPURunway.filter(q => q.canAttack === true) : [];
            let cpuSelectedAttackerId = null;
            if (readyQueensToAttack.length > 0) {
                const attacker = readyQueensToAttack[Math.floor(Math.random() * readyQueensToAttack.length)]; 
                cpuSelectedAttackerId = attacker.instanceId;
                dispatch({ type: ActionTypes.SELECT_ATTACKER, payload: { queenInstanceId: cpuSelectedAttackerId } });
            } else {
                 dispatch({ type: ActionTypes.SELECT_ATTACKER, payload: { queenInstanceId: null } });
            }
            setTimeout(() => {
                if (advancePhaseRef.current) {
                    advancePhaseRef.current(cpuSelectedAttackerId);
                }
            }, 50);
            break;
    }
  }, [dispatch, playSoundEffect]);

  useEffect(() => {
    const currentState = stateRef.current;
      const isCPUsTurnToAct = currentState?.currentTurn === PLAYER2_ID && 
                             (currentState.currentPhase === PHASES.WERK_ROOM || currentState.currentPhase === PHASES.LIP_SYNC_SELECT_ATTACKER);
      const isCPUDefending = currentState?.currentTurn === PLAYER1_ID && currentState.currentPhase === PHASES.LIP_SYNC_SELECT_DEFENDER;

      if ((isCPUsTurnToAct || isCPUDefending) && !currentState.winner && initialized.current) {
          const cpuThinkTime = 1500;
          const phaseWhenScheduled = currentState.currentPhase;
          const turnWhenScheduled = currentState.currentTurn;
          
          const timerId = setTimeout(() => {
            const latestStateForAction = stateRef.current; 
              if (!latestStateForAction.winner && initialized.current &&
                  latestStateForAction.currentPhase === phaseWhenScheduled && 
                  latestStateForAction.currentTurn === turnWhenScheduled
                 ) {
                   if (performCPUActionRef.current) {
                        performCPUActionRef.current();
                   }
              }
          }, cpuThinkTime);
          return () => clearTimeout(timerId);
      }
  }, [state.currentTurn, state.currentPhase, state.winner, initialized]); // Dependencies for scheduling

  return { state, dispatch };
}
