import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PowerCosts } from '../game/powerSystem';

const PowerActivationButton = ({ 
  power, 
  onActivate, 
  isActive, 
  canActivate, 
  owner,
  gameState,
  disabled = false 
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Handle cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // Check if power can be activated based on timing and conditions
  const canActivateNow = () => {
    if (disabled || cooldown > 0 || !canActivate) return false;
    
    // Check phase restrictions
    if (power.trigger === 'ON_PHASE_CHANGE' && 
        gameState.currentPhase !== power.condition?.phase) {
      return false;
    }

    // Check cost requirements
    if (power.cost === PowerCosts.GAG && 
        gameState[owner].gagTokens < power.value) {
      return false;
    }

    if (power.cost === PowerCosts.DISCARD && 
        gameState[owner].hand.length < power.value) {
      return false;
    }

    return true;
  };

  const handleActivate = () => {
    if (!canActivateNow()) return;
    
    setIsAnimating(true);
    onActivate();
    
    // Set cooldown if specified
    if (power.cooldown) {
      setCooldown(power.cooldown);
    }

    // Reset animation after delay
    setTimeout(() => setIsAnimating(false), 1000);
  };

  const getButtonStyle = () => {
    if (!canActivateNow()) {
      return 'bg-gray-400 cursor-not-allowed';
    }
    if (isAnimating) {
      return 'bg-purple-600 animate-pulse';
    }
    return 'bg-pink-600 hover:bg-pink-700';
  };

  return (
    <div className="relative">
      <motion.button
        className={`px-3 py-1 rounded-full text-white font-bold text-sm transition-all ${getButtonStyle()}`}
        onClick={handleActivate}
        disabled={!canActivateNow()}
        whileHover={canActivateNow() ? { scale: 1.05 } : {}}
        whileTap={canActivateNow() ? { scale: 0.95 } : {}}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {cooldown > 0 ? `${cooldown}` : 'Activate'}
      </motion.button>

      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-black bg-opacity-90 text-white text-xs rounded-lg z-50"
          >
            <div className="font-bold mb-1">{power.name}</div>
            <div className="text-gray-300">{power.description}</div>
            {power.cost !== PowerCosts.NONE && (
              <div className="mt-1 text-pink-400">
                Cost: {power.cost === PowerCosts.GAG ? `${power.value} Gag` : 
                       power.cost === PowerCosts.DISCARD ? `Discard ${power.value} cards` : 
                       power.cost}
              </div>
            )}
            {cooldown > 0 && (
              <div className="mt-1 text-yellow-400">
                Cooldown: {cooldown} turns
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Power activation animation */}
      <AnimatePresence>
        {isAnimating && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 2, opacity: 1 }}
            exit={{ scale: 3, opacity: 0 }}
            className="absolute inset-0 bg-pink-500 rounded-full pointer-events-none"
            style={{ zIndex: -1 }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default PowerActivationButton; 