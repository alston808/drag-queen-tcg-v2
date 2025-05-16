// src/game/constants.js

// --- Core Game Values ---
export const STARTING_SHANTAY_POINTS = 25;
export const STARTING_GAG_TOKENS = 5; // User requested increase
export const MAX_GAG_TOKENS = 10;
export const STARTING_HAND_SIZE = 5;
export const MAX_HAND_SIZE = 7;
export const MAX_RUNWAY_QUEENS = 3;
export const SHADE_LIMIT = 3;
export const GAG_GAIN_PER_TURN = 2;

// --- Game Phases ---
export const PHASES = {
  SPILL_THE_TEA: 'Spill the Tea',
  WERK_ROOM: 'Werk Room',
  LIP_SYNC_SELECT_ATTACKER: 'Lip Sync: Select Attacker',
  LIP_SYNC_SELECT_DEFENDER: 'Lip Sync: Select Defender',
  LIP_SYNC_REVEAL: 'Lip Sync: Reveal',
  LIP_SYNC_RESOLUTION: 'Lip Sync: Resolution',
  UNTUCK: 'Untuck',
  GAME_OVER: 'Game Over',
};

// --- Lip Sync Categories ---
export const CATEGORIES = ['Charisma', 'Uniqueness', 'Nerve', 'Talent'];

// --- Player IDs ---
export const PLAYER1_ID = 'player1';
export const PLAYER2_ID = 'player2'; // Often the CPU

// --- Card Types (Example) ---
// You might add more specific types later
export const CARD_TYPE_QUEEN = 'QUEEN';
export const CARD_TYPE_EQUIPMENT = 'EQUIPMENT';

// --- Action Types for Reducer ---
export const ActionTypes = {
  // Game Flow
  INITIALIZE_GAME: 'INITIALIZE_GAME',
  ADVANCE_PHASE: 'ADVANCE_PHASE',
  SET_GAME_OVER: 'SET_GAME_OVER',

  // Player Actions
  DRAW_CARD: 'DRAW_CARD',
  GAIN_GAG: 'GAIN_GAG',
  PLAY_QUEEN_CARD: 'PLAY_QUEEN_CARD',
  PLAY_EQUIPMENT_CARD: 'PLAY_EQUIPMENT_CARD', // Placeholder
  DISCARD_TO_HAND_SIZE: 'DISCARD_TO_HAND_SIZE',
  ACTIVATE_ABILITY: 'ACTIVATE_ABILITY', // Placeholder

  // Lip Sync Actions
  SELECT_ATTACKER: 'SELECT_ATTACKER',
  SELECT_DEFENDER: 'SELECT_DEFENDER',
  SET_LIP_SYNC_CATEGORY: 'SET_LIP_SYNC_CATEGORY',
  RESOLVE_LIP_SYNC: 'RESOLVE_LIP_SYNC', // Calculates score, applies damage/shade
  APPLY_SHANTAY_DAMAGE: 'APPLY_SHANTAY_DAMAGE',
  APPLY_SHADE: 'APPLY_SHADE',
  ELIMINATE_QUEEN: 'ELIMINATE_QUEEN',
  RESET_LIP_SYNC_STATE: 'RESET_LIP_SYNC_STATE',

  // UI / Meta Actions
  SET_SELECTED_CARD_MODAL: 'SET_SELECTED_CARD_MODAL',
  LOG_ACTION: 'LOG_ACTION', // May handle logging outside reducer

  // Turn Management
  PREPARE_QUEENS_FOR_NEXT_TURN: 'PREPARE_QUEENS_FOR_NEXT_TURN',
};