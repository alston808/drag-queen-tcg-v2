// src/components/EquipmentModal.jsx
import React from 'react';

const EquipmentModal = ({ equipment, onClose }) => {
  if (!equipment) return null;

  const rarityBackgroundClasses = { /* ... same as before ... */ };
  const rarityTextColors = { /* ... same as before ... */ };
  const imageUrl = equipment.image_file_name ? `/assets/images/equipment_art/${equipment.image_file_name}` : '/assets/images/ui/placeholder_equipment.png';

  return (
    <div
      className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-[250] p-4 transition-opacity duration-300 ease-in-out"
      onClick={onClose}
    >
      <div
        className="bg-content-bg bg-dark-glass rounded-xl shadow-modal max-w-xl w-full max-h-[85vh] flex flex-col overflow-hidden border-2 border-white/20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`p-5 sm:p-6 flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 ${rarityBackgroundClasses[equipment.rarity] || 'bg-gray-700'}`}>
          <div className="w-32 h-32 sm:w-40 sm:h-40 flex-shrink-0 rounded-lg border-2 border-white/30 shadow-lg overflow-hidden bg-black/20 flex items-center justify-center">
            <img src={imageUrl} alt={equipment.card_name} className="max-w-full max-h-full object-contain" />
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-soft-white mb-1" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.7)' }}>
              {equipment.card_name}
            </h2>
            <p className={`text-lg font-semibold ${rarityTextColors[equipment.rarity] || 'text-gray-300'} mb-1`}>{equipment.rarity}</p>
            <p className="text-md text-soft-white/80 font-sans mb-1">Type: {equipment.type}</p>
            <div className="mt-2 bg-gold text-black font-extrabold rounded-full w-10 h-10 flex items-center justify-center text-xl border-2 border-black/40 shadow-md font-sans mx-auto sm:mx-0">
              {equipment.gag_cost}
            </div>
          </div>
        </div>
        <div className="p-5 sm:p-6 overflow-y-auto modal-content pretty-scrollbar flex-grow">
          <h3 className="text-2xl font-serif font-bold text-gold mb-2" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>Effect</h3>
          <p className="text-sm sm:text-base text-soft-white/95 mb-6 leading-relaxed font-sans">{equipment.effect_text}</p>
          {equipment.flavor_text && (
            <>
              <h3 className="text-xl font-serif font-semibold text-hot-pink mb-1" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.4)' }}>Flavor</h3>
              <p className="text-sm italic text-soft-white/80 leading-relaxed font-sans">"{equipment.flavor_text}"</p>
            </>
          )}
        </div>
        <div className="p-4 sm:p-5 border-t border-white/10 text-right">
          <button onClick={onClose} className="btn-primary">Close</button>
        </div>
      </div>
    </div>
  );
};

export default EquipmentModal;
