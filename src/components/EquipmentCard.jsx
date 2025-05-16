// src/components/EquipmentCard.jsx
import React from 'react';
import PropTypes from 'prop-types';

const EquipmentCard = ({ equipment, onCardClick }) => {
  if (!equipment) return null;

  const {
    card_name,
    gag_cost,
    type,
    effect_text,
    flavor_text,
    rarity,
    image_file_name,
    edition_set // Make sure this is passed if needed for the logo
  } = equipment;

  const rarityStyles = {
    Fierce: { border: 'border-slate-400', textBgToken: 'bg-slate-900', glow: 'shadow-slate-400/30' },
    Gagatrondra: { border: 'border-sky-400', textBgToken: 'bg-blue-900', glow: 'shadow-sky-400/30' },
    Iconic: { border: 'border-indigo-400', textBgToken: 'bg-purple-900', glow: 'shadow-indigo-400/30' },
    Legendary: { border: 'border-amber-400', textBgToken: 'bg-orange-900', glow: 'shadow-amber-400/30' }
  };

  const style = rarityStyles[rarity] || rarityStyles.Fierce;
  const imageUrl = image_file_name
    ? `/assets/images/equipment_art/${image_file_name}`
    : '/assets/images/ui/placeholder_equipment.png';

  let editionLogoSrc = '/assets/images/ui/edition_logo_default_small.png'; // A generic default small icon
  let editionLogoAlt = 'Set';

  if (edition_set === "All Stars 10" || edition_set === "All Stars 10 Core Set") {
    editionLogoSrc = "/assets/images/ui/edition_logo_as10.png"; // Assuming this can be scaled down by CSS (h-5 w-5)
    editionLogoAlt = "AS10 Set";
  } else if (edition_set === "Season 17") {
    editionLogoSrc = "/assets/images/ui/edition_logo_s17.png"; // Assuming this can be scaled down
    editionLogoAlt = "S17 Set";
  }
  // Add more conditions as needed

  return (
    <div
      className={`relative w-[300px] h-[420px] rounded-xl overflow-hidden
                  border-4 ${style.border} cursor-pointer
                  transform hover:scale-105 transition-all duration-300
                  shadow-lg hover:shadow-xl ${style.glow}
                  flex flex-col`}
      onClick={() => onCardClick(equipment)}
    >
      <div className="relative flex-grow overflow-hidden">
        <img
          src={imageUrl}
          alt={card_name}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute top-0 left-0 right-0 p-3 flex justify-between items-start z-10">
          <div className="flex items-center gap-1 bg-black/60 rounded-lg backdrop-blur-sm border border-white/20 p-1.5 shadow-md">
            <img
              src={editionLogoSrc}
              alt={editionLogoAlt}
              className="h-5 w-5 object-contain" // This class controls the size
            />
            <span className="text-white/95 text-xs font-bold pr-1">{type}</span>
          </div>
          <div className={`bg-gradient-to-br from-yellow-400 to-amber-600
                           text-black font-extrabold rounded-full w-11 h-11
                           flex items-center justify-center text-lg border-2
                           border-black/50 shadow-xl`}>
            {gag_cost}
          </div>
        </div>
      </div>
      <div className={`relative z-10 p-3 mt-auto
                       ${style.textBgToken} bg-opacity-80 backdrop-blur-sm
                       border-t-2 ${style.border} border-opacity-50`}>
        <h2 className="text-lg font-serif font-bold text-white mb-1.5
                     drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] truncate" title={card_name}>
          {card_name}
        </h2>
        <div className="flex-grow mb-1.5 h-[60px] overflow-y-auto pretty-scrollbar">
          <p className="text-xs leading-snug text-white/95
                     drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
            {effect_text}
          </p>
        </div>
        {flavor_text && (
          <p className="text-xxs italic text-white/80
                     drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]
                     border-t border-white/20 pt-1.5 truncate" title={flavor_text}>
            "{flavor_text}"
          </p>
        )}
      </div>
    </div>
  );
};

EquipmentCard.propTypes = {
  equipment: PropTypes.shape({
    card_id: PropTypes.string.isRequired,
    card_name: PropTypes.string.isRequired,
    gag_cost: PropTypes.number.isRequired,
    type: PropTypes.string.isRequired,
    effect_text: PropTypes.string.isRequired,
    flavor_text: PropTypes.string,
    rarity: PropTypes.string.isRequired,
    image_file_name: PropTypes.string,
    edition_set: PropTypes.string // Ensure this prop is passed
  }).isRequired,
  onCardClick: PropTypes.func.isRequired
};

export default React.memo(EquipmentCard);