// src/components/LipSyncBattle.jsx
import React, { useEffect, useState, useRef } from 'react';
import { PHASES, PLAYER1_ID, PLAYER2_ID } from '../game/constants';
import { useAudio } from '../contexts/AudioContext';
import { LIP_SYNC_INTRO_SFX_USER_OPTIONS, SFX_PATHS } from '../hooks/useGameState';
import { DotPattern } from '@/components/ui/dot-pattern';

const MAINSTAGE_IMAGES = [
  '/assets/images/ui/mainstage1.jpg',
  '/assets/images/ui/mainstage2.jpg',
];

// Helper to calculate effective stat with equipment boosts
function getEffectiveStat(queen, stat) {
  const base = queen.originalStats?.[stat] ?? queen[stat] ?? 0;
  let boost = 0;
  if (queen.equipment) {
    for (const eq of queen.equipment) {
      if (eq.stat_boost) {
        for (const sb of eq.stat_boost) {
          if (sb.stat === stat) boost += sb.value;
        }
      }
    }
  }
  return base + boost;
}

const LipSyncBattle = ({
  show,
  attackerQueen,
  defenderQueen,
  category,
  lipSyncResult,
  currentPhase,
  gameStateForWinnerName,
  onPhaseChange
}) => {
  const [attackerAnim, setAttackerAnim] = useState('');
  const [defenderAnim, setDefenderAnim] = useState('');
  const [categoryAnim, setCategoryAnim] = useState('');
  const [vsTextAnim, setVsTextAnim] = useState('');
  const [showScores, setShowScores] = useState(false);
  const [showShantayMessage, setShowShantayMessage] = useState(false);
  const [shantayMessageText, setShantayMessageText] = useState('');
  const [showCategory, setShowCategory] = useState(false);
  
  // States for visual effects on queens
  const [attackerVisualEffect, setAttackerVisualEffect] = useState('');
  const [defenderVisualEffect, setDefenderVisualEffect] = useState('');
  const [mainstageImage, setMainstageImage] = useState(MAINSTAGE_IMAGES[0]);

  const { playSoundEffect } = useAudio();
  const introSoundPlayedRef = useRef(false);
  const animationTimersRef = useRef([]);

  // Clear all animation timers on unmount or when show changes
  useEffect(() => {
    return () => {
      animationTimersRef.current.forEach(timer => clearTimeout(timer));
      animationTimersRef.current = [];
    };
  }, [show]);

  // Play sound effect with error handling
  const playSoundWithFallback = (soundPath, volume = 1.0) => {
    if (!soundPath) return;
    
    try {
      if (playSoundEffect) {
        playSoundEffect(soundPath, volume);
      }
    } catch (err) {
      console.warn('Sound effect playback failed:', err);
    }
  };

  useEffect(() => {
    if (show) {
      // Reset all states and clear any existing timers
      animationTimersRef.current.forEach(timer => clearTimeout(timer));
      animationTimersRef.current = [];
      
      setAttackerAnim('');
      setDefenderAnim('');
      setCategoryAnim('');
      setVsTextAnim('');
      setShowScores(false);
      setShowShantayMessage(false);
      setShowCategory(false);
      setAttackerVisualEffect('');
      setDefenderVisualEffect('');
      
      // Reset intro sound flag when show becomes false
      if (!introSoundPlayedRef.current) {
        if (LIP_SYNC_INTRO_SFX_USER_OPTIONS?.length > 0) {
          const randomIntroSfx = LIP_SYNC_INTRO_SFX_USER_OPTIONS[Math.floor(Math.random() * LIP_SYNC_INTRO_SFX_USER_OPTIONS.length)];
          playSoundWithFallback(randomIntroSfx, 0.7);
        }
        introSoundPlayedRef.current = true;
      }

      // Start animation sequence with a small delay to ensure state resets are complete
      const timer1 = setTimeout(() => {
        setAttackerAnim('animate-slideInFromLeftVS');
        setDefenderAnim('animate-slideInFromRightVS');
      }, 100);
      animationTimersRef.current.push(timer1);

      const timer2 = setTimeout(() => {
        setVsTextAnim('animate-textPopVS');
      }, 1000);
      animationTimersRef.current.push(timer2);

      // Show category with animation
      if (category) {
        const timer3 = setTimeout(() => {
          setShowCategory(true);
          setCategoryAnim('animate-cuntFlash');
          playSoundWithFallback(SFX_PATHS.CATEGORY_REVEAL);
          if (onPhaseChange) onPhaseChange(PHASES.LIP_SYNC_REVEAL);
        }, 2000);
        animationTimersRef.current.push(timer3);
      }

      // Handle resolution phase
      if (currentPhase === PHASES.LIP_SYNC_RESOLUTION && lipSyncResult) {
        const timer4 = setTimeout(() => {
          setShowScores(true);
          playSoundWithFallback(SFX_PATHS.SCORE_REVEAL);

          // Apply visual effects for winner/loser
          if (lipSyncResult.winner && lipSyncResult.winner !== 'tie') {
            const isAttackerWinner = lipSyncResult.winner === attackerQueen?.ownerId || 
                                   lipSyncResult.winner === attackerQueen?.id || 
                                   (gameStateForWinnerName?.currentTurn === attackerQueen?.ownerId && 
                                    lipSyncResult.winner === gameStateForWinnerName?.currentTurn);
            
            if (isAttackerWinner) {
              setDefenderVisualEffect('animate-lipSyncLoser');
            } else {
              setAttackerVisualEffect('animate-lipSyncLoser');
            }
          } else if (lipSyncResult.winner === 'tie') {
            setAttackerVisualEffect('opacity-80');
            setDefenderVisualEffect('opacity-80');
          }

          // Set shantay message
          let message = "";
          let sfxToPlay = null;

          if (lipSyncResult.winner && lipSyncResult.winner !== 'tie') {
            const winnerPlayerObject = gameStateForWinnerName?.[lipSyncResult.winner];
            const winningQueen = lipSyncResult.winner === attackerQueen?.ownerId ? attackerQueen : defenderQueen;
            const winnerName = winningQueen?.queen_name || winnerPlayerObject?.name || 'A Queen';
            message = `${winnerName}, Shantay You Stay!`;
            sfxToPlay = SFX_PATHS.SHANTAY_STAY;
          } else if (lipSyncResult.winner === 'tie') {
            message = "It's a TIE, Shantay You Both Stay (for now)!";
            sfxToPlay = SFX_PATHS.LIPSYNC_TIE;
          }

          setShantayMessageText(message);

          const timer5 = setTimeout(() => {
            setShowShantayMessage(true);
            if (sfxToPlay) playSoundWithFallback(sfxToPlay);
          }, 1000);
          animationTimersRef.current.push(timer5);
        }, category ? 3500 : 2500);
        animationTimersRef.current.push(timer4);
      }

      // Randomly select a mainstage image each time the battle is shown
      setMainstageImage(MAINSTAGE_IMAGES[Math.floor(Math.random() * MAINSTAGE_IMAGES.length)]);
    } else {
      // Reset intro sound flag when show becomes false
      introSoundPlayedRef.current = false;
      // Clear all animation timers when component is hidden
      animationTimersRef.current.forEach(timer => clearTimeout(timer));
      animationTimersRef.current = [];
    }

    // Cleanup function to clear any remaining timers
    return () => {
      animationTimersRef.current.forEach(timer => clearTimeout(timer));
      animationTimersRef.current = [];
    };
  }, [show, category, currentPhase, lipSyncResult, attackerQueen, defenderQueen, gameStateForWinnerName, onPhaseChange]);

  if (!show || !attackerQueen) return null;

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

  // Example usage: get effective stat for the battle category
  // const attackerStat = getEffectiveStat(attackerQueen, category?.toLowerCase());
  // const defenderStat = defenderQueen ? getEffectiveStat(defenderQueen, category?.toLowerCase()) : 0;

  return (
    <div className={`fixed inset-0 z-[2000] overflow-hidden flex items-center justify-center`}> 
      {/* Mainstage background image */}
      <img src={mainstageImage} alt="Mainstage" className="absolute inset-0 w-full h-full object-cover z-0 transition-all duration-700 ease-in-out" style={{filter:'brightness(0.85)'}} />
      {/* Animated dots background */}
      <DotPattern glow={true} cr={2} className="absolute inset-0 w-full h-full text-white/60 opacity-0 animate-fadeInDotPattern z-0" />
      {/* Glassmorphic blurred gradient overlay */}
      <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-pink-900/60 via-purple-900/40 to-blue-900/60 backdrop-blur-2xl opacity-30 pointer-events-none z-10 transition-all duration-700 ease-in-out animate-fadeInGlass" />
      <div className="relative w-full h-full flex items-stretch justify-center z-20">
        {/* Attacker Side - left half */}
        <div className={`flex-1 flex flex-col items-center justify-end relative overflow-hidden ${attackerAnim} ${attackerVisualEffect}`}> 
          <div className="flex-1 flex items-end justify-center">
            <img src={attackerImageUrl} alt={attackerQueen.queen_name} className="w-full h-full object-cover object-bottom drop-shadow-2xl transition-all duration-700 ease-in-out" style={{maxHeight:'100vh'}} />
          </div>
          {/* Name overlay */}
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-8 flex justify-center transition-all duration-700 ease-in-out">
            <span className="bg-black/70 text-white text-3xl md:text-4xl font-extrabold px-6 py-2 rounded-xl shadow-lg border-2 border-pink-400/40 backdrop-blur-sm transition-all duration-700 ease-in-out">
              {attackerQueen.queen_name}
            </span>
          </div>
        </div>
        {/* Center VS and category */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-30 pointer-events-none transition-all duration-700 ease-in-out">
          <div className={`text-7xl md:text-8xl font-extrabold text-white drop-shadow-lg ${vsTextAnim} transition-all duration-700 ease-in-out`}
               style={{ WebkitTextStroke: '2px black', textShadow: '0 0 15px #FF1493, 0 0 25px #FF1493, 0 0 35px #FF1493' }}>
            VS
          </div>
          {showCategory && (
            <div className={`mt-4 text-5xl md:text-6xl font-serif font-black tracking-widest ${getStatColor(category)} ${categoryAnim} transition-all duration-700 ease-in-out`}
                 style={{textShadow: `0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px ${getStatColor(category).replace('text-', '')}, 2px 2px 2px rgba(0,0,0,0.5)`}}>
              {category.toUpperCase()}!
            </div>
          )}
          {showScores && lipSyncResult && (
            <div className="mt-8 p-4 bg-black/70 rounded-lg text-center animate-fadeInScaleUpVS backdrop-blur-sm border border-white/20 transition-all duration-700 ease-in-out">
              <p className={`text-2xl md:text-3xl font-bold ${lipSyncResult.winner === attackerQueen?.ownerId || lipSyncResult.winner === attackerQueen?.id ? 'text-gold scale-110' : 'text-slate-300'}`}>
                {attackerQueen.queen_name}: {lipSyncResult.attackerScore}
              </p>
              <p className={`text-2xl md:text-3xl font-bold ${lipSyncResult.winner === defenderQueen?.ownerId || lipSyncResult.winner === defenderQueen?.id ? 'text-gold scale-110' : 'text-slate-300'}`}>
                {defenderQueen ? `${defenderQueen.queen_name}: ${lipSyncResult.defenderScore}` : 'Sashay away.'}
              </p>
            </div>
          )}
          {showShantayMessage && (
            <div className="mt-8 text-center animate-fadeInScaleUpVS transition-all duration-700 ease-in-out">
              <p className="text-3xl md:text-4xl font-serif font-bold text-gold bg-black/70 px-6 py-3 rounded-xl shadow-lg transition-all duration-700 ease-in-out" 
                 style={{textShadow: '2px 2px 8px rgba(0,0,0,0.7), 0 0 15px #FFD700'}}>
                {shantayMessageText}
              </p>
            </div>
          )}
        </div>
        {/* Defender Side - right half */}
        <div className={`flex-1 flex flex-col items-center justify-end relative overflow-hidden ${defenderAnim} ${defenderVisualEffect}`}> 
          <div className="flex-1 flex items-end justify-center">
            <img src={defenderImageUrl} alt={defenderQueen?.queen_name || 'Defender'} className="w-full h-full object-cover object-bottom drop-shadow-2xl transition-all duration-700 ease-in-out" style={{maxHeight:'100vh'}} />
          </div>
          {/* Name overlay */}
          {defenderQueen && (
            <div className="absolute bottom-0 left-0 right-0 px-4 pb-8 flex justify-center transition-all duration-700 ease-in-out">
              <span className="bg-black/70 text-white text-3xl md:text-4xl font-extrabold px-6 py-2 rounded-xl shadow-lg border-2 border-blue-400/40 backdrop-blur-sm transition-all duration-700 ease-in-out">
                {defenderQueen.queen_name}
              </span>
            </div>
          )}
        </div>
      </div>
      {/* Animations for fade in */}
      <style>{`
        @keyframes fadeInDotPattern { from { opacity: 0; } to { opacity: 0.6; } }
        @keyframes fadeInGlass { from { opacity: 0; } to { opacity: 0.3; } }
      `}</style>
    </div>
  );
};

export default LipSyncBattle;
