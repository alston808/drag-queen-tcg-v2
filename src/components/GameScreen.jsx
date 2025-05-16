// src/components/GameScreen.jsx
import React, { useState, useCallback, useEffect } from 'react';
import { useGameState } from '../hooks/useGameState';
import { ActionTypes, PHASES, PLAYER1_ID, PLAYER2_ID, MAX_HAND_SIZE } from '../game/constants';

import TurnAnnouncement from './TurnAnnouncement';
import QueenModal from './QueenModal';
import QueenCard from './QueenCard';
import EquipmentCard from './EquipmentCard';
import LipSyncBattle from './LipSyncBattle'; 

const GameScreen = ({ queens, equipment, onGoToMenu }) => {
  const { state, dispatch } = useGameState(queens, equipment);
  const [selectedQueenModal, setSelectedQueenModal] = useState(null);
  const [announcement, setAnnouncement] = useState({ message: '', show: false });
  const [showLipSyncBattle, setShowLipSyncBattle] = useState(false);

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

    if (isBattleRevealOrResolution && state?.selectedAttacker && state?.selectedDefender !== undefined) {
      setShowLipSyncBattle(true);
    } else {
      setShowLipSyncBattle(false);
    }
  }, [state?.currentPhase, state?.selectedAttacker, state?.selectedDefender]);


  const handleCardClickInHand = useCallback((playerId, cardInstanceId) => {
    if (!state || state.winner || showLipSyncBattle) return;
    const player = state[playerId];
    if (!player) return; 
    const card = player.hand.find(c => c.instanceId === cardInstanceId);
    if (!card) return; 

    const cardName = card.queen_name || card.card_name || `Card ${card.card_id}`;
    const isQueenCard = typeof card.charisma !== 'undefined';
    const isEquipmentCard = card.card_id?.startsWith('EQ');

    if (state.currentTurn === playerId && state.currentPhase === PHASES.WERK_ROOM) {
        if (isQueenCard) {
             dispatch({ type: ActionTypes.PLAY_QUEEN_CARD, payload: { playerId, cardInstanceId } });
        } else if (isEquipmentCard) {
             alert(`Playing equipment: ${card.card_name}. Target selection not implemented.`);
        } else {
             alert(`Viewing card: ${cardName}. Modal might not be appropriate.`);
        }
    } else {
        if (isQueenCard) setSelectedQueenModal(card);
        else if (isEquipmentCard) alert(`Viewing equipment: ${card.card_name}`);
        else alert(`Viewing card: ${cardName}`);
    }
  }, [state, dispatch, showLipSyncBattle]);

  const handleQueenClickOnRunway = useCallback((playerId, queenInstanceId) => {
     if (!state || state.winner || showLipSyncBattle) return;
     const player = state[playerId];
     if (!player) return; 
     const queen = player.runway.find(q => q.instanceId === queenInstanceId);
     if (!queen) return; 

     const queenName = queen.queen_name || `Queen ${queen.card_id}`;
    
     const isPlayer1sTurnToAttack = state.currentTurn === PLAYER1_ID && state.currentPhase === PHASES.LIP_SYNC_SELECT_ATTACKER;
     const isPlayer1sTurnToDefend = state.currentTurn === PLAYER2_ID && 
                                  state.currentPhase === PHASES.LIP_SYNC_SELECT_DEFENDER && 
                                  playerId === PLAYER1_ID;

     if (isPlayer1sTurnToAttack && playerId === PLAYER1_ID) {
         if (queen.canAttack) {
             console.log(`[UI] Player 1 selects ${queenName} to attack. Dispatching SELECT_ATTACKER then ADVANCE_PHASE.`);
             dispatch({ type: ActionTypes.SELECT_ATTACKER, payload: { queenInstanceId } });
             // Dispatch ADVANCE_PHASE immediately after SELECT_ATTACKER
             // React will batch these updates if they originate from the same event.
             dispatch({ type: ActionTypes.ADVANCE_PHASE, payload: { selectedAttacker: queenInstanceId } });
         } else {
             setSelectedQueenModal(queen); 
         }
     } 
     else if (isPlayer1sTurnToDefend) {
         console.log(`[UI] Player 1 selects ${queenName} to defend.`);
         dispatch({ type: ActionTypes.SELECT_DEFENDER, payload: { queenInstanceId } });
         dispatch({ type: ActionTypes.ADVANCE_PHASE, payload: { selectedAttacker: state.selectedAttacker } }); 
     }
     else { 
         setSelectedQueenModal(queen);
     }
  }, [state, dispatch, showLipSyncBattle]);

  const handleEndWerkRoomPhase = useCallback(() => {
      if (state && !state.winner && state.currentTurn === PLAYER1_ID && state.currentPhase === PHASES.WERK_ROOM && !showLipSyncBattle) {
          dispatch({ type: ActionTypes.ADVANCE_PHASE, payload: { selectedAttacker: state.selectedAttacker } });
      }
  }, [state, dispatch, showLipSyncBattle]);

   const handleSkipLipSync = useCallback(() => {
       if (state && !state.winner && state.currentTurn === PLAYER1_ID && state.currentPhase === PHASES.LIP_SYNC_SELECT_ATTACKER && !showLipSyncBattle) {
            console.log("[UI] Player 1 requesting skip Lip Sync.");
            dispatch({ type: ActionTypes.SELECT_ATTACKER, payload: { queenInstanceId: null } });
            dispatch({ type: ActionTypes.ADVANCE_PHASE, payload: { selectedAttacker: null } });
       }
   }, [state, dispatch, showLipSyncBattle]);

  if (!state || !state.player1 || !state.player2) {
    return <div className="text-center p-10 text-xl text-soft-white">Loading Game State...</div>;
  }

  const { player1, player2, currentTurn, currentPhase, turnNumber, winner, lipSyncCategory, lipSyncResult, selectedAttacker, selectedDefender } = state;
   const isPlayer1Turn = currentTurn === PLAYER1_ID;
   const canPlayer1PlayInWerkRoom = isPlayer1Turn && currentPhase === PHASES.WERK_ROOM;
   
   const player1NeedsToSelectDefender = 
        currentTurn === PLAYER2_ID && 
        currentPhase === PHASES.LIP_SYNC_SELECT_DEFENDER && 
        selectedAttacker !== null && 
        selectedDefender === undefined; 


  const attackerQueenForBattle = selectedAttacker ? state[currentTurn]?.runway.find(q => q.instanceId === selectedAttacker) : null;
  const defenderPlayerIdForBattle = currentTurn === PLAYER1_ID ? PLAYER2_ID : PLAYER1_ID;
  const defenderQueenForBattle = selectedDefender !== undefined ? state[defenderPlayerIdForBattle]?.runway.find(q => q.instanceId === selectedDefender) : null;


  return (
    <div className="w-full min-h-screen flex flex-col p-4 bg-gradient-to-br from-gray-900 via-purple-900 to-black text-soft-white font-sans">
        <TurnAnnouncement message={announcement.message} show={announcement.show && !showLipSyncBattle} />
        
        <LipSyncBattle
            show={showLipSyncBattle}
            attackerQueen={attackerQueenForBattle}
            defenderQueen={defenderQueenForBattle}
            category={lipSyncCategory}
            lipSyncResult={lipSyncResult}
            currentPhase={currentPhase}
            gameStateForWinnerName={state}
        />

        <div className={showLipSyncBattle ? 'opacity-0 pointer-events-none h-0 overflow-hidden' : 'opacity-100 transition-opacity duration-300 flex flex-col flex-grow'}>
            {/* Header */}
            <div className="flex justify-between items-center mb-4 p-3 bg-dark-glass rounded-lg shadow-lg border border-white/10">
                <div className="text-left w-1/3"> <h2 className="text-xl font-semibold text-red-400 truncate" title={player2.name}>{player2.name}</h2> <p>Shantay: <span className="font-bold text-xl">{player2.shantayPoints}</span> | Gag: <span className="font-bold text-xl">{player2.gagTokens}</span></p> <p className="text-sm">Hand: {player2.hand.length}|D: {player2.deck.length}|R: {player2.runway.length}</p> </div>
                <div className="text-center w-1/3"> {winner ? ( <h1 className="text-3xl font-bold text-gold animate-pulse">GAME OVER! {state[winner]?.name || winner} Wins!</h1> ) : ( <> <h1 className="text-2xl font-bold text-gold">Turn {turnNumber}</h1> </> )} </div>
                <div className="text-right w-1/3"> <h2 className="text-xl font-semibold text-blue-400 truncate" title={player1.name}>{player1.name}</h2> <p>Shantay: <span className="font-bold text-xl">{player1.shantayPoints}</span> | Gag: <span className="font-bold text-xl">{player1.gagTokens}</span></p> <p className="text-sm">Hand: {player1.hand.length}|D: {player1.deck.length}|R: {player1.runway.length}</p> </div>
            </div>

            {/* Player 2 (CPU) Runway */}
            <div className="mb-4 p-3 bg-black/30 rounded-lg min-h-[220px] border border-white/10">
                <h3 className="text-lg font-semibold mb-2 text-red-300">{player2.name}'s Runway</h3>
                <div className="flex justify-center items-center gap-3 flex-wrap min-h-[180px]">
                    {player2.runway.length > 0 ? player2.runway.map(q => (
                        <div key={q.instanceId} className="relative group transform transition-transform hover:scale-105">
                            <QueenCard {...q} onClick={() => handleQueenClickOnRunway(PLAYER2_ID, q.instanceId)} />
                            {q.shadeTokens > 0 && ( <div className="absolute -top-2 -right-2 bg-gradient-to-br from-red-500 to-red-800 text-white text-xs font-bold rounded-full px-2 py-1 shadow-lg border border-black/50">{q.shadeTokens} S</div> )}
                        </div>
                    )) : ( <p className="text-gray-400 italic self-center">Runway empty</p> )}
                </div>
            </div>

            <div className="flex-grow flex flex-col">
                {/* Player 1 Runway */}
                <div className="mb-4 p-3 bg-black/30 rounded-lg min-h-[220px] border border-white/10">
                    <h3 className="text-lg font-semibold mb-2 text-blue-300">{player1.name}'s Runway</h3>
                    <div className="flex justify-center items-center gap-3 flex-wrap min-h-[180px]">
                        {player1.runway.length > 0 ? player1.runway.map(q => (
                            <div key={q.instanceId} className="relative group transform transition-transform hover:scale-105">
                                <QueenCard {...q} onClick={() => handleQueenClickOnRunway(PLAYER1_ID, q.instanceId)} />
                                {q.shadeTokens > 0 && ( <div className="absolute -top-2 -right-2 bg-gradient-to-br from-red-500 to-red-800 text-white text-xs font-bold rounded-full px-2 py-1 shadow-lg border border-black/50">{q.shadeTokens} S</div> )}
                                {!q.canAttack && ( <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center text-gray-300 font-bold text-sm rounded-xl pointer-events-none">Getting into Geish</div> )}
                                {currentPhase === PHASES.LIP_SYNC_SELECT_ATTACKER && isPlayer1Turn && q.canAttack && (
                                    <div className="absolute inset-0 bg-green-600/60 backdrop-blur-sm flex items-center justify-center text-white font-bold text-lg rounded-xl cursor-pointer ring-2 ring-green-300 ring-offset-2 ring-offset-black/50 animate-pulse"
                                        onClick={() => handleQueenClickOnRunway(PLAYER1_ID, q.instanceId)}
                                    >Select Attacker</div>
                                )}
                                {player1NeedsToSelectDefender && ( 
                                    <div className="absolute inset-0 bg-blue-600/60 backdrop-blur-sm flex items-center justify-center text-white font-bold text-lg rounded-xl cursor-pointer ring-2 ring-blue-300 ring-offset-2 ring-offset-black/50 animate-pulse"
                                         onClick={() => handleQueenClickOnRunway(PLAYER1_ID, q.instanceId)}
                                    >Select Defender</div>
                                )}
                            </div>
                        )) : ( <p className="text-gray-400 italic self-center">Runway empty</p> )}
                    </div>
                </div>

                {/* Player 1 Hand & Action Buttons */}
                <div className="p-3 bg-dark-glass rounded-lg border border-white/10">
                <h3 className="text-lg font-semibold mb-2 text-blue-300">{player1.name}'s Hand ({player1.hand.length}/{MAX_HAND_SIZE})</h3>
                <div className={`flex justify-center items-end gap-2 flex-wrap min-h-[180px] ${canPlayer1PlayInWerkRoom ? 'cursor-pointer' : ''}`}>
                    {player1.hand.length > 0 ? player1.hand.map((card) => (
                        <div key={card.instanceId} className={`transform transition-transform duration-200 ${canPlayer1PlayInWerkRoom ? 'hover:-translate-y-3' : ''}`}>
                            {(typeof card.charisma !== 'undefined') ? (
                                <QueenCard {...card} onClick={() => handleCardClickInHand(PLAYER1_ID, card.instanceId)} />
                            ) : card.card_id?.startsWith('EQ') ? ( 
                                <EquipmentCard equipment={card} onCardClick={() => handleCardClickInHand(PLAYER1_ID, card.instanceId)} />
                            ) : (
                                <div className="w-[120px] h-[168px] bg-gray-700 border-gray-500 rounded-lg flex flex-col items-center justify-center text-center p-2"
                                    onClick={() => handleCardClickInHand(PLAYER1_ID, card.instanceId)} >
                                    <p className="text-xs text-red-400 mb-1">Unknown Card</p>
                                    <p className="text-xxs break-words">{card.card_name || card.card_id}</p>
                                </div>
                            )}
                        </div>
                    )) : ( <p className="text-gray-400 italic self-center">Hand empty</p> )}
                    </div>
                    {isPlayer1Turn && !winner && (
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

        {selectedQueenModal && !showLipSyncBattle && ( 
            <QueenModal 
                queen={selectedQueenModal} 
                onClose={() => setSelectedQueenModal(null)} 
            /> 
        )}
         <button onClick={onGoToMenu} className="btn-alt fixed bottom-4 left-4 z-[100]" title="Return to Main Menu">Back to Menu</button>
    </div>
  );
};
export default GameScreen;


