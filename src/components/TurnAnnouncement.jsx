// src/components/TurnAnnouncement.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useAudio } from '../contexts/AudioContext';
import { SFX_PATHS } from '../hooks/useGameState'; 

const TURN_SOUND_COOLDOWN = 7000; // 7 seconds cooldown

const TurnAnnouncement = ({ message, show, currentTurnForSound, turnNumberForSound }) => {
  const [internalShow, setInternalShow] = useState(false);
  const { playSoundEffect } = useAudio();
  
  // Using SFX_PATHS.TURN_ANNOUNCEMENT which should be sfx_queen_shade.mp3
  const SFX_FOR_TURN_ANNOUNCEMENT = SFX_PATHS.TURN_ANNOUNCEMENT; 
  
  const lastPlayedTimestampRef = useRef(0);
  // Store both turn ID and turn number to correctly identify a new turn start
  const lastPlayedTurnInfoRef = useRef({ turnId: null, turnNumber: 0 });

  useEffect(() => {
    if (show && message) {
      setInternalShow(true);
      
      const now = Date.now();
      // Play sound only if the actual player turn has changed OR the turn number has incremented,
      // AND the cooldown has passed.
      const hasActualTurnChanged = lastPlayedTurnInfoRef.current.turnId !== currentTurnForSound || 
                                   lastPlayedTurnInfoRef.current.turnNumber !== turnNumberForSound;

      if (SFX_FOR_TURN_ANNOUNCEMENT && hasActualTurnChanged && (now - lastPlayedTimestampRef.current > TURN_SOUND_COOLDOWN)) { 
        playSoundEffect(SFX_FOR_TURN_ANNOUNCEMENT, 0.35); // Reduced volume slightly for queen shade sound
        lastPlayedTimestampRef.current = now; 
        lastPlayedTurnInfoRef.current = { turnId: currentTurnForSound, turnNumber: turnNumberForSound };
      }
      
      const timer = setTimeout(() => {
        setInternalShow(false);
      }, 2500); 
      return () => clearTimeout(timer);
    } else {
      setInternalShow(false); 
    }
  }, [show, message, playSoundEffect, SFX_FOR_TURN_ANNOUNCEMENT, currentTurnForSound, turnNumberForSound]);

  if (!internalShow || !message) {
    return null;
  }

  const parts = message.split(' - ');
  const turnPlayerPart = parts[0];
  const phasePart = parts[1];

  return (
    <div 
      className={`fixed inset-0 flex items-center justify-center pointer-events-none z-[1000] transition-all duration-500 ease-in-out
                  ${internalShow ? 'opacity-100 scale-100' : 'opacity-0 scale-125'}`}
    >
      <div 
        className="text-center p-6 md:p-8 rounded-xl 
                   bg-gradient-to-br from-black/80 via-purple-900/70 to-black/80
                   border-2 border-hot-pink shadow-2xl shadow-hot-pink/50
                   backdrop-blur-md"
      >
        <h2 
          className="text-3xl sm:text-4xl md:text-5xl font-serif font-extrabold 
                     text-transparent bg-clip-text bg-gradient-to-r 
                     from-gold via-hot-pink to-orchid 
                     mb-1 md:mb-2"
          style={{ WebkitTextStroke: '1px rgba(0,0,0,0.3)', textShadow: '2px 2px 5px rgba(0,0,0,0.5)' }}
        >
          {turnPlayerPart}
        </h2>
        {phasePart && (
          <p 
            className="text-xl sm:text-2xl md:text-3xl font-sans font-semibold text-slate-200 tracking-wider"
            style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.7)' }}
          >
            {phasePart}
          </p>
        )}
      </div>
    </div>
  );
};

export default TurnAnnouncement;
