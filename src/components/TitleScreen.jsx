// src/components/TitleScreen.jsx
import React, { useState, useEffect } from 'react';

const TitleScreen = ({ onStartClick, queens }) => {
  const [currentQueenIndex, setCurrentQueenIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    if (!queens || queens.length === 0) return;
    const timer = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrentQueenIndex((prevIndex) => (prevIndex + 1) % queens.length);
        setFade(true);
      }, 500);
    }, 5000);
    return () => clearInterval(timer);
  }, [queens]);

  if (!queens || queens.length === 0) {
    // Fallback
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-blue-violet p-8 text-center">
        {/* Fallback Logo - Text Based */}
        <div className="mb-8">
          <h1 className="text-5xl sm:text-7xl font-serif font-extrabold text-gold" style={{ textShadow: '3px 3px 5px rgba(0,0,0,0.7)' }}>
            RuPaul's Drag Race
          </h1>
          <p className="text-xl sm:text-2xl font-sans font-semibold text-hot-pink tracking-[0.2em] sm:tracking-[0.3em] uppercase mt-1" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
            Trading Card Game
          </p>
        </div>
        <p className="text-xl text-soft-white mb-8">Loading Queens...</p>
        <button
          onClick={onStartClick}
          className="bg-hot-pink hover:bg-deep-pink text-white font-bold py-3 px-8 rounded-lg text-2xl shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105"
        >
          START
        </button>
      </div>
    );
  }

  const currentQueen = queens[currentQueenIndex];
  const imageUrl = currentQueen.image_file_name
    ? `/assets/images/queens_art/${currentQueen.image_file_name}`
    : '/assets/images/ui/placeholder_queen.png'; 

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <div className="absolute inset-0 animated-gradient-background z-0"></div>
      <div className="absolute inset-0 z-10">
        <img
          key={currentQueenIndex}
          src={imageUrl}
          alt={`${currentQueen.queen_name || 'Background'} full screen`}
          className={`w-full h-full object-cover transition-opacity duration-500 ease-in-out ${
            fade ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <div className="absolute inset-0 bg-black/50"></div>
      </div>

      <div className="relative z-20 flex flex-col items-center justify-center h-full text-center p-4 sm:p-8">
        {/* Main Game Logo - USING IMAGE */}
        <div className="mb-6 sm:mb-10">
          <img
            src="/assets/images/ui/game_logo_main.png" // UPDATE THIS PATH IF YOURS IS DIFFERENT
            alt="RuPaul's Drag Race Trading Card Game Logo"
            className="w-auto h-24 sm:h-32 md:h-40 max-w-[80%] sm:max-w-md md:max-w-lg mx-auto drop-shadow-xl" // Adjust sizing as needed
          />
        </div>

        {/* Edition Logo - USING IMAGE */}
        <div className="mb-8 sm:mb-12">
          <img
            src="/assets/images/ui/edition_logo_as10.png" // UPDATE THIS PATH IF YOURS IS DIFFERENT
            alt="All Stars 10 Edition"
            className="w-auto h-12 sm:h-16 md:h-20 max-w-[60%] sm:max-w-xs mx-auto opacity-90 drop-shadow-lg" // Adjust sizing as needed
          />
        </div>

        <button
          onClick={onStartClick}
          className="bg-hot-pink hover:bg-deep-pink text-white font-bold py-3 sm:py-4 px-8 sm:px-12 rounded-lg text-xl sm:text-2xl shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 border-2 border-white/50 hover:border-white"
        >
          Sissy That START!
        </button>
      </div>
    </div>
  );
};

export default TitleScreen;