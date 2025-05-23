import { powerRegistry, PowerTriggers } from './powerSystem';
import { ActionTypes } from './constants';
import React from 'react';

// Create and export the context
export const PowerManagerContext = React.createContext(null);

class PowerManager {
  constructor(gameState, dispatch) {
    this.gameState = gameState;
    this.dispatch = dispatch;
    this.activePowers = new Map(); // Track active powers and their durations
    this.powerCooldowns = new Map(); // Track power cooldowns
    this.powerUsedThisGame = new Set(); // Track powers used this game
  }

  // Handle power activation
  activatePower(queenInstanceId, power) {
    if (!this.canActivatePower(queenInstanceId, power)) {
      return false;
    }

    // Process the power
    const result = this.processPower(power, {
      queen: this.findQueen(queenInstanceId),
      owner: this.findOwner(queenInstanceId),
      battle: this.gameState.currentBattle,
      powerUsed: this.powerUsedThisGame.has(power.id)
    });

    if (result) {
      // Track power usage
      if (power.condition?.includes('once_per_game')) {
        this.powerUsedThisGame.add(power.id);
      }

      // Set cooldown if specified
      if (power.cooldown) {
        this.powerCooldowns.set(power.id, power.cooldown);
      }

      // Track active power if it has duration
      if (power.duration) {
        this.activePowers.set(power.id, {
          power,
          duration: power.duration,
          target: result.target
        });
      }

      return true;
    }

    return false;
  }

  // Check if power can be activated
  canActivatePower(queenInstanceId, power) {
    const queen = this.findQueen(queenInstanceId);
    const owner = this.findOwner(queenInstanceId);

    // Check if power is on cooldown
    if (this.powerCooldowns.has(power.id) && this.powerCooldowns.get(power.id) > 0) {
      return false;
    }

    // Check if power has been used this game (for once per game powers)
    if (power.condition?.includes('once_per_game') && 
        this.powerUsedThisGame.has(power.id)) {
      return false;
    }

    // Check phase restrictions
    if (power.trigger === PowerTriggers.ON_PHASE_CHANGE && 
        this.gameState.currentPhase !== power.condition?.phase) {
      return false;
    }

    // Check cost requirements
    if (power.cost === 'GAG' && this.gameState[owner].gagTokens < power.value) {
      return false;
    }

    if (power.cost === 'DISCARD' && this.gameState[owner].hand.length < power.value) {
      return false;
    }

    // Check other conditions
    if (power.condition && !power.condition(this.gameState, {
      queen,
      owner,
      battle: this.gameState.currentBattle,
      powerUsed: this.powerUsedThisGame.has(power.id)
    })) {
      return false;
    }

    return true;
  }

  // Process power effect
  processPower(power, context) {
    if (!power.canUse(this.gameState, context)) {
      return null;
    }

    const effect = power.apply(this.gameState, context);
    if (!effect) return null;

    // Handle different effect types
    switch (effect.type) {
      case 'MODIFY_STAT':
        this.handleModifyStat(effect, context);
        break;
      case 'MODIFY_DAMAGE':
        this.handleModifyDamage(effect, context);
        break;
      case 'MODIFY_SHADE':
        this.handleModifyShade(effect, context);
        break;
      case 'DRAW_CARDS':
        this.handleDrawCards(effect, context);
        break;
      case 'DISCARD_CARDS':
        this.handleDiscardCards(effect, context);
        break;
      case 'GAIN_GAG':
        this.handleGainGag(effect, context);
        break;
      case 'PREVENT_EFFECT':
        this.handlePreventEffect(effect, context);
        break;
      // Add more effect handlers as needed
    }

    return effect;
  }

  // Effect handlers
  handleModifyStat(effect, context) {
    const targets = this.getTargetQueens(effect.target, context);
    targets.forEach(queen => {
      this.dispatch({
        type: ActionTypes.MODIFY_STAT,
        payload: {
          queenInstanceId: queen.instanceId,
          stat: effect.value,
          duration: effect.duration
        }
      });
    });
  }

  handleModifyDamage(effect, context) {
    if (context.battle) {
      this.dispatch({
        type: ActionTypes.MODIFY_BATTLE_DAMAGE,
        payload: {
          battleId: context.battle.id,
          modifier: effect.value
        }
      });
    }
  }

  handleModifyShade(effect, context) {
    const targets = this.getTargetQueens(effect.target, context);
    targets.forEach(queen => {
      this.dispatch({
        type: ActionTypes.MODIFY_SHADE,
        payload: {
          queenInstanceId: queen.instanceId,
          amount: effect.value
        }
      });
    });
  }

  handleDrawCards(effect, context) {
    this.dispatch({
      type: ActionTypes.DRAW_CARD,
      payload: {
        playerId: context.owner,
        count: effect.value
      }
    });
  }

  handleDiscardCards(effect, context) {
    this.dispatch({
      type: ActionTypes.DISCARD_CARDS,
      payload: {
        playerId: context.owner,
        count: effect.value
      }
    });
  }

  handleGainGag(effect, context) {
    this.dispatch({
      type: ActionTypes.GAIN_GAG,
      payload: {
        playerId: context.owner,
        amount: effect.value
      }
    });
  }

  handlePreventEffect(effect, context) {
    // Implementation depends on what effect is being prevented
    // This could be handled by the game state reducer
  }

  // Helper methods
  findQueen(instanceId) {
    for (const player of ['player1', 'player2']) {
      if (!this.gameState[player] || !this.gameState[player].runway) continue;
      const queen = this.gameState[player].runway.find(q => q.instanceId === instanceId);
      if (queen) return queen;
    }
    return null;
  }

  findOwner(instanceId) {
    for (const player of ['player1', 'player2']) {
      if (!this.gameState[player] || !this.gameState[player].runway) continue;
      if (this.gameState[player].runway.some(q => q.instanceId === instanceId)) {
        return player;
      }
    }
    return null;
  }

  getTargetQueens(targetType, context) {
    switch (targetType) {
      case 'SELF':
        return [context.queen];
      case 'OWN_QUEENS':
        return this.gameState[context.owner].runway;
      case 'OPPONENT_QUEENS':
        const opponent = context.owner === 'player1' ? 'player2' : 'player1';
        return this.gameState[opponent].runway;
      case 'ALL_QUEENS':
        return [...this.gameState.player1.runway, ...this.gameState.player2.runway];
      default:
        return [];
    }
  }

  // Update active powers and cooldowns at end of turn
  updateActivePowers() {
    // Update cooldowns
    for (const [powerId, cooldown] of this.powerCooldowns.entries()) {
      if (cooldown > 0) {
        this.powerCooldowns.set(powerId, cooldown - 1);
      } else {
        this.powerCooldowns.delete(powerId);
      }
    }

    // Update active powers
    for (const [powerId, activePower] of this.activePowers.entries()) {
      if (activePower.duration > 0) {
        activePower.duration--;
        if (activePower.duration === 0) {
          // Remove power effect
          this.dispatch({
            type: ActionTypes.REMOVE_POWER_EFFECT,
            payload: {
              powerId,
              target: activePower.target
            }
          });
          this.activePowers.delete(powerId);
        }
      }
    }
  }

  // Handle power triggers from game events
  handleTrigger(trigger, context) {
    // Get all powers that respond to this trigger
    const powers = powerRegistry.getByTrigger(trigger);
    
    // Sort by priority if needed
    powers.sort((a, b) => (a.priority || 0) - (b.priority || 0));

    // Process each power
    for (const power of powers) {
      // For passive powers, just process them
      if (power.isPassive) {
        this.processPower(power, context);
      }
      // For reactive powers, check if they can be activated
      else if (power.isReactive && this.canActivatePower(context.queen?.instanceId, power)) {
        this.processPower(power, context);
      }
    }
  }
}

// Provider component
export const PowerManagerProvider = ({ children, gameState, dispatch }) => {
  // Always use the latest dispatch and gameState
  const managerRef = React.useRef();
  if (!managerRef.current || managerRef.current.dispatch !== dispatch) {
    managerRef.current = new PowerManager(gameState, dispatch);
  }
  const manager = managerRef.current;

  React.useEffect(() => {
    manager.gameState = gameState;
  }, [gameState, manager]);

  React.useEffect(() => {
    if (gameState?.currentPhase === 'TURN_END') {
      manager.updateActivePowers();
    }
  }, [gameState?.currentPhase, manager]);

  console.log('[PowerManagerProvider] Providing manager:', manager);

  return (
    <PowerManagerContext.Provider value={manager}>
      {children}
    </PowerManagerContext.Provider>
  );
};

// Hook to use the power manager
export const usePowerManager = () => {
  const manager = React.useContext(PowerManagerContext);
  if (!manager) {
    throw new Error('usePowerManager must be used within a PowerManagerProvider');
  }
  return manager;
};

export default PowerManager; 