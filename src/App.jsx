// src/App.jsx
import React, { useState, useEffect, useMemo } from 'react';
import CardAlbum from './components/CardAlbum';
import EquipmentAlbum from './components/EquipmentAlbum';
import TitleScreenMenu from './components/TitleScreenMenu';
import GameScreen from './components/GameScreen';
import UniversalNav from './components/UniversalNav';
import queensData from './data/queens.json';
import equipmentData from './data/equipment.json';
import { AudioProvider, useAudio } from './contexts/AudioContext';

const THEME_SONG_PATH = '/assets/audio/theme.ogg';
const GAMEPLAY_MUSIC_PATH = '/assets/audio/gameplay_music_loop.ogg';

function AppContent() {
  const [currentView, setCurrentView] = useState('titleMenu');
  const { 
    playThemeMusic, 
    stopThemeMusic, 
    isThemePlaying,
    playGameplayLoopMusic,
    stopGameplayLoopMusic,
    isGameplayMusicPlaying
  } = useAudio();

  const navigateToQueenAlbum = () => setCurrentView('queenAlbum');
  const navigateToEquipmentAlbum = () => setCurrentView('equipmentAlbum');
  const navigateToTitleMenu = () => setCurrentView('titleMenu');
  const startGame = () => setCurrentView('gameScreen');

  const memoizedQueensData = useMemo(() => queensData, []);
  const memoizedEquipmentData = useMemo(() => equipmentData, []);

  useEffect(() => {
    let isMounted = true; 
    const nonGameViews = ['titleMenu', 'queenAlbum', 'equipmentAlbum'];
    
    if (nonGameViews.includes(currentView)) {
      if (isGameplayMusicPlaying && isMounted) {
        // console.log("App.jsx: Stopping gameplay music for non-game view:", currentView);
        stopGameplayLoopMusic();
      }
      if (!isThemePlaying && isMounted) {
        // console.log("App.jsx: Attempting to play theme for view:", currentView);
        playThemeMusic(THEME_SONG_PATH);
      }
    } else if (currentView === 'gameScreen') {
      if (isThemePlaying && isMounted) {
        // console.log("App.jsx: Stopping theme for game screen");
        stopThemeMusic();
      }
      if (!isGameplayMusicPlaying && isMounted) {
        // console.log("App.jsx: Attempting to play gameplay music for game screen");
        playGameplayLoopMusic(GAMEPLAY_MUSIC_PATH);
      }
    }
    return () => { isMounted = false; };
  }, [currentView, playThemeMusic, stopThemeMusic, isThemePlaying, playGameplayLoopMusic, stopGameplayLoopMusic, isGameplayMusicPlaying]);

  return (
    <div className="app-container w-full min-h-screen flex flex-col bg-blue-violet">
      <UniversalNav
        currentView={currentView}
        navigateToTitleMenu={navigateToTitleMenu}
        navigateToQueenAlbum={navigateToQueenAlbum}
        navigateToEquipmentAlbum={navigateToEquipmentAlbum}
        navigateToGameScreen={startGame}
      />
      <main className="flex-grow w-full relative overflow-y-auto">
        {currentView === 'titleMenu' && (
          <TitleScreenMenu
            onNavigateToQueenAlbum={navigateToQueenAlbum}
            onNavigateToEquipmentAlbum={navigateToEquipmentAlbum}
            onStartGame={startGame}
            queens={memoizedQueensData}
          />
        )}
        {currentView === 'queenAlbum' && (
          <CardAlbum allQueens={memoizedQueensData} />
        )}
        {currentView === 'equipmentAlbum' && (
          <EquipmentAlbum allEquipment={memoizedEquipmentData} />
        )}
        {currentView === 'gameScreen' && (
          <GameScreen
            queens={memoizedQueensData}
            equipment={memoizedEquipmentData}
            onGoToMenu={navigateToTitleMenu}
          />
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <AudioProvider>
      <AppContent />
    </AudioProvider>
  );
}

export default App;