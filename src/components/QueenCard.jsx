// src/components/QueenCard.jsx
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import PowerActivationButton from './PowerActivationButton';
import { powerRegistry } from '../game/powerSystem';

const QueenCard = ({
  slot,
  onClick,
  isActive,
  onSelect,
  onActivatePower,
  gameState,
  owner,
  isOpponent = false,
  isSelected = false,
  isTargetable = false,
  onTarget = () => {},
  className = '',
  showPowerButton = true
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showPowerDetails, setShowPowerDetails] = useState(false);
  const [powerAnimation, setPowerAnimation] = useState(null);

  if (!slot || !slot.queen) return null;
  const queen = slot.queen;
  const equipment = slot.equipment;
  const stats = slot.stats;

  const rarityStyles = {
    Fierce: {
      border: 'border-slate-400',
      gradient: 'from-slate-900 via-slate-800 to-slate-600', // For bottom panel
      glow: 'shadow-slate-400/30',
      accentGradient: 'bg-gradient-to-br from-slate-800 to-slate-700' // Base card background
    },
    Gagatrondra: {
      border: 'border-sky-400',
      gradient: 'from-blue-900 via-sky-800 to-cyan-600',
      glow: 'shadow-sky-400/30',
      accentGradient: 'bg-gradient-to-br from-sky-800 to-blue-700'
    },
    Iconic: {
      border: 'border-indigo-400',
      gradient: 'from-purple-900 via-indigo-800 to-violet-600',
      glow: 'shadow-indigo-400/30',
      accentGradient: 'bg-gradient-to-br from-indigo-800 to-purple-700'
    },
    Legendary: {
      border: 'border-amber-400',
      gradient: 'from-orange-900 via-amber-800 to-yellow-600',
      glow: 'shadow-amber-400/30',
      accentGradient: 'bg-gradient-to-br from-amber-800 to-orange-700'
    }
  };

  const style = rarityStyles[queen.rarity] || rarityStyles.Fierce;

  const displayImageUrl = queen.image_url ||
                       (queen.image_file_name ? `/assets/images/queens_art/${queen.image_file_name}` : '/assets/images/ui/placeholder_queen.png');

  // --- Dynamic Edition Logo Logic ---
  let editionLogoSrc = '/assets/images/ui/edition_logo_main_small_icon.png'; // A smaller default icon
  let editionLogoAlt = 'Edition'; // Default alt text

  // console.log(`Card: ${queen_name}, Edition Set Prop: '${edition_set}'`); // For debugging

  if (queen.edition_set === "All Stars 10" || queen.edition_set === "All Stars 10 Core Set") {
    editionLogoSrc = "/assets/images/ui/edition_logo_as10.png";
    editionLogoAlt = "All Stars 10";
  } else if (queen.edition_set === "Season 17") {
    editionLogoSrc = "/assets/images/ui/edition_logo_s17.png";
    editionLogoAlt = "Season 17";
  }
  // Add more conditions for other editions if needed

  // Define positioning for the logo.
  // The bottom panel's content (name + flavor) is roughly 80-90px high including its own padding.
  // We want the logo to sit above this panel.
  // `bottom-[92px]` places the bottom of the logo ~92px from the card's bottom edge.
  // `left-3` gives it some padding from the left edge of the card.
  const logoContainerPosition = 'bottom-[92px] left-3'; // Adjust 92px as needed for precise vertical alignment
  const logoImageMaxWidth = 'max-w-[100px]'; // Max width for the logo image itself

  // Get queen's power from registry
  const queenPower = powerRegistry.get(queen.card_id);

  const handlePowerActivate = () => {
    if (!queenPower || !onActivatePower) return;

    // Set power animation based on effect type
    setPowerAnimation({
      type: queenPower.effect,
      target: queenPower.target
    });

    // Trigger power activation
    onActivatePower(queen.card_id, queenPower);

    // Clear animation after delay
    setTimeout(() => setPowerAnimation(null), 1000);
  };

  const getPowerAnimation = () => {
    if (!powerAnimation) return null;

    const animations = {
      MODIFY_STAT: {
        initial: { scale: 1, opacity: 0.8 },
        animate: { scale: 1.2, opacity: 1 },
        exit: { scale: 1, opacity: 0.8 },
        className: 'bg-yellow-400'
      },
      MODIFY_DAMAGE: {
        initial: { x: -20, opacity: 0 },
        animate: { x: 0, opacity: 1 },
        exit: { x: 20, opacity: 0 },
        className: 'bg-red-500'
      },
      MODIFY_SHADE: {
        initial: { y: -20, opacity: 0 },
        animate: { y: 0, opacity: 1 },
        exit: { y: 20, opacity: 0 },
        className: 'bg-purple-500'
      },
      PREVENT_EFFECT: {
        initial: { scale: 0.8, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        exit: { scale: 1.2, opacity: 0 },
        className: 'bg-blue-500'
      }
    };

    return animations[powerAnimation.type] || animations.MODIFY_STAT;
  };

  const powerAnimProps = getPowerAnimation();

  return (
    <motion.div
      className={`relative ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <div
        onClick={onClick ? onClick : () => {
          if (isTargetable) {
            onTarget(queen.card_id);
          } else if (onSelect) {
            onSelect(queen.card_id);
          }
        }}
        className={`relative w-[300px] h-[420px] rounded-xl overflow-hidden
                    border-4 ${style.border} cursor-pointer
                    transform hover:scale-105 transition-all duration-300
                    shadow-lg hover:shadow-xl ${style.glow || 'shadow-pink-500/30'}
                    ${style.accentGradient} ${isSelected ? 'ring-4 ring-pink-500' : ''} ${isTargetable ? 'cursor-crosshair hover:ring-2 hover:ring-yellow-400' : ''} ${isOpponent ? 'opacity-80' : ''}`}
      >
        {/* Equipment Indicators */}
        {equipment && equipment.length > 0 && (
          <div className="absolute top-1 right-1 flex flex-col gap-1">
            {equipment.map((eq, index) => (
              <div 
                key={eq.instanceId || index}
                className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-[8px] font-bold text-white border border-white/20"
                title={eq.card_name}
              >
                {eq.type.charAt(0)}
              </div>
            ))}
          </div>
        )}

        {/* Shade Tokens */}
        {queen.shadeTokens > 0 && (
          <div className="absolute top-1 left-1 bg-gradient-to-br from-red-500 to-red-800 text-white text-xs font-bold rounded-full px-2 py-1 shadow-lg border border-black/50">
            {queen.shadeTokens} S
          </div>
        )}

        {/* Queen Image - Full height, centered, width cropped */}
        {/* z-10: Sits above the base card background, but below UI overlays */}
        <div className="absolute inset-0 z-10">
          <img
            src={displayImageUrl}
            alt={queen.queen_name}
            className="w-full h-full object-cover object-center" // object-cover fills, object-center centers
          />
        </div>
        
        {/* Gag Cost */}
        <div className="absolute top-3 right-3 z-30">
          <div className="bg-gradient-to-br from-yellow-400 to-amber-600
                        text-black font-extrabold rounded-full w-11 h-11
                        flex items-center justify-center text-lg border-2
                        border-black/50 shadow-xl">
            {queen.gag_cost}
          </div>
        </div>

        {/* NEW Edition Logo - Positioned in bottom-left, above the info panel */}
        {/* z-20: Sits above the main queen image (z-10) */}
        <div className={`absolute ${logoContainerPosition} z-20 pointer-events-none`}>
          <img
            src={editionLogoSrc}
            alt={editionLogoAlt}
            className={`${logoImageMaxWidth} h-auto object-contain drop-shadow-lg`} // drop-shadow-lg for better visibility
          />
        </div>
        
        {/* Bottom Info Panel */}
        {/* z-30: Sits on top of all other card elements in this area */}
        <div className={`absolute bottom-0 left-0 right-0 z-30 p-3
                         bg-gradient-to-t ${style.gradient} opacity-90 backdrop-blur-md 
                         border-t-2 ${style.border} border-opacity-70`}>
          <h2 className="text-xl font-serif font-bold text-white mb-1
                       drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] truncate" title={queen.queen_name}>
            {queen.queen_name}
          </h2>
          {queen.flavor_text && (
            <p className="text-xs italic text-white/90
                       drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]
                       line-clamp-2 h-[2.4em]"> {/* Approx 2 lines height for text-xs */}
              "{queen.flavor_text}"
            </p>
          )}
        </div>

        {/* C.U.N.T. Stats - moved to bottom right, in line with edition logo */}
        <div className="absolute bottom-[92px] right-3 z-40 flex flex-col gap-0.5 bg-black/70 backdrop-blur-sm p-2 rounded-lg border border-white/20 shadow-md">
          {['charisma', 'uniqueness', 'nerve', 'talent'].map((stat, idx) => {
            const statColors = [
              'text-orchid', // Charisma
              'text-deep-sky-blue', // Uniqueness
              'text-hot-pink', // Nerve
              'text-dark-orange' // Talent
            ];
            const statNames = ['C', 'U', 'N', 'T'];
            const base = queen[stat] ?? 0;
            const current = stats[stat] ?? 0;
            const boost = current - base;
            return (
              <span key={stat} className={`${statColors[idx]} text-xs font-bold drop-shadow-md flex items-center`}>
                {boost > 0 && (
                  <span className="line-through text-gray-400 mr-1 text-[10px]">{base}</span>
                )}
                <span className={`ml-0.5 mr-0.5 ${boost > 0 ? 'text-white text-base font-extrabold' : ''}`}>{current}</span>
                {boost > 0 && (
                  <span className="ml-1 text-lime-400 text-xs font-bold animate-pulse">(+{boost})</span>
                )}
                <span className="ml-1 text-xs opacity-60">{statNames[idx]}</span>
              </span>
            );
          })}
        </div>

        {/* Power animation overlay */}
        <AnimatePresence>
          {powerAnimation && powerAnimProps && (
            <motion.div
              className={`absolute inset-0 ${powerAnimProps.className} bg-opacity-30`}
              initial={powerAnimProps.initial}
              animate={powerAnimProps.animate}
              exit={powerAnimProps.exit}
              transition={{ duration: 0.3 }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Power section */}
      {queenPower && (
        <div className="mt-2">
          <div 
            className="text-xs text-pink-300 cursor-help"
            onMouseEnter={() => setShowPowerDetails(true)}
            onMouseLeave={() => setShowPowerDetails(false)}
          >
            {queenPower.name}
          </div>
          
          {/* Power activation button */}
          {showPowerButton && !isOpponent && (
            <div className="mt-1">
              <PowerActivationButton
                power={queenPower}
                onActivate={handlePowerActivate}
                isActive={isActive}
                canActivate={!isOpponent && isActive}
                owner={owner}
                gameState={gameState}
                disabled={!isActive}
              />
            </div>
          )}

          {/* Power details tooltip */}
          <AnimatePresence>
            {showPowerDetails && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-black bg-opacity-90 text-white text-xs rounded-lg z-50"
              >
                <div className="font-bold mb-1">{queenPower.name}</div>
                <div className="text-gray-300">{queenPower.description}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
};

QueenCard.propTypes = {
  slot: PropTypes.object.isRequired,
  onClick: PropTypes.func,
  isActive: PropTypes.bool,
  onSelect: PropTypes.func,
  onActivatePower: PropTypes.func,
  gameState: PropTypes.object,
  owner: PropTypes.string,
  isOpponent: PropTypes.bool,
  isSelected: PropTypes.bool,
  isTargetable: PropTypes.bool,
  onTarget: PropTypes.func,
  className: PropTypes.string,
  showPowerButton: PropTypes.bool
};

export default React.memo(QueenCard);
