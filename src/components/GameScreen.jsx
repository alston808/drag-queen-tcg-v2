// src/components/GameScreen.jsx
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useGameState } from '../hooks/useGameState';
import { ActionTypes, PHASES, PLAYER1_ID, PLAYER2_ID, MAX_HAND_SIZE, MAX_RUNWAY_QUEENS } from '../game/constants';
import { useAudio } from '../contexts/AudioContext';
import { SFX_PATHS } from '../hooks/useGameState';
import { usePowerManager, PowerManagerProvider, PowerManagerContext } from '../game/powerManager';
import { PowerTriggers } from '../game/powerSystem';
import queensData from '../data/queens.json';
import equipmentData from '../data/equipment.json';
import { Terminal } from './ui/terminal';

import TurnAnnouncement from './TurnAnnouncement';
import QueenModal from './QueenModal';
import QueenCard from './QueenCard';
import EquipmentCard from './EquipmentCard';
import LipSyncBattle from './LipSyncBattle'; 
import EquipmentTargetModal from './EquipmentTargetModal';
import GameOverScreen from './GameOverScreen';

// Create a custom hook to use the power manager context
const usePowerManagerContext = () => {
  const context = React.useContext(PowerManagerContext);
  if (!context) {
    throw new Error('usePowerManagerContext must be used within a PowerManagerProvider');
  }
  return context;
};

// Update GameScreenContent to receive state and dispatch as props
const GameScreenContent = ({ queens, equipment, onGoToMenu, state, dispatch }) => {
  console.log('[GameScreenContent] Initializing with:', {
    hasQueens: !!queens,
    queensLength: queens?.length,
    hasEquipment: !!equipment,
    equipmentLength: equipment?.length,
    hasState: !!state,
    hasDispatch: !!dispatch
  });

  const { playSoundEffect } = useAudio();
  const [selectedQueenModal, setSelectedQueenModal] = useState(null);
  const [announcement, setAnnouncement] = useState({ message: '', show: false });
  const [showLipSyncBattle, setShowLipSyncBattle] = useState(false);
  const [equipmentTargetModal, setEquipmentTargetModal] = useState({ isOpen: false, equipment: null });
  const [activeEquipment, setActiveEquipment] = useState(null);
  const [showGameOver, setShowGameOver] = useState(false);
  const [pendingEliminations, setPendingEliminations] = useState([]);

  let powerManager = null;
  try {
    powerManager = usePowerManagerContext();
  } catch (e) {
    console.error('[GameScreenContent] PowerManager context error:', e);
  }
  console.log('[GameScreenContent] powerManager:', powerManager);

  // Always render the main container, even if state is not ready
  const isReady = state && state.player1 && state.player2 && powerManager;

  // Destructure state and compute derived values early
  const { player1, player2, currentTurn, currentPhase, turnNumber, winner, lipSyncCategory, lipSyncResult, selectedAttacker, selectedDefender } = state;
  const isPlayer1Turn = currentTurn === PLAYER1_ID;
  const canPlayer1PlayInWerkRoom = isPlayer1Turn && currentPhase === PHASES.WERK_ROOM;
  const player1NeedsToSelectDefender = 
    currentTurn === PLAYER2_ID && 
    currentPhase === PHASES.LIP_SYNC_SELECT_DEFENDER && 
    selectedAttacker !== null && 
    selectedDefender === undefined;

  const attackerQueenForBattle = selectedAttacker ? state[currentTurn]?.runwaySlots.find(slot => slot.queen && slot.queen.instanceId === selectedAttacker)?.queen : null;
  const defenderPlayerIdForBattle = currentTurn === PLAYER1_ID ? PLAYER2_ID : PLAYER1_ID;
  const defenderQueenForBattle = selectedDefender !== undefined ? state[defenderPlayerIdForBattle]?.runwaySlots.find(slot => slot.queen && slot.queen.instanceId === selectedDefender)?.queen : null;

  // Play sound effect with error handling
  const playSoundWithFallback = useCallback((soundPath, volume = 1.0) => {
    if (!soundPath) return;
    
    try {
      if (playSoundEffect) {
        playSoundEffect(soundPath, volume);
      }
    } catch (err) {
      console.warn('Sound effect playback failed:', err);
    }
  }, [playSoundEffect]);

  useEffect(() => {
    if (state && state.currentPhase && state.currentTurn) {
      const playerName = state[state.currentTurn]?.name || (state.currentTurn === PLAYER1_ID ? "Player 1" : "CPU");
      let phaseMessage = state.currentPhase;

      if (state.currentPhase === PHASES.LIP_SYNC_SELECT_DEFENDER) {
        if (state.currentTurn === PLAYER1_ID) { // P1 attacked, CPU is selecting defender
          phaseMessage = `CPU is selecting a defender!`;
        } else { // CPU attacked, P1 is selecting defender
          phaseMessage = `Select your defender!`;
        }
      }
      const message = `${playerName}'s Turn - ${phaseMessage}`;
      
      const isBattleScreenActiveOrImminent = 
        state.currentPhase === PHASES.LIP_SYNC_REVEAL || 
        state.currentPhase === PHASES.LIP_SYNC_RESOLUTION;
      
      const isPlayerSelectingDefender = state.currentPhase === PHASES.LIP_SYNC_SELECT_DEFENDER && state.currentTurn === PLAYER2_ID;

      if (!isBattleScreenActiveOrImminent && !isPlayerSelectingDefender) {
        setAnnouncement({ message, show: true });
      } else {
        setAnnouncement({ message: '', show: false }); 
      }
    }
  }, [state?.currentPhase, state?.currentTurn, state?.turnNumber]);

  useEffect(() => {
    const isBattleRevealOrResolution = 
        state?.currentPhase === PHASES.LIP_SYNC_REVEAL || 
        state?.currentPhase === PHASES.LIP_SYNC_RESOLUTION;

    const shouldShowBattle = isBattleRevealOrResolution && 
        state?.selectedAttacker && 
        state?.selectedDefender !== undefined &&
        !showLipSyncBattle; // Only show if not already showing

    if (shouldShowBattle) {
      console.debug("[GameScreen] Showing Lip Sync Battle", {
        phase: state?.currentPhase,
        attacker: state?.selectedAttacker,
        defender: state?.selectedDefender
      });
      setShowLipSyncBattle(true);
    } else if (!isBattleRevealOrResolution && showLipSyncBattle) {
      console.debug("[GameScreen] Hiding Lip Sync Battle", {
        phase: state?.currentPhase,
        attacker: state?.selectedAttacker,
        defender: state?.selectedDefender
      });
      setShowLipSyncBattle(false);
    }
  }, [state?.currentPhase, state?.selectedAttacker, state?.selectedDefender, showLipSyncBattle]);

  // Handle equipment activation
  const handleEquipmentActivation = useCallback((queenInstanceId, equipmentInstanceId) => {
    if (!state || state.winner || state.currentPhase !== PHASES.WERK_ROOM) return;

    dispatch({
      type: ActionTypes.ACTIVATE_EQUIPMENT,
      payload: {
        playerId: state.currentTurn,
        queenInstanceId,
        equipmentInstanceId
      }
    });

    setActiveEquipment(null);
  }, [state, dispatch]);

  // Handle clicking a card in hand (play or show modal)
  const handleClickInHand = useCallback((playerId, cardInstanceId) => {
    console.log('[handleClickInHand] Clicked:', {
      playerId,
      cardInstanceId,
      currentPhase: state.currentPhase,
      currentTurn: state.currentTurn,
      isPlayer1Turn,
      canPlayer1PlayInWerkRoom,
      state
    });
    if (!state) {
      console.warn('[handleClickInHand] Early return: no state');
      return;
    }
    if (state.winner) {
      console.warn('[handleClickInHand] Early return: game already has winner');
      return;
    }
    if (showLipSyncBattle) {
      console.warn('[handleClickInHand] Early return: showLipSyncBattle is true');
      return;
    }
    const player = state[playerId];
    if (!player) {
      console.warn('[handleClickInHand] Early return: no player');
      return;
    }
    const card = player.hand.find(c => c.instanceId === cardInstanceId);
    if (!card) {
      console.warn('[handleClickInHand] Early return: no card in hand');
      return;
    }
    const cardName = card.queen_name || card.card_name || `Card ${card.card_id}`;
    const isQueenCard = typeof card.charisma !== 'undefined';
    const isEquipmentCard = card.card_id && card.card_id.startsWith('EQ');
    if (isQueenCard) {
      const isPlayerTurn = state.currentTurn === playerId;
      const isWerkRoom = state.currentPhase === PHASES.WERK_ROOM;
      console.log('[handleClickInHand] Queen card playability check:', {
        isPlayerTurn,
        isWerkRoom,
        gagTokens: player.gagTokens,
        gagCost: card.gag_cost,
        runwayLength: player.runwaySlots.length,
        maxRunway: MAX_RUNWAY_QUEENS,
        cardInstanceId,
        cardName
      });
      if (!isPlayerTurn) {
        console.warn('[handleClickInHand] Not player turn:', { currentTurn: state.currentTurn, playerId });
      }
      if (!isWerkRoom) {
        console.warn('[handleClickInHand] Not Werk Room phase:', { currentPhase: state.currentPhase });
      }
      if (player.gagTokens < card.gag_cost) {
        console.warn('[handleClickInHand] Not enough Gag tokens:', { gagTokens: player.gagTokens, gagCost: card.gag_cost });
      }
      if (player.runwaySlots.length >= MAX_RUNWAY_QUEENS) {
        console.warn('[handleClickInHand] Runway full:', { runwayLength: player.runwaySlots.length, maxRunway: MAX_RUNWAY_QUEENS });
      }
      if (!isPlayerTurn || !isWerkRoom) {
        if (typeof playSoundEffect === 'function' && SFX_PATHS.ACTION_FAIL) {
          playSoundEffect(SFX_PATHS.ACTION_FAIL, 0.7);
        } else {
          window.alert('You can only play a Queen card during your Werk Room phase!');
        }
        return;
      }
      console.log('[handleClickInHand] Playing Queen card:', cardName);
      dispatch({
        type: 'PLAY_QUEEN_CARD',
        payload: { playerId, cardInstanceId },
      });
      return;
    }
    if (isEquipmentCard) {
      console.log('[handleClickInHand] Opening equipment modal for:', cardName);
      setEquipmentTargetModal({ isOpen: true, equipment: card, cardInstanceId: card.instanceId });
      return;
    }
    console.warn('[handleClickInHand] Early return: unknown card type –', cardName);
  }, [state, dispatch, showLipSyncBattle, playSoundEffect]);

  // Update LipSyncBattle component to handle audio properly
  const handleLipSyncPhase = useCallback((phase) => {
    if (phase === PHASES.LIP_SYNC_REVEAL) {
      // Play category reveal sound
      playSoundWithFallback(SFX_PATHS.CATEGORY_REVEAL);
    }
  }, [playSoundWithFallback]);

  const handleEquipmentTargetSelect = useCallback((queenInstanceId) => {
    if (!equipmentTargetModal.equipment || !queenInstanceId) return;
    
    dispatch({ 
      type: ActionTypes.PLAY_EQUIPMENT_CARD, 
      payload: { 
        playerId: state.currentTurn,
        cardInstanceId: equipmentTargetModal.cardInstanceId,
        targetQueenInstanceId: queenInstanceId 
      } 
    });
    
    setEquipmentTargetModal({ isOpen: false, equipment: null });
  }, [equipmentTargetModal, state.currentTurn, dispatch]);

  const handleQueenClickOnRunway = useCallback((playerId, queenInstanceId) => {
     if (!state || state.winner || showLipSyncBattle) {
       console.debug("[GameScreen] Ignoring queen click - game over or battle in progress");
       return;
     }
     const player = state[playerId];
     if (!player) {
       console.error("[GameScreen] Invalid player ID in handleQueenClickOnRunway:", playerId);
       return;
     }
     // Always get the slot from runwaySlots for accurate stats/equipment
     const slot = player.runwaySlots.find(s => s.queen && s.queen.instanceId === queenInstanceId);
     if (!slot) {
       console.error("[GameScreen] Queen not found in runwaySlots:", { playerId, queenInstanceId });
       return;
     }

     const queenName = slot.queen.queen_name || `Queen ${slot.queen.card_id}`;
    
     const isPlayer1sTurnToAttack = state.currentTurn === PLAYER1_ID && state.currentPhase === PHASES.LIP_SYNC_SELECT_ATTACKER;
     const isPlayer1sTurnToDefend = state.currentTurn === PLAYER2_ID && 
                                  state.currentPhase === PHASES.LIP_SYNC_SELECT_DEFENDER && 
                                  playerId === PLAYER1_ID;

     if (isPlayer1sTurnToAttack && playerId === PLAYER1_ID) {
         if (slot.queen.canAttack) {
             console.debug("[GameScreen] Player 1 selecting attacker:", {
               queenName,
               queenInstanceId,
               phase: state.currentPhase,
               turn: state.currentTurn
             });
             dispatch({ type: ActionTypes.SELECT_ATTACKER, payload: { queenInstanceId } });
             dispatch({ type: ActionTypes.ADVANCE_PHASE, payload: { selectedAttacker: queenInstanceId } });
         } else {
             console.debug("[GameScreen] Queen not ready to attack:", {
               queenName,
               queenInstanceId,
               canAttack: slot.queen.canAttack
             });
             setSelectedQueenModal(slot);
         }
     } 
     else if (isPlayer1sTurnToDefend) {
         console.debug("[GameScreen] Player 1 selecting defender:", {
           queenName,
           queenInstanceId,
           phase: state.currentPhase,
           turn: state.currentTurn
         });
         dispatch({ type: ActionTypes.SELECT_DEFENDER, payload: { queenInstanceId } });
         dispatch({ type: ActionTypes.ADVANCE_PHASE, payload: { selectedAttacker: state.selectedAttacker } }); 
     }
     else { 
         console.debug("[GameScreen] Viewing queen details:", {
           queenName,
           queenInstanceId,
           phase: state.currentPhase,
           turn: state.currentTurn
         });
         setSelectedQueenModal(slot);
     }
  }, [state, dispatch, showLipSyncBattle]);

  const handleEndWerkRoomPhase = useCallback(() => {
      if (!state || state.winner || state.currentTurn !== PLAYER1_ID || state.currentPhase !== PHASES.WERK_ROOM || showLipSyncBattle) {
         console.debug("[GameScreen] Cannot end Werk Room phase:", {
           hasState: !!state,
           hasWinner: !!state?.winner,
           currentTurn: state?.currentTurn,
           currentPhase: state?.currentPhase,
           showLipSyncBattle
         });
         return;
      }
      console.debug("[GameScreen] Ending Werk Room phase");
      dispatch({ type: ActionTypes.ADVANCE_PHASE, payload: { selectedAttacker: state.selectedAttacker } });
  }, [state, dispatch, showLipSyncBattle]);

   const handleSkipLipSync = useCallback(() => {
       if (!state || state.winner || state.currentTurn !== PLAYER1_ID || state.currentPhase !== PHASES.LIP_SYNC_SELECT_ATTACKER || showLipSyncBattle) {
         console.debug("[GameScreen] Cannot skip Lip Sync:", {
           hasState: !!state,
           hasWinner: !!state?.winner,
           currentTurn: state?.currentTurn,
           currentPhase: state?.currentPhase,
           showLipSyncBattle
         });
         return;
       }
       console.debug("[GameScreen] Player 1 skipping Lip Sync");
       dispatch({ type: ActionTypes.SELECT_ATTACKER, payload: { queenInstanceId: null } });
       dispatch({ type: ActionTypes.ADVANCE_PHASE, payload: { selectedAttacker: null } });
   }, [state, dispatch, showLipSyncBattle]);

  // Add effect to handle game over state
  useEffect(() => {
    if (state?.winner && !showGameOver) {
      // Delay showing game over screen to allow lip sync animations to complete
      const timer = setTimeout(() => {
        setShowGameOver(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [state?.winner, showGameOver]);

  // Add effect to handle pending eliminations
  useEffect(() => {
    if (state?.currentPhase === PHASES.LIP_SYNC_RESOLUTION && lipSyncResult) {
      const eliminatedQueens = [];
      
      if (lipSyncResult.winner && lipSyncResult.winner !== 'tie') {
        const loserQueen = lipSyncResult.winner === attackerQueenForBattle?.ownerId ? defenderQueenForBattle : attackerQueenForBattle;
        if (loserQueen) {
          eliminatedQueens.push({
            queenInstanceId: loserQueen.instanceId,
            playerId: loserQueen.ownerId
          });
        }
      }

      if (eliminatedQueens.length > 0) {
        setPendingEliminations(eliminatedQueens);
      }
    }
  }, [state?.currentPhase, lipSyncResult, attackerQueenForBattle, defenderQueenForBattle]);

  // Add effect to process pending eliminations after lip sync animation
  useEffect(() => {
    if (pendingEliminations.length > 0 && !showLipSyncBattle) {
      pendingEliminations.forEach(({ queenInstanceId, playerId }) => {
        dispatch({
          type: ActionTypes.ELIMINATE_QUEEN,
          payload: { playerId, queenInstanceId }
        });
      });
      setPendingEliminations([]);
    }
  }, [pendingEliminations, showLipSyncBattle, dispatch]);

  // Handle power triggers for various game events
  useEffect(() => {
    if (!state || !powerManager) return;

    // Handle phase changes
    if (state.currentPhase) {
      powerManager.handleTrigger(PowerTriggers.ON_PHASE_CHANGE, {
        phase: state.currentPhase,
        owner: state.currentTurn
      });
    }

    // Handle queen play
    if (state.lastPlayedQueen) {
      powerManager.handleTrigger(PowerTriggers.ON_PLAY, {
        queen: state.lastPlayedQueen,
        owner: state.currentTurn
      });
    }

    // Handle lip sync start
    if (state.currentBattle && state.currentBattle.phase === 'START') {
      powerManager.handleTrigger(PowerTriggers.ON_LIP_SYNC_START, {
        battle: state.currentBattle,
        owner: state.currentTurn
      });
    }

    // Handle damage
    if (state.currentBattle && state.currentBattle.damage > 0) {
      powerManager.handleTrigger(PowerTriggers.ON_DAMAGE, {
        battle: state.currentBattle,
        owner: state.currentTurn,
        damage: state.currentBattle.damage
      });
    }

    // Handle elimination
    if (state.currentBattle && state.currentBattle.eliminatedQueen) {
      powerManager.handleTrigger(PowerTriggers.ON_ELIMINATION, {
        queen: state.currentBattle.eliminatedQueen,
        owner: state.currentTurn
      });
    }

    // Handle shade
    if (state.currentBattle && state.currentBattle.shadeChange) {
      powerManager.handleTrigger(PowerTriggers.ON_SHADE, {
        battle: state.currentBattle,
        owner: state.currentTurn,
        shadeChange: state.currentBattle.shadeChange
      });
    }

    // Handle gag gain
    if (state.currentBattle && state.currentBattle.gagGained) {
      powerManager.handleTrigger(PowerTriggers.ON_GAG_GAIN, {
        battle: state.currentBattle,
        owner: state.currentTurn,
        gagGained: state.currentBattle.gagGained
      });
    }

  }, [state, powerManager]);

  // 1. Add a handler for queen power activation
  const handleActivateQueenPower = useCallback((queenInstanceId, power) => {
    if (!powerManager) return;
    powerManager.activatePower(queenInstanceId, power);
  }, [powerManager]);

  if (!state || !state.player1 || !state.player2 || !powerManager) {
    console.log('[GameScreenContent] Not ready:', {
      hasState: !!state,
      hasPlayer1: !!state?.player1,
      hasPlayer2: !!state?.player2,
      hasPowerManager: !!powerManager,
      state,
      powerManager
    });
    return <div className="text-center p-10 text-xl text-soft-white">Loading Game State...</div>;
  }

  return (
    <div className="w-full min-h-screen flex flex-col p-4 bg-gradient-to-br from-gray-950 via-purple-950 to-black text-soft-white font-sans transition-colors duration-300">
      <TurnAnnouncement message={announcement.message} show={announcement.show && !showLipSyncBattle} />
      {!isReady && (
        <div className="flex flex-col items-center justify-center flex-1 min-h-[60vh]">
          <div className="bg-black/70 rounded-2xl shadow-2xl p-8 border border-pink-700/40 animate-pulse">
            <h2 className="text-2xl font-bold text-pink-400 mb-2">Loading Game State...</h2>
            <p className="text-gray-300">If this persists, check your browser console for errors or try refreshing.</p>
            <p className="text-xs text-gray-500 mt-2">Debug: hasState={!!state?.player1 && !!state?.player2}, hasPowerManager={!!powerManager}</p>
          </div>
        </div>
      )}
      {isReady && (
        <div className="relative flex flex-col flex-grow transition-opacity duration-300">
          {/* DEBUG: Show live state object */}
          <div className="mb-2">
            {/* Check for runway/runwaySlots mismatch and show warning if needed */}
            {(() => {
              const p1 = state.player1;
              const p2 = state.player2;
              const p1RunwayIds = (p1.runway || []).map(q => q?.instanceId).filter(Boolean);
              const p1SlotIds = (p1.runwaySlots || []).map(s => s.queen?.instanceId).filter(Boolean);
              const p2RunwayIds = (p2.runway || []).map(q => q?.instanceId).filter(Boolean);
              const p2SlotIds = (p2.runwaySlots || []).map(s => s.queen?.instanceId).filter(Boolean);
              const p1Missing = p1RunwayIds.filter(id => !p1SlotIds.includes(id));
              const p2Missing = p2RunwayIds.filter(id => !p2SlotIds.includes(id));
              return (
                <>
                  {(p1Missing.length > 0 || p2Missing.length > 0) && (
                    <div className="mb-1 p-2 bg-yellow-900/80 text-yellow-200 rounded text-xs font-mono">
                      <b>Warning:</b> Runway/RunwaySlots mismatch detected.<br />
                      Player 1 missing in slots: {JSON.stringify(p1Missing)}<br />
                      Player 2 missing in slots: {JSON.stringify(p2Missing)}<br />
                      (Auto-synced for debug preview below)
                    </div>
                  )}
                  <ClickToCopy
                    value={JSON.stringify({
                      ...state,
                      player1: {
                        ...p1,
                        runwaySlots: p1Missing.length > 0 ? syncRunwaySlotsWithRunway(p1.runway, p1.runwaySlots) : p1.runwaySlots
                      },
                      player2: {
                        ...p2,
                        runwaySlots: p2Missing.length > 0 ? syncRunwaySlotsWithRunway(p2.runway, p2.runwaySlots) : p2.runwaySlots
                      }
                    }, null, 2)}
                  />
                </>
              );
            })()}
          </div>
          {/* Header */}
          <div className="flex justify-between items-center mb-4 p-4 bg-black/60 rounded-2xl shadow-xl border border-white/10 backdrop-blur-md">
            <div className="text-left w-1/3">
              <h2 className="text-xl font-semibold text-red-400 truncate" title={state.player2.name}>{state.player2.name}</h2>
              <p>Shantay: <span className="font-bold text-xl">{state.player2.shantayPoints}</span> | Gag: <span className="font-bold text-xl">{state.player2.gagTokens}</span></p>
              <p className="text-sm">Hand: {state.player2.hand.length} | Deck: {state.player2.deck.length} | Runway: {state.player2.runwaySlots.length}</p>
            </div>
            <div className="text-center w-1/3">
              {state.winner ? (
                <h1 className="text-3xl font-bold text-gold animate-pulse drop-shadow-lg">GAME OVER! {state[state.winner]?.name || state.winner} Wins!</h1>
              ) : (
                <h1 className="text-2xl font-bold text-gold drop-shadow">Turn {state.turnNumber}</h1>
              )}
            </div>
            <div className="text-right w-1/3">
              <h2 className="text-xl font-semibold text-blue-400 truncate" title={state.player1.name}>{state.player1.name}</h2>
              <p>Shantay: <span className="font-bold text-xl">{state.player1.shantayPoints}</span> | Gag: <span className="font-bold text-xl">{state.player1.gagTokens}</span></p>
              <p className="text-sm">Hand: {state.player1.hand.length} | Deck: {state.player1.deck.length} | Runway: {state.player1.runwaySlots.length}</p>
            </div>
          </div>

          {/* Player 2 (CPU) Runway */}
          <div className="mb-4 p-3 bg-black/30 rounded-lg min-h-[220px] border border-white/10">
            <h3 className="text-lg font-semibold mb-2 text-red-300">{state.player2.name}'s Runway</h3>
            <div className="flex justify-center items-center gap-3 flex-wrap min-h-[180px]">
              {[...(state.player2.runway || []), ...Array(3 - ((state.player2.runway && state.player2.runway.length) || 0)).fill(null)].map((card, idx) =>
                card ? (
                  <div key={card.instanceId} className="relative group transform transition-transform hover:scale-105">
                    <QueenCard
                      slot={{
                        queen: card,
                        stats: card.stats || card.originalStats || {
                          charisma: card.charisma,
                          uniqueness: card.uniqueness,
                          nerve: card.nerve,
                          talent: card.talent
                        },
                        equipment: card.equipment || []
                      }}
                      onClick={() => handleQueenClickOnRunway(PLAYER2_ID, card.instanceId)}
                      onActivatePower={handleActivateQueenPower}
                      gameState={state}
                      owner={PLAYER2_ID}
                    />
                  </div>
                ) : (
                  <div key={`empty-${idx}`} className="w-[120px] h-[168px] bg-gray-800/40 border border-white/10 rounded-xl flex items-center justify-center text-gray-500 italic">
                    Empty Slot
                  </div>
                )
              )}
            </div>
          </div>

          <div className="flex-grow flex flex-col">
            {/* Player 1 Runway */}
            <div className="mb-4 p-3 bg-black/30 rounded-lg min-h-[220px] border border-white/10">
              <h3 className="text-lg font-semibold mb-2 text-blue-300">{state.player1.name}'s Runway</h3>
              <div className="flex justify-center items-center gap-3 flex-wrap min-h-[180px]">
                {[...(state.player1.runway || []), ...Array(3 - ((state.player1.runway && state.player1.runway.length) || 0)).fill(null)].map((card, idx) =>
                  card ? (
                    <div key={card.instanceId} className="relative group transform transition-transform hover:scale-105">
                      <QueenCard
                        slot={{
                          queen: card,
                          stats: card.stats || card.originalStats || {
                            charisma: card.charisma,
                            uniqueness: card.uniqueness,
                            nerve: card.nerve,
                            talent: card.talent
                          },
                          equipment: card.equipment || []
                        }}
                        onClick={() => handleQueenClickOnRunway(PLAYER1_ID, card.instanceId)}
                        onActivatePower={handleActivateQueenPower}
                        gameState={state}
                        owner={PLAYER1_ID}
                      />
                      {!card.canAttack && !showLipSyncBattle && (
                        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center text-gray-300 font-bold text-sm rounded-xl pointer-events-none">
                          Getting into Geish
                        </div>
                      )}
                      {currentPhase === PHASES.LIP_SYNC_SELECT_ATTACKER && isPlayer1Turn && card.canAttack && !showLipSyncBattle && (
                        <div className="absolute inset-0 bg-green-600/60 backdrop-blur-sm flex items-center justify-center text-white font-bold text-lg rounded-xl cursor-pointer ring-2 ring-green-300 ring-offset-2 ring-offset-black/50 animate-pulse z-10"
                          onClick={() => handleQueenClickOnRunway(PLAYER1_ID, card.instanceId)}
                        >
                          Select Attacker
                        </div>
                      )}
                      {player1NeedsToSelectDefender && card.instanceId !== selectedAttacker && !showLipSyncBattle && (
                        <div className="absolute inset-0 bg-blue-600/60 backdrop-blur-sm flex items-center justify-center text-white font-bold text-lg rounded-xl cursor-pointer ring-2 ring-blue-300 ring-offset-2 ring-offset-black/50 animate-pulse z-10"
                          onClick={() => handleQueenClickOnRunway(PLAYER1_ID, card.instanceId)}
                        >
                          Select Defender
                        </div>
                      )}
                    </div>
                  ) : (
                    <div key={`empty-${idx}`} className="w-[120px] h-[168px] bg-gray-800/40 border border-white/10 rounded-xl flex items-center justify-center text-gray-500 italic">
                      Empty Slot
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Player 1 Hand & Action Buttons */}
            <div className="p-3 bg-dark-glass rounded-lg border border-white/10">
              <h3 className="text-lg font-semibold mb-2 text-blue-300">{state.player1.name}'s Hand ({state.player1.hand.length}/{MAX_HAND_SIZE})</h3>
              <div className={`flex justify-center items-end gap-2 flex-wrap min-h-[180px] ${canPlayer1PlayInWerkRoom ? 'cursor-pointer' : ''}`}>
                {state.player1.hand.length > 0 ? state.player1.hand.map((card) => (
                  <div key={card.instanceId} className={`transform transition-transform duration-200 ${canPlayer1PlayInWerkRoom ? 'hover:-translate-y-3' : ''}`}>
                    {(typeof card.charisma !== 'undefined') ? (
                      <QueenCard
                        slot={{
                          queen: card,
                          stats: card.stats || card.originalStats || {
                            charisma: card.charisma,
                            uniqueness: card.uniqueness,
                            nerve: card.nerve,
                            talent: card.talent
                          },
                          equipment: card.equipment || []
                        }}
                        onClick={() => handleClickInHand(PLAYER1_ID, card.instanceId)}
                        onActivatePower={handleActivateQueenPower}
                        gameState={state}
                        owner={PLAYER1_ID}
                      />
                    ) : card.card_id && card.card_id.startsWith('EQ') ? (
                      <EquipmentCard
                        equipment={card}
                        onCardClick={() => handleClickInHand(PLAYER1_ID, card.instanceId)}
                      />
                    ) : null}
                  </div>
                )) : (
                  <p className="text-gray-400 italic self-center">Hand empty</p>
                )}
              </div>
              {isPlayer1Turn && !state.winner && (
                <div className="mt-4 text-center space-x-4">
                  {currentPhase === PHASES.WERK_ROOM && (
                    <button onClick={handleEndWerkRoomPhase} className="btn-primary">End Werk Room</button>
                  )}
                  {currentPhase === PHASES.LIP_SYNC_SELECT_ATTACKER && (
                    <button onClick={handleSkipLipSync} className="btn-secondary">Skip Lip Sync</button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <button onClick={onGoToMenu} className="btn-alt fixed bottom-4 left-4 z-[100] bg-black/70 border border-pink-700/40 text-pink-200 hover:bg-pink-900 hover:text-white shadow-lg rounded-xl px-6 py-2 transition-all duration-200" title="Return to Main Menu">Back to Menu</button>
      {/* Game Over Screen */}
      {showGameOver && isReady && (
        <GameOverScreen
          winner={state?.winner ? state[state.winner] : null}
          onReturnToMenu={onGoToMenu}
        />
      )}
      {/* 5. Render EquipmentTargetModal and handle queen selection */}
      {equipmentTargetModal.isOpen && (
        <EquipmentTargetModal
          isOpen={equipmentTargetModal.isOpen}
          equipment={equipmentTargetModal.equipment}
          playerQueens={state.player1.runwaySlots}
          onSelectQueen={handleEquipmentTargetSelect}
          onClose={() => setEquipmentTargetModal({ isOpen: false, equipment: null })}
          playerName={state.player1.name}
        />
      )}
      {/* 6. Add defensive checks for LipSyncBattle */}
      {showLipSyncBattle && attackerQueenForBattle && (
        <LipSyncBattle
          show={showLipSyncBattle}
          attackerQueen={attackerQueenForBattle}
          defenderQueen={defenderQueenForBattle}
          category={lipSyncCategory}
          lipSyncResult={lipSyncResult}
          currentPhase={currentPhase}
          gameStateForWinnerName={state}
          onPhaseChange={handleLipSyncPhase}
        />
      )}
      {showLipSyncBattle && !attackerQueenForBattle && (
        <div className="text-center text-red-400 font-bold p-8">Error: Missing attacker queen for Lip Sync Battle.</div>
      )}
      {/* Queen Modal */}
      {selectedQueenModal && (
        <QueenModal slot={selectedQueenModal} onClose={() => setSelectedQueenModal(null)} />
      )}
    </div>
  );
};

// Update GameScreen to pass state and dispatch to GameScreenContent
const GameScreen = ({ onGoToMenu }) => {
  console.log('[GameScreen] Rendering');
  const { queens, equipment } = useMemo(() => ({
    queens: queensData,
    equipment: equipmentData
  }), []);

  console.log('[GameScreen] Data available:', {
    hasQueens: !!queens,
    queensLength: queens?.length,
    hasEquipment: !!equipment,
    equipmentLength: equipment?.length
  });

  const { state, dispatch } = useGameState(queens, equipment);

  console.log('[GameScreen] Game state:', {
    hasState: !!state,
    hasPlayer1: !!state?.player1,
    hasPlayer2: !!state?.player2,
    currentPhase: state?.currentPhase
  });

  return (
    <PowerManagerProvider gameState={state} dispatch={dispatch}>
      <GameScreenContent
        queens={queens}
        equipment={equipment}
        onGoToMenu={onGoToMenu}
        state={state}
        dispatch={dispatch}
      />
    </PowerManagerProvider>
  );
};

// Inline ClickToCopy component for debug JSON
const ClickToCopy = ({ value, previewLines = 10 }) => {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const lines = value.split('\n');
  const isLong = lines.length > previewLines;
  const preview = isLong && !expanded ? lines.slice(0, previewLines).join('\n') + '\n... (click Show more)' : value;

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="relative group bg-black/80 border border-pink-700/30 rounded-lg p-2 mb-2 max-w-full overflow-x-auto">
      <pre
        className="text-xs text-pink-200 whitespace-pre-wrap break-all cursor-pointer max-h-48 overflow-y-auto pr-8"
        onClick={handleCopy}
        title="Click to copy full JSON"
      >
        {preview}
      </pre>
      {isLong && !expanded && (
        <button
          className="absolute bottom-2 right-2 text-xs text-blue-400 underline bg-black/60 px-2 py-1 rounded hover:text-blue-200"
          onClick={e => { e.stopPropagation(); setExpanded(true); }}
        >
          Show more
        </button>
      )}
      {expanded && isLong && (
        <button
          className="absolute bottom-2 right-2 text-xs text-blue-400 underline bg-black/60 px-2 py-1 rounded hover:text-blue-200"
          onClick={e => { e.stopPropagation(); setExpanded(false); }}
        >
          Show less
        </button>
      )}
      <span className={`absolute top-1 right-2 text-xs font-bold transition-opacity duration-300 ${copied ? 'opacity-100 text-green-400' : 'opacity-0'}`}>Copied!</span>
    </div>
  );
};

// Helper to sync runwaySlots with runway for debug/test
function syncRunwaySlotsWithRunway(runway, runwaySlots) {
  // Copy runwaySlots so we don't mutate original
  const slots = runwaySlots.map(slot => ({ ...slot }));
  // Place each runway queen in a slot if not already present
  runway.forEach(queen => {
    if (!queen) return;
    const alreadyInSlot = slots.some(slot => slot.queen && slot.queen.instanceId === queen.instanceId);
    if (!alreadyInSlot) {
      const emptySlot = slots.find(slot => !slot.queen);
      if (emptySlot) emptySlot.queen = queen;
    }
  });
  return slots;
}

export default GameScreen;


