// src/components/LipSyncBattle.jsx
import React, { useEffect, useState, useRef } from 'react';
import { PHASES, PLAYER1_ID, PLAYER2_ID } from '../game/constants'; // Added PLAYER_ID constants
import { useAudio } from '../contexts/AudioContext';

const LIP_SYNC_INTRO_SFX_OPTIONS = [
  '/assets/audio/sfx_lipsync_intro_1.ogg',
  '/assets/audio/sfx_lipsync_intro_2.ogg',
  '/assets/audio/sfx_lipsync_intro_3.ogg',
];

const LipSyncBattle = ({
  show,
  attackerQueen,
  defenderQueen,
  category,
  lipSyncResult,
  currentPhase,
  gameStateForWinnerName 
}) => {
  const [attackerAnim, setAttackerAnim] = useState('');
  const [defenderAnim, setDefenderAnim] = useState('');
  const [categoryAnim, setCategoryAnim] = useState('');
  const [vsTextAnim, setVsTextAnim] = useState('');
  const [showScores, setShowScores] = useState(false);
  const [showShantayMessage, setShowShantayMessage] = useState(false);
  const [shantayMessageText, setShantayMessageText] = useState('');

  const { playSoundEffect } = useAudio();
  const introSoundPlayedRef = useRef(false); 

  const SFX_CATEGORY_REVEAL = '/assets/audio/sfx_category_reveal.ogg';
  const SFX_SCORE_REVEAL = '/assets/audio/sfx_score_reveal.ogg';
  const SFX_SHANTAY = '/assets/audio/sfx_shantay.ogg'; // Placeholder for "Shantay you stay"
  const SFX_SASHAY = '/assets/audio/sfx_sashay.ogg';   // Placeholder for "Sashay away" (played by game logic later)


  useEffect(() => {
    let vsTimer, categoryTimer, scoreTimer, shantayTimer;

    if (show) {
      if (!introSoundPlayedRef.current) {
        const randomIntroSfx = LIP_SYNC_INTRO_SFX_OPTIONS[Math.floor(Math.random() * LIP_SYNC_INTRO_SFX_OPTIONS.length)];
        playSoundEffect(randomIntroSfx, 0.7);
        introSoundPlayedRef.current = true;
      }

      setAttackerAnim('animate-slideInFromLeftVS'); // Duration: 0.7s, Delay: 0.2s -> Ends at 0.9s
      setDefenderAnim('animate-slideInFromRightVS'); // Duration: 0.7s, Delay: 0.2s -> Ends at 0.9s
      
      vsTimer = setTimeout(() => {
        setVsTextAnim('animate-textPopVS'); // Duration: 0.8s -> Ends at 0.8s from its start
      }, 200); // Start VS text slightly after queens start moving

      categoryTimer = setTimeout(() => {
        if (category) {
            setCategoryAnim('animate-cuntFlash'); // Using cuntFlash for category now
            playSoundEffect(SFX_CATEGORY_REVEAL);
        }
      }, 1000); // Start category after VS text is likely visible (0.2s + 0.8s = 1.0s)

      if (currentPhase === PHASES.LIP_SYNC_RESOLUTION && lipSyncResult) {
        scoreTimer = setTimeout(() => {
          setShowScores(true);
          playSoundEffect(SFX_SCORE_REVEAL);

          // Determine Shantay/Sashay message
          let message = "";
          let winnerName = "";
          if (lipSyncResult.winner && lipSyncResult.winner !== 'tie') {
            const winnerPlayerObject = gameStateForWinnerName?.[lipSyncResult.winner];
            winnerName = winnerPlayerObject?.name || 'A Queen'; // Fallback
            
            // Determine which queen object is the winner
            let winningQueenObject;
            if (lipSyncResult.winner === attackerQueen?.ownerId || lipSyncResult.winner === attackerQueen?.id) { // Check against attacker
                winningQueenObject = attackerQueen;
            } else if (defenderQueen && (lipSyncResult.winner === defenderQueen?.ownerId || lipSyncResult.winner === defenderQueen?.id)) { // Check against defender
                winningQueenObject = defenderQueen;
            }
            winnerName = winningQueenObject?.queen_name || winnerName; // Prefer specific queen name
            message = `${winnerName}, Shantay You Stay!`;
            playSoundEffect(SFX_SHANTAY);
          } else if (lipSyncResult.winner === 'tie') {
            message = "It's a TIE, Shantay You Both Stay (for now)!";
            // playSoundEffect(SFX_SHANTAY); // Or a specific tie sound
          }
          // Note: "Sashay Away" for the loser is better handled visually on the game board
          // when the queen is actually removed, as this component doesn't know total shade.
          
          setShantayMessageText(message);
          shantayTimer = setTimeout(() => {
            setShowShantayMessage(true); // This will trigger its own animation
          }, 1000); // Show Shantay message 1s after scores

        }, category ? 2200 : 1700); // Start scores after category (1.0s + 1.2s = 2.2s)
      } else {
        setShowScores(false);
        setShowShantayMessage(false);
      }
      
    } else {
      setAttackerAnim('');
      setDefenderAnim('');
      setCategoryAnim('');
      setVsTextAnim('');
      setShowScores(false);
      setShowShantayMessage(false);
      setShantayMessageText('');
      introSoundPlayedRef.current = false;
    }

    return () => {
      clearTimeout(vsTimer);
      clearTimeout(categoryTimer);
      clearTimeout(scoreTimer);
      clearTimeout(shantayTimer);
    };
  }, [show, category, currentPhase, lipSyncResult, playSoundEffect, attackerQueen, defenderQueen, gameStateForWinnerName]);

  if (!show || !attackerQueen) {
    return null;
  }

  const attackerImageUrl = attackerQueen.image_file_name 
    ? `/assets/images/queens_art/${attackerQueen.image_file_name}` 
    : '/assets/images/ui/placeholder_queen.png';
  
  const defenderImageUrl = defenderQueen?.image_file_name 
    ? `/assets/images/queens_art/${defenderQueen.image_file_name}` 
    : '/assets/images/ui/placeholder_transparent.png';

  const getStatColor = (statName) => {
    switch (statName?.toLowerCase()) {
      case 'charisma': return 'text-orchid';
      case 'uniqueness': return 'text-deep-sky-blue';
      case 'nerve': return 'text-hot-pink';
      case 'talent': return 'text-dark-orange';
      default: return 'text-gold';
    }
  };
  
  const getWinnerPlayerName = () => { // Renamed to avoid conflict
    if (!lipSyncResult || !lipSyncResult.winner || lipSyncResult.winner === 'tie' || !gameStateForWinnerName) {
        return null;
    }
    return gameStateForWinnerName[lipSyncResult.winner]?.name || 'A Queen';
  }

  return (
    <div 
      className={`fixed inset-0 bg-black/90 backdrop-blur-2xl flex flex-col items-center justify-center z-[2000] overflow-hidden
                  transition-opacity duration-300 ease-in-out ${show ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
    >
      <div className="relative w-full h-full flex items-center justify-around p-2 sm:p-4 md:p-8">
        {/* Attacker Side */}
        <div className={`w-2/5 md:w-1/3 h-full flex flex-col items-center justify-center transform ${attackerAnim} opacity-0`}>
          <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md aspect-[3/4] mb-4 filter drop-shadow-[-8px_8px_15px_rgba(255,105,180,0.4)]">
            <img src={attackerImageUrl} alt={attackerQueen.queen_name} className="w-full h-full object-contain" />
          </div>
          <p className="text-xl md:text-2xl lg:text-3xl font-bold text-white mt-2 text-center" style={{textShadow: '2px 2px 5px rgba(0,0,0,0.8)'}}>
              {attackerQueen.queen_name}
          </p>
        </div>

        {/* Center Area - VS, Category, C.U.N.T Flash, Scores, Shantay Message */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none space-y-3 md:space-y-6">
            <div className={`text-5xl sm:text-6xl md:text-8xl lg:text-9xl font-extrabold text-white transform ${vsTextAnim} opacity-0`}
                 style={{ WebkitTextStroke: '2px black', textShadow: '0 0 15px #FF1493, 0 0 25px #FF1493, 0 0 35px #FF1493' }}>
                VS
            </div>

            {category && (
                 <div className={`text-4xl sm:text-5xl md:text-7xl font-serif font-black tracking-widest animate-cuntFlash ${getStatColor(category)} ${categoryAnim} opacity-0`}
                      style={{textShadow: `0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px ${getStatColor(category).replace('text-', '')}, 2px 2px 2px rgba(0,0,0,0.5)`}}>
                    {category.toUpperCase()}!
                </div>
            )}
            
            {showScores && lipSyncResult && (
                <div className="mt-3 md:mt-4 p-3 md:p-4 bg-black/60 rounded-lg text-center animate-fadeInScaleUpVS backdrop-blur-sm border border-white/20">
                    <p className={`text-lg sm:text-xl md:text-2xl font-bold ${lipSyncResult.winner === attackerQueen?.ownerId || lipSyncResult.winner === attackerQueen?.id ? 'text-gold scale-110' : 'text-slate-300'}`}>
                        {attackerQueen.queen_name}: {lipSyncResult.attackerScore}
                    </p>
                    <p className={`text-lg sm:text-xl md:text-2xl font-bold ${lipSyncResult.winner === defenderQueen?.ownerId || lipSyncResult.winner === defenderQueen?.id ? 'text-gold scale-110' : 'text-slate-300'}`}>
                        {defenderQueen ? `${defenderQueen.queen_name}: ${lipSyncResult.defenderScore}` : 'No Defender: -'}
                    </p>
                </div>
            )}

            {showShantayMessage && shantayMessageText && (
                <div className="mt-3 md:mt-5 text-center animate-fadeInScaleUpVS">
                    <p className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-gold" style={{textShadow: '2px 2px 8px rgba(0,0,0,0.7), 0 0 15px #FFD700'}}>
                        {shantayMessageText}
                    </p>
                </div>
            )}
        </div>

        {/* Defender Side */}
        <div className={`w-2/5 md:w-1/3 h-full flex flex-col items-center justify-center transform ${defenderAnim} opacity-0`}>
          {defenderQueen && (
            <>
            <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md aspect-[3/4] mb-4 filter drop-shadow-[8px_8px_15px_rgba(0,191,255,0.4)]">
              <img src={defenderImageUrl} alt={defenderQueen.queen_name} className="w-full h-full object-contain" />
            </div>
            <p className="text-xl md:text-2xl lg:text-3xl font-bold text-white mt-2 text-center" style={{textShadow: '2px 2px 5px rgba(0,0,0,0.8)'}}>
                {defenderQueen.queen_name}
            </p>
            </>
          )}
           {!defenderQueen && currentPhase !== PHASES.LIP_SYNC_SELECT_DEFENDER && (
            <div className="text-xl md:text-2xl text-slate-500 italic">No Defender</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LipSyncBattle;
