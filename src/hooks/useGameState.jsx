// src/hooks/useGameState.jsx
import { useReducer, useEffect, useCallback, useRef } from 'react';
import { gameStateReducer, initialState } from '../game/gameStateReducer';
import { ActionTypes, PHASES, CATEGORIES, PLAYER1_ID, PLAYER2_ID, GAG_GAIN_PER_TURN, MAX_RUNWAY_QUEENS } from '../game/constants';
import { useAudio } from '../contexts/AudioContext';

// SFX Paths (centralized for easier management)
const SFX_PATHS = {
  CARD_DRAW: '/assets/audio/sfx_card_draw.ogg',
  CARD_PLAY_QUEEN: '/assets/audio/sfx_card_play_queen.ogg',
  CARD_PLAY_EQUIPMENT: '/assets/audio/sfx_card_play_equipment.ogg', // Placeholder
  ACTION_FAIL: '/assets/audio/sfx_action_fail.ogg',
  GAG_GAIN: '/assets/audio/sfx_gag_token_gain.ogg',
  SHANTAY_LOSE: '/assets/audio/sfx_shantay_points_lose.ogg',
  QUEEN_SHADE: '/assets/audio/sfx_queen_shade.ogg',
  QUEEN_ELIMINATED: '/assets/audio/sfx_sashay_away.ogg', // Or sfx_queen_eliminated.ogg
  GAME_OVER: '/assets/audio/sfx_game_over_fanfare.ogg',
  // Lip Sync sounds are handled in LipSyncBattle.jsx
};


export function useGameState(queens, equipment) {
  const [state, dispatch] = useReducer(gameStateReducer, initialState);
  const initialized = useRef(false);
  const { playSoundEffect, stopGameplayLoopMusic, stopThemeMusic } = useAudio();

  const stateRef = useRef(state);
  const prevStateRef = useRef(); // To compare previous state for specific sound triggers

  useEffect(() => {
    prevStateRef.current = stateRef.current; // Store previous state before updating stateRef
    stateRef.current = state;

    // --- SFX Triggers based on state changes ---
    if (initialized.current && prevStateRef.current) {
        // Player 1 Shantay Points Lost
        if (state.player1?.shantayPoints < prevStateRef.current.player1?.shantayPoints) {
            playSoundEffect(SFX_PATHS.SHANTAY_LOSE, 0.6);
        }
        // Player 2 Shantay Points Lost
        if (state.player2?.shantayPoints < prevStateRef.current.player2?.shantayPoints) {
            playSoundEffect(SFX_PATHS.SHANTAY_LOSE, 0.6);
        }
        // Check for queen elimination or shade increase (more complex, might need specific log parsing or flags)
        // This is a simplified example; for precise shade/elimination sounds,
        // it might be better to trigger them when the specific reducer action logs it,
        // or have the reducer set a temporary flag that this effect can read and then clear.
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
      playSoundEffect(SFX_PATHS.GAME_OVER, 0.8); 
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
    // Sound for GAG_GAIN and CARD_DRAW will be triggered by observing state changes or logs if preferred
    // For now, let's add GAG_GAIN here if it's a distinct event.
    // playSoundEffect(SFX_PATHS.GAG_GAIN); // Better to trigger based on actual gain in reducer log/state change
    dispatch({ type: ActionTypes.DRAW_CARD, payload: { playerId } });
    // playSoundEffect(SFX_PATHS.CARD_DRAW); // Better to trigger based on actual draw
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
    };
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
  }, [state.currentPhase, state.turnNumber, state.currentTurn, state.winner]); // Trigger effect based on actual state changes

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
            if (cpuPlayer.runway.length < MAX_RUNWAY_QUEENS && affordableQueens.length > 0) {
                const queenToPlay = affordableQueens[0];
                dispatch({ type: ActionTypes.PLAY_QUEEN_CARD, payload: { playerId: PLAYER2_ID, cardInstanceId: queenToPlay.instanceId } });
                // playSoundEffect(SFX_PATHS.CARD_PLAY_QUEEN); // Moved to reducer log observation or specific success callback
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
  }, [dispatch, playSoundEffect]); // playSoundEffect is stable if defined in AudioContext correctly

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
  }, [state.currentTurn, state.currentPhase, state.winner, initialized]);

  return { state, dispatch };
}
 