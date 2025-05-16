// src/contexts/AudioContext.jsx
import React, { createContext, useState, useContext, useRef, useCallback, useEffect } from 'react';

const AudioContext = createContext();

export const useAudio = () => useContext(AudioContext);

const DEFAULT_THEME_VOLUME = 0.2;
const DEFAULT_GAMEPLAY_MUSIC_VOLUME = 0.3;
const DEFAULT_SFX_VOLUME_FACTOR = 0.6; // General SFX volume relative to master
const DUCKING_FACTOR = 0.2; // Reduce gameplay music to 20% of its current volume

export const AudioProvider = ({ children }) => {
  const [isThemePlaying, setIsThemePlaying] = useState(false);
  const [isGameplayMusicPlaying, setIsGameplayMusicPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false); // Global mute
  const [masterVolume, setMasterVolume] = useState(0.4); // Master volume

  const themeAudioRef = useRef(null);
  const gameplayLoopAudioRef = useRef(null);
  
  const currentThemeTrackRef = useRef(null);
  const currentGameplayTrackRef = useRef(null);

  // Initialize audio elements
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

  // Effect for Theme Music
  useEffect(() => {
    if (themeAudioRef.current) {
      themeAudioRef.current.volume = isMuted ? 0 : masterVolume * DEFAULT_THEME_VOLUME;
      if (isThemePlaying && themeAudioRef.current.src && !isMuted) {
        themeAudioRef.current.play().catch(error => {
          if (error.name === "NotAllowedError") setIsThemePlaying(false);
          // console.warn("Audio: Theme autoplay prevented.", error.name);
        });
      } else {
        themeAudioRef.current.pause();
      }
    }
  }, [isThemePlaying, isMuted, masterVolume]);

  // Effect for Gameplay Music Loop
  useEffect(() => {
    if (gameplayLoopAudioRef.current) {
      gameplayLoopAudioRef.current.volume = isMuted ? 0 : masterVolume * DEFAULT_GAMEPLAY_MUSIC_VOLUME;
      if (isGameplayMusicPlaying && gameplayLoopAudioRef.current.src && !isMuted) {
        gameplayLoopAudioRef.current.play().catch(error => {
          if (error.name === "NotAllowedError") setIsGameplayMusicPlaying(false);
          // console.warn("Audio: Gameplay music autoplay prevented.", error.name);
        });
      } else {
        gameplayLoopAudioRef.current.pause();
      }
    }
  }, [isGameplayMusicPlaying, isMuted, masterVolume]);


  const playThemeMusic = useCallback((src) => {
    if (themeAudioRef.current) {
      if (isGameplayMusicPlaying) stopGameplayLoopMusic(); 
      if (currentThemeTrackRef.current !== src || themeAudioRef.current.paused) { // Check if paused
        themeAudioRef.current.src = src;
        currentThemeTrackRef.current = src;
      }
      if (!isThemePlaying) setIsThemePlaying(true);
    }
  }, [isThemePlaying, isGameplayMusicPlaying]); // Added dependencies

  const stopThemeMusic = useCallback(() => {
    if (isThemePlaying) setIsThemePlaying(false);
  }, [isThemePlaying]);

  const playGameplayLoopMusic = useCallback((src) => {
    if (gameplayLoopAudioRef.current) {
      if (isThemePlaying) stopThemeMusic();
      if (currentGameplayTrackRef.current !== src || gameplayLoopAudioRef.current.paused) { // Check if paused
        gameplayLoopAudioRef.current.src = src;
        currentGameplayTrackRef.current = src;
      }
      if (!isGameplayMusicPlaying) setIsGameplayMusicPlaying(true);
    }
  }, [isGameplayMusicPlaying, isThemePlaying]); // Added dependencies

  const stopGameplayLoopMusic = useCallback(() => {
    if (isGameplayMusicPlaying) setIsGameplayMusicPlaying(false);
  }, [isGameplayMusicPlaying]);

  const playSoundEffect = useCallback((sfxSrc, sfxVolumeFactor = DEFAULT_SFX_VOLUME_FACTOR) => {
    if (isMuted) return;
    // console.log(`Attempting to play SFX: ${sfxSrc}`); // Debug SFX calls
    try {
      const audio = new Audio(sfxSrc);
      audio.volume = masterVolume * sfxVolumeFactor; 
      
      let originalGameplayVolume = gameplayLoopAudioRef.current?.volume || 0;
      let gameplayWasActuallyPlaying = gameplayLoopAudioRef.current && !gameplayLoopAudioRef.current.paused && isGameplayMusicPlaying;

      if (gameplayWasActuallyPlaying) {
        gameplayLoopAudioRef.current.volume = masterVolume * DEFAULT_GAMEPLAY_MUSIC_VOLUME * DUCKING_FACTOR;
      }

      audio.play().catch(error => {
        if (error.name !== 'AbortError') { // AbortError is common if sounds are rapid-fired
            console.warn(`Audio: SFX play error for ${sfxSrc}:`, error.name, error.message);
        }
      });

      audio.addEventListener('ended', () => {
        if (gameplayWasActuallyPlaying && gameplayLoopAudioRef.current) {
          if (isGameplayMusicPlaying && !isMuted) { 
            gameplayLoopAudioRef.current.volume = masterVolume * DEFAULT_GAMEPLAY_MUSIC_VOLUME;
          }
        }
        // Clean up the event listener
        // audio.removeEventListener('ended', this); // This line might cause issues if not handled carefully.
      }, { once: true }); // Ensure listener is called only once

    } catch (error) {
        console.error(`Audio: Error creating Audio object for SFX ${sfxSrc}:`, error);
    }
  }, [isMuted, masterVolume, isGameplayMusicPlaying]); // isGameplayMusicPlaying for ducking logic

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
