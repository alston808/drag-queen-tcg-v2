// src/contexts/AudioContext.jsx
import React, { createContext, useState, useContext, useRef, useCallback, useEffect } from 'react';

const AudioContext = createContext();

export const useAudio = () => useContext(AudioContext);

const DEFAULT_THEME_VOLUME_FACTOR = 0.2; 
const DEFAULT_GAMEPLAY_MUSIC_VOLUME_FACTOR = 0.3; 
const DEFAULT_SFX_VOLUME_FACTOR = 0.5; 
const DUCKING_FACTOR = 0.2; 

export const AudioProvider = ({ children }) => {
  const [isThemePlaying, setIsThemePlaying] = useState(false);
  const [isGameplayMusicPlaying, setIsGameplayMusicPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [masterVolume, setMasterVolume] = useState(0.4); 

  const themeAudioRef = useRef(null);
  const gameplayLoopAudioRef = useRef(null);
  
  const currentThemeTrackRef = useRef(null);
  const currentGameplayTrackRef = useRef(null);

  // Refs to hold the latest playing states for callbacks to avoid stale closures
  const isThemePlayingRef = useRef(isThemePlaying);
  const isGameplayMusicPlayingRef = useRef(isGameplayMusicPlaying);

  // Track missing SFX warnings
  const missingSfxWarnedRef = useRef(new Set());

  useEffect(() => { isThemePlayingRef.current = isThemePlaying; }, [isThemePlaying]);
  useEffect(() => { isGameplayMusicPlayingRef.current = isGameplayMusicPlaying; }, [isGameplayMusicPlaying]);

  useEffect(() => {
    if (!themeAudioRef.current) {
      themeAudioRef.current = new Audio();
      themeAudioRef.current.loop = true;
    }
    if (!gameplayLoopAudioRef.current) {
      gameplayLoopAudioRef.current = new Audio();
      gameplayLoopAudioRef.current.loop = true;
    }
  }, []);

  // Define stop functions first, they are stable as they only call setters
  const stopThemeMusic = useCallback(() => {
    if (isThemePlayingRef.current) setIsThemePlaying(false);
  }, []); 

  const stopGameplayLoopMusic = useCallback(() => {
    if (isGameplayMusicPlayingRef.current) setIsGameplayMusicPlaying(false);
  }, []);

  // Define play functions, now they can safely reference the stop functions
  const playThemeMusic = useCallback((src) => {
    if (themeAudioRef.current) {
      if (isGameplayMusicPlayingRef.current) { 
        stopGameplayLoopMusic(); 
      }
      if (currentThemeTrackRef.current !== src || themeAudioRef.current.paused) {
        themeAudioRef.current.src = src;
        currentThemeTrackRef.current = src;
      }
      if (!isThemePlayingRef.current) setIsThemePlaying(true);
    }
  }, [stopGameplayLoopMusic]); // stopGameplayLoopMusic is stable

  const playGameplayLoopMusic = useCallback((src) => {
    if (gameplayLoopAudioRef.current) {
      if (isThemePlayingRef.current) { 
        stopThemeMusic();
      }
      if (currentGameplayTrackRef.current !== src || gameplayLoopAudioRef.current.paused) {
        gameplayLoopAudioRef.current.src = src;
        currentGameplayTrackRef.current = src;
      }
      if (!isGameplayMusicPlayingRef.current) setIsGameplayMusicPlaying(true);
    }
  }, [stopThemeMusic]); // stopThemeMusic is stable

  useEffect(() => {
    if (themeAudioRef.current) {
      themeAudioRef.current.volume = isMuted ? 0 : masterVolume * DEFAULT_THEME_VOLUME_FACTOR;
      if (isThemePlaying && themeAudioRef.current.src && !isMuted) {
        themeAudioRef.current.play().catch(error => {
          if (error.name === "NotAllowedError") {
            console.warn("Audio: Theme autoplay prevented. User interaction required:", error.name);
            setIsThemePlaying(false);
          } else {
            console.error("Audio: Theme playback error:", error);
          }
        });
      } else {
        themeAudioRef.current.pause();
      }
    }
  }, [isThemePlaying, isMuted, masterVolume, themeAudioRef.current?.src]);

  useEffect(() => {
    if (gameplayLoopAudioRef.current) {
      gameplayLoopAudioRef.current.volume = isMuted ? 0 : masterVolume * DEFAULT_GAMEPLAY_MUSIC_VOLUME_FACTOR;
      if (isGameplayMusicPlaying && gameplayLoopAudioRef.current.src && !isMuted) {
        gameplayLoopAudioRef.current.play().catch(error => {
          if (error.name === "NotAllowedError") {
            console.warn("Audio: Gameplay music autoplay prevented. User interaction required:", error.name);
            setIsGameplayMusicPlaying(false);
          } else {
            console.error("Audio: Gameplay music playback error:", error);
          }
        });
      } else {
        gameplayLoopAudioRef.current.pause();
      }
    }
  }, [isGameplayMusicPlaying, isMuted, masterVolume, gameplayLoopAudioRef.current?.src]);

  const playSoundEffect = useCallback((sfxSrc, sfxVolumeFactor = DEFAULT_SFX_VOLUME_FACTOR) => {
    if (isMuted || !sfxSrc) {
      if (!sfxSrc && sfxSrc !== undefined) { 
        // Only warn once per missing SFX
        if (!missingSfxWarnedRef.current.has(sfxSrc)) {
          console.warn("Audio: playSoundEffect called with invalid/null sfxSrc:", sfxSrc);
          missingSfxWarnedRef.current.add(sfxSrc);
        }
      } else if (sfxSrc === undefined) {
        // Only warn once for undefined
        if (!missingSfxWarnedRef.current.has('undefined')) {
          console.debug("Audio: playSoundEffect called with undefined sfxSrc (SFX path likely not set in SFX_PATHS)");
          missingSfxWarnedRef.current.add('undefined');
        }
      }
      return;
    }
    
    try {
      const audio = new Audio(sfxSrc);
      audio.volume = masterVolume * sfxVolumeFactor; 
      
      const gameplayMusic = gameplayLoopAudioRef.current;
      let gameplayWasActuallyPlaying = gameplayMusic && !gameplayMusic.paused && isGameplayMusicPlayingRef.current; 
      
      if (gameplayWasActuallyPlaying) {
        gameplayMusic.volume = masterVolume * DEFAULT_GAMEPLAY_MUSIC_VOLUME_FACTOR * DUCKING_FACTOR;
      }

      audio.play().catch(error => {
        if (error.name !== 'AbortError') { 
          console.warn(`Audio: SFX play error for ${sfxSrc}:`, {
            name: error.name,
            message: error.message,
            stack: error.stack
          });
        }
      });

      const restoreGameplayVolume = () => {
        if (gameplayWasActuallyPlaying && gameplayMusic) {
          if (isGameplayMusicPlayingRef.current && !isMuted) { 
            gameplayMusic.volume = masterVolume * DEFAULT_GAMEPLAY_MUSIC_VOLUME_FACTOR; 
          }
        }
      };
      audio.addEventListener('ended', restoreGameplayVolume, { once: true });

    } catch (error) {
      console.error(`Audio: Error creating Audio object for SFX ${sfxSrc}:`, {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
  }, [isMuted, masterVolume]);

  const toggleMute = useCallback(() => {
    setIsMuted(prevMuted => !prevMuted);
  }, []);

  const changeMasterVolume = useCallback((newVolume) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setMasterVolume(clampedVolume);
  }, []);

  const value = {
    isThemePlaying,
    isGameplayMusicPlaying,
    isMuted,
    masterVolume,
    playThemeMusic,
    stopThemeMusic,
    playGameplayLoopMusic,
    stopGameplayLoopMusic,
    playSoundEffect,
    toggleMute,
    changeMasterVolume,
  };

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
};
