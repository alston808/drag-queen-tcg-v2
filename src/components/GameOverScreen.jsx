import React from 'react';
import { useAudio } from '../contexts/AudioContext';
import { SFX_PATHS } from '../hooks/useGameState';

const GameOverScreen = ({ winner, onReturnToMenu }) => {
  const { playSoundEffect } = useAudio();

  React.useEffect(() => {
    // Play game over sound when component mounts
    playSoundEffect(SFX_PATHS.GAME_OVER_FANFARE, 0.8);
  }, [playSoundEffect]);

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/90">
      <div className="bg-gradient-to-br from-purple-900 via-pink-900 to-red-900 p-8 rounded-lg shadow-2xl border-2 border-gold/50 max-w-2xl w-full mx-4 text-center transform transition-all duration-500 animate-fade-in">
        <h1 className="text-4xl md:text-6xl font-bold text-gold mb-6 animate-pulse">
          Game Over!
        </h1>
        
        <div className="mb-8">
          <h2 className="text-2xl md:text-4xl font-semibold text-white mb-4">
            {winner ? (
              <>
                <span className="text-hot-pink">{winner.name}</span>
                <span className="text-white"> Wins!</span>
              </>
            ) : (
              "It's a Tie!"
            )}
          </h2>
          
          <p className="text-xl text-soft-white mb-6">
            {winner ? (
              <>
                <span className="text-gold">Shantay Points: </span>
                {winner.shantayPoints}
              </>
            ) : (
              "Both players have been eliminated!"
            )}
          </p>
        </div>

        <button
          onClick={onReturnToMenu}
          className="btn-primary text-xl px-8 py-3 transform hover:scale-105 transition-transform duration-200"
        >
          Return to Main Menu
        </button>
      </div>
    </div>
  );
};

export default GameOverScreen; 