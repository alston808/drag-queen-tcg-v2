// src/components/QueenModal.jsx
import React from 'react';
import PropTypes from 'prop-types';

const QueenModal = ({ queen, onClose }) => {
  if (!queen) return null;

  // Define rarity styles for the modal
  const rarityModalStyles = {
    Fierce: {
      bg: 'bg-gradient-to-br from-slate-700 to-slate-900', // Darker, subtle
      border: 'border-slate-500',
      textAccent: 'text-slate-300',
      shadow: 'shadow-slate-500/30'
    },
    Gagatrondra: {
      bg: 'bg-gradient-to-br from-sky-700 to-blue-900',
      border: 'border-sky-500',
      textAccent: 'text-sky-300',
      shadow: 'shadow-sky-400/40'
    },
    Iconic: {
      bg: 'bg-gradient-to-br from-indigo-700 to-purple-900',
      border: 'border-indigo-500',
      textAccent: 'text-indigo-300',
      shadow: 'shadow-indigo-400/40'
    },
    Legendary: {
      bg: 'bg-gradient-to-br from-amber-600 via-orange-800 to-red-900', // More dramatic gold/orange
      border: 'border-amber-400',
      textAccent: 'text-amber-300',
      shadow: 'shadow-amber-400/50'
    },
    Default: { // Fallback
      bg: 'bg-gradient-to-br from-gray-700 to-gray-900',
      border: 'border-gray-500',
      textAccent: 'text-gray-300',
      shadow: 'shadow-gray-500/30'
    }
  };

  const currentRarityStyle = rarityModalStyles[queen.rarity] || rarityModalStyles.Default;

  const imageUrl = queen.image_file_name 
    ? `/assets/images/queens_art/${queen.image_file_name}` 
    : '/assets/images/ui/placeholder_queen.png';

  // For the full-screen image effect, we'll use a pseudo-element or a div behind the content.
  // Here, we'll make the left image panel larger and use object-cover.

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-lg flex items-center justify-center z-[250] p-2 sm:p-4 transition-opacity duration-300 ease-in-out"
      onClick={onClose} // Close when clicking backdrop
    >
      {/* Modal Content */}
      <div
        className={`relative max-w-4xl w-full max-h-[90vh] h-auto sm:h-[600px] md:h-[700px] flex flex-col sm:flex-row rounded-xl shadow-2xl overflow-hidden
                    border-2 ${currentRarityStyle.border} ${currentRarityStyle.shadow} ${currentRarityStyle.bg}`}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        {/* Left Side: Queen Image - Takes more space */}
        <div className="w-full sm:w-1/2 md:w-3/5 h-1/2 sm:h-full relative overflow-hidden group">
          <img 
            src={imageUrl} 
            alt={queen.queen_name} 
            className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-500 ease-in-out group-hover:scale-105" // Subtle zoom on hover
          />
          {/* Optional: Gradient overlay on image for text readability if name is on image */}
           <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-75"></div>
        </div>

        {/* Right Side: Details */}
        <div className="w-full sm:w-1/2 md:w-2/5 p-4 sm:p-6 flex flex-col justify-between overflow-y-auto pretty-scrollbar">
          <div> {/* Content wrapper for scrolling */}
            <div className="mb-4 text-center sm:text-left">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-extrabold text-white mb-1" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.7)' }}>
                {queen.queen_name}
              </h2>
              <p className={`text-lg md:text-xl font-semibold ${currentRarityStyle.textAccent} mb-1`}>{queen.rarity}</p>
              <p className="text-xs sm:text-sm text-soft-white/70 font-sans">Edition: {queen.edition_set}</p>
            </div>
            
            <div className="mb-3 sm:mb-4 flex justify-center sm:justify-start">
                <div className={`bg-gold text-black font-extrabold rounded-full w-10 h-10 md:w-12 md:h-12 flex items-center justify-center text-xl md:text-2xl border-2 border-black/40 shadow-md font-sans`}>
                    {queen.gag_cost}
                </div>
            </div>

            <div className="mb-3 sm:mb-5">
              <h3 className="text-xl md:text-2xl font-serif font-bold text-gold mb-2" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>Stats</h3>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm sm:text-base text-soft-white/90 font-sans">
                <p><span className="font-semibold text-orchid">Charisma:</span> {queen.charisma}</p>
                <p><span className="font-semibold text-deep-sky-blue">Uniqueness:</span> {queen.uniqueness}</p>
                <p><span className="font-semibold text-hot-pink">Nerve:</span> {queen.nerve}</p>
                <p><span className="font-semibold text-dark-orange">Talent:</span> {queen.talent}</p>
              </div>
            </div>

            <div className="mb-3 sm:mb-5">
              <h3 className="text-xl md:text-2xl font-serif font-bold text-gold mb-1.5" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
                {queen.special_power_name || "Special Power"}
              </h3>
              <p className="text-xs sm:text-sm text-soft-white/95 leading-relaxed font-sans">{queen.special_power_text}</p>
            </div>

            {queen.flavor_text && (
              <div className="mt-auto pt-3 border-t border-white/20">
                <h3 className="text-md sm:text-lg font-serif font-semibold text-hot-pink/80 mb-1" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.4)' }}>Flavor</h3>
                <p className="text-xs sm:text-sm italic text-soft-white/80 leading-relaxed font-sans">"{queen.flavor_text}"</p>
              </div>
            )}
          </div>
          
          {/* Close button at the bottom of the right panel */}
          <div className="mt-5 text-center sm:text-right">
            <button 
              onClick={onClose} 
              className={`btn-primary py-2 px-6 text-base sm:text-lg ${currentRarityStyle.border} hover:bg-opacity-80`} // Style with rarity
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

QueenModal.propTypes = {
  queen: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default QueenModal;
