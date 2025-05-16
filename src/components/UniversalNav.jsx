// src/components/UniversalNav.jsx
import React from 'react';
import { useAudio } from '../contexts/AudioContext';

const SpeakerLoudIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
  </svg>
);

const SpeakerMutedIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
    <line x1="23" y1="9" x2="17" y2="15"></line>
    <line x1="17" y1="9" x2="23" y2="15"></line>
  </svg>
);

const UniversalNav = ({ currentView, navigateToTitleMenu, navigateToQueenAlbum, navigateToEquipmentAlbum, navigateToGameScreen }) => {
  const { isMuted, toggleMute } = useAudio();

  const navLinkBaseStyle = "px-3 py-2 rounded-md text-sm sm:text-base font-medium transition-all duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gold focus:ring-opacity-75";
  const navLinkActiveStyle = "bg-hot-pink text-white shadow-lg scale-105";
  const navLinkInactiveStyle = "text-soft-white hover:bg-pink-glass hover:text-white";
  const playButtonSpecificStyle = "border border-gold hover:bg-gold hover:text-black";


  return (
    <nav className="bg-dark-glass backdrop-blur-xl shadow-lg p-2 sm:p-3 sticky top-0 z-[200] w-full border-b-2 border-orchid/30">
      <div className="container mx-auto flex flex-wrap items-center justify-between">
        <div
          className="text-xl sm:text-2xl font-serif font-bold text-gold cursor-pointer hover:text-hot-pink transition-colors px-2"
          onClick={navigateToTitleMenu}
          title="Back to Main Menu"
        >
          The Main Stage
        </div>

        <div className="flex items-center space-x-1 sm:space-x-2">
          <button
            onClick={navigateToTitleMenu}
            className={`${navLinkBaseStyle} ${currentView === 'titleMenu' ? navLinkActiveStyle : navLinkInactiveStyle}`}
          >
            Home
          </button>
          <button
            onClick={navigateToQueenAlbum}
            className={`${navLinkBaseStyle} ${currentView === 'queenAlbum' ? navLinkActiveStyle : navLinkInactiveStyle}`}
          >
            Queens
          </button>
          <button
            onClick={navigateToEquipmentAlbum}
            className={`${navLinkBaseStyle} ${currentView === 'equipmentAlbum' ? navLinkActiveStyle : navLinkInactiveStyle}`}
          >
            Equipment
          </button>

          {/* Play Game Button - Always enabled */}
          <button
            onClick={navigateToGameScreen}
            className={`${navLinkBaseStyle} ${currentView === 'gameScreen' ? navLinkActiveStyle : navLinkInactiveStyle} ${currentView !== 'gameScreen' ? playButtonSpecificStyle : ''}`}
            title="Play Game"
          >
            {currentView === 'gameScreen' ? 'In Game' : 'Play Game'}
          </button>

          <button
            onClick={toggleMute}
            className={`${navLinkBaseStyle} ${navLinkInactiveStyle} p-2`}
            title={isMuted ? "Unmute Sound" : "Mute Sound"}
          >
            {isMuted ? <SpeakerMutedIcon /> : <SpeakerLoudIcon />}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default UniversalNav;