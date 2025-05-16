// src/components/QueenCard.jsx
import React from 'react';
import PropTypes from 'prop-types';

const QueenCard = ({
  queen_name,
  gag_cost,
  charisma,
  uniqueness,
  nerve,
  talent,
  flavor_text,
  rarity,
  image_url, // This should be the direct URL to the image
  onClick,
  // Props from the JSON data
  card_id,
  edition_set, // Used for dynamic logo
  image_file_name,
}) => {
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

  const style = rarityStyles[rarity] || rarityStyles.Fierce;

  const displayImageUrl = image_url ||
                       (image_file_name ? `/assets/images/queens_art/${image_file_name}` : '/assets/images/ui/placeholder_queen.png');

  // --- Dynamic Edition Logo Logic ---
  let editionLogoSrc = '/assets/images/ui/edition_logo_main_small_icon.png'; // A smaller default icon
  let editionLogoAlt = 'Edition'; // Default alt text

  // console.log(`Card: ${queen_name}, Edition Set Prop: '${edition_set}'`); // For debugging

  if (edition_set === "All Stars 10" || edition_set === "All Stars 10 Core Set") {
    editionLogoSrc = "/assets/images/ui/edition_logo_as10.png";
    editionLogoAlt = "All Stars 10";
  } else if (edition_set === "Season 17") {
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

  return (
    <div
      onClick={onClick}
      className={`relative w-[300px] h-[420px] rounded-xl overflow-hidden
                  border-4 ${style.border} cursor-pointer
                  transform hover:scale-105 transition-all duration-300
                  shadow-lg hover:shadow-xl ${style.glow || 'shadow-pink-500/30'}
                  ${style.accentGradient} `} // Base card background
    >
      {/* Queen Image - Full height, centered, width cropped */}
      {/* z-10: Sits above the base card background, but below UI overlays */}
      <div className="absolute inset-0 z-10">
        <img
          src={displayImageUrl}
          alt={queen_name}
          className="w-full h-full object-cover object-center" // object-cover fills, object-center centers
        />
      </div>
      
      {/* Top section for stats and cost */}
      {/* z-30: Sits on top of all other card elements in this area */}
      <div className="relative z-30 p-3 flex justify-between items-start">
          {/* CUNT Stats */}
          <div className="flex flex-col gap-0.5
                        bg-black/70 backdrop-blur-sm p-2 rounded-lg
                        border border-white/20 shadow-md">
            <span className="text-orchid text-xs font-bold drop-shadow-md">C: {charisma}</span>
            <span className="text-deep-sky-blue text-xs font-bold drop-shadow-md">U: {uniqueness}</span>
            <span className="text-hot-pink text-xs font-bold drop-shadow-md">N: {nerve}</span>
            <span className="text-dark-orange text-xs font-bold drop-shadow-md">T: {talent}</span>
          </div>

          {/* Gag Cost */}
          <div className="bg-gradient-to-br from-yellow-400 to-amber-600
                        text-black font-extrabold rounded-full w-11 h-11
                        flex items-center justify-center text-lg border-2
                        border-black/50 shadow-xl">
            {gag_cost}
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
                     drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] truncate" title={queen_name}>
          {queen_name}
        </h2>
        {flavor_text && (
          <p className="text-xs italic text-white/90
                     drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]
                     line-clamp-2 h-[2.4em]"> {/* Approx 2 lines height for text-xs */}
            "{flavor_text}"
          </p>
        )}
      </div>
    </div>
  );
};

QueenCard.propTypes = {
  card_id: PropTypes.string,
  queen_name: PropTypes.string.isRequired,
  gag_cost: PropTypes.number.isRequired,
  charisma: PropTypes.number.isRequired,
  uniqueness: PropTypes.number.isRequired,
  nerve: PropTypes.number.isRequired,
  talent: PropTypes.number.isRequired,
  special_power_name: PropTypes.string,
  special_power_text: PropTypes.string,
  flavor_text: PropTypes.string,
  rarity: PropTypes.string.isRequired,
  image_url: PropTypes.string,
  image_file_name: PropTypes.string,
  edition_set: PropTypes.string,
  onClick: PropTypes.func
};

export default React.memo(QueenCard);
