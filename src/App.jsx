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
import { FlickeringGrid } from './components/ui/FlickeringGrid';

console.log('[App] Loading data:', {
  hasQueensData: !!queensData,
  queensLength: queensData?.length,
  hasEquipmentData: !!equipmentData,
  equipmentLength: equipmentData?.length
});

const THEME_SONG_PATH = '/assets/audio/theme.mp3';
const GAMEPLAY_MUSIC_PATH = '/assets/audio/gameplay_music_loop.mp3';

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

  console.log('[AppContent] Current view:', currentView);

  const navigateToQueenAlbum = () => setCurrentView('queenAlbum');
  const navigateToEquipmentAlbum = () => setCurrentView('equipmentAlbum');
  const navigateToTitleMenu = () => setCurrentView('titleMenu');
  const startGame = () => {
    console.log('[AppContent] Starting game with data:', {
      hasQueensData: !!memoizedQueensData,
      queensLength: memoizedQueensData?.length,
      hasEquipmentData: !!memoizedEquipmentData,
      equipmentLength: memoizedEquipmentData?.length
    });
    setCurrentView('gameScreen');
  };

  const memoizedQueensData = useMemo(() => {
    console.log('[AppContent] Memoizing queens data:', {
      hasData: !!queensData,
      length: queensData?.length
    });
    return queensData;
  }, []);
  const memoizedEquipmentData = useMemo(() => {
    console.log('[AppContent] Memoizing equipment data:', {
      hasData: !!equipmentData,
      length: equipmentData?.length
    });
    return equipmentData;
  }, []);

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
    <div className="app-container w-full min-h-screen flex flex-col bg-blue-violet relative overflow-hidden">
      {/* Flickering grid background */}
      <div className="absolute inset-0 -z-10">
        <FlickeringGrid color="#6B7280" maxOpacity={0.2} flickerChance={0.1} />
      </div>
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