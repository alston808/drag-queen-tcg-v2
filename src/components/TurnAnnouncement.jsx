// src/components/TurnAnnouncement.jsx
import React, { useEffect, useState } from 'react';
import { useAudio } from '../contexts/AudioContext'; // To play sound effects

const TurnAnnouncement = ({ message, show }) => {
  const [internalShow, setInternalShow] = useState(false);
  const { playSoundEffect } = useAudio();
  const SFX_TURN_CHANGE = '/assets/audio/sfx_turn_ping.ogg'; // Placeholder sound effect

  useEffect(() => {
    if (show && message) {
      setInternalShow(true);
      playSoundEffect(SFX_TURN_CHANGE); // Play sound when message appears
      const timer = setTimeout(() => {
        setInternalShow(false);
      }, 2500); // Display for 2.5 seconds
      return () => clearTimeout(timer);
    } else {
      setInternalShow(false); // Ensure it's hidden if show is false or no message
    }
  }, [show, message, playSoundEffect]);

  if (!internalShow || !message) {
    return null;
  }

  // Split message for styling, e.g., "Player 1's Turn" and "Werk Room"
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
