// src/components/TitleScreenMenu.jsx
import React, { useState, useEffect } from 'react';

const TitleScreenMenu = ({ onNavigateToQueenAlbum, onNavigateToEquipmentAlbum, onStartGame, queens }) => {
  const [currentQueenIndex, setCurrentQueenIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    if (!queens || queens.length === 0) return;
    const timer = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrentQueenIndex((prevIndex) => (prevIndex + 1) % queens.length);
        setFade(true);
      }, 700); // CSS transition duration
    }, 6000); // Change image every 6 seconds
    return () => clearInterval(timer);
  }, [queens]);

  const currentQueen = (queens && queens.length > 0) ? queens[currentQueenIndex] : null;
  const imageUrl = currentQueen?.image_file_name
    ? `/assets/images/queens_art/${currentQueen.image_file_name}`
    : '/assets/images/ui/placeholder_queen.png';

  return (
    <div className="relative w-full h-screen flex flex-col overflow-hidden"> {/* Changed to flex container */}
      <div className="absolute inset-0 animated-gradient-background z-0 opacity-70"></div>
      <div className="absolute inset-0 z-10">
        {currentQueen && (
          <img
            key={currentQueenIndex} // Key change triggers re-render for CSS transition
            src={imageUrl}
            alt="Background Queen"
            className={`w-full h-full object-cover object-top transition-opacity duration-700 ease-in-out ${
              fade ? 'opacity-20' : 'opacity-5'
            }`}
          />
        )}
        <div className="absolute inset-0 bg-black/60"></div> {/* Darkening overlay */}
      </div>

      {/* Content Layer - Centered */}
      <div className="relative z-30 flex flex-col items-center justify-center flex-grow text-center p-4 sm:p-8">
        <div className="mb-8 sm:mb-12 p-4 transform scale-90 sm:scale-100">
          <h1
            className="text-6xl sm:text-7xl md:text-8xl font-serif font-extrabold 
                       text-transparent bg-clip-text bg-gradient-to-r 
                       from-pink-400 via-purple-500 to-indigo-500
                       hover:from-pink-500 hover:via-purple-600 hover:to-indigo-600
                       transition-all duration-300"
            style={{
              WebkitTextStroke: '2px black',
              textShadow: `
                0 0 5px #FF69B4, 0 0 10px #FF69B4, 0 0 15px #FF1493, 
                0 0 20px #C71585, 2px 2px 2px rgba(0,0,0,0.7)
              `,
            }}
          >
            RuPaul's Drag Race
          </h1>
          <p
            className="text-lg sm:text-xl md:text-2xl font-sans font-bold text-slate-200 
                       tracking-[0.25em] sm:tracking-[0.35em] uppercase mt-2 sm:mt-3
                       hover:text-white transition-colors duration-300"
            style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.8)' }}
          >
            THE TRADING CARD GAME
          </p>
        </div>

        <div className="mb-10 sm:mb-16">
          <img
            src="/assets/images/ui/edition_logo_as10.png"
            alt="All Stars 10 Edition"
            className="w-auto h-10 sm:h-12 md:h-16 max-w-[50%] sm:max-w-xs mx-auto opacity-90 drop-shadow-lg hover:opacity-100 transition-opacity"
          />
        </div>

        {/* Buttons are now primarily in UniversalNav. These can be removed or kept for emphasis. */}
        {/* If keeping, ensure they use the new btn classes from index.css */}
        <div className="space-y-5 sm:space-y-6">
           <button onClick={onStartGame} className="btn-primary py-3 px-10 text-2xl">
            Play Now, Henny!
          </button>
          {/* Example of how to style other buttons if you keep them here */}
          {/* <button onClick={onNavigateToQueenAlbum} className="btn-secondary py-3 px-10 text-2xl">
            Queen Album
          </button> */}
        </div>
      </div>
    </div>
  );
};

export default TitleScreenMenu;