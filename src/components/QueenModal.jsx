// src/components/QueenModal.jsx
import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

const QueenModal = ({ slot, onClose }) => {
  const [activeTab, setActiveTab] = useState('stats');
  const modalRef = useRef(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  if (!slot || !slot.queen) return null;
  const queen = slot.queen;
  const equipment = slot.equipment;
  const stats = slot.stats;

  const imageUrl = queen.image_file_name 
    ? `/assets/images/queens_art/${queen.image_file_name}` 
    : '/assets/images/ui/placeholder_queen.png';

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div 
        ref={modalRef}
        className="relative w-full max-w-6xl mx-auto my-4 transform transition-all duration-300 ease-out"
      >
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute -top-4 -right-4 bg-red-600 hover:bg-red-700 text-white w-10 h-10 rounded-full flex items-center justify-center text-2xl font-bold shadow-lg transition-colors duration-200 z-10 hover:scale-110"
          aria-label="Close modal"
        >
          ×
        </button>

        {/* Main content */}
        <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-gray-900 to-black shadow-2xl">
          {/* Queen Image - Full width background with loading state */}
          <div className="relative w-full aspect-[3/4] max-h-[85vh] bg-gray-900">
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            <img 
              src={imageUrl}
              alt={queen.queen_name}
              className={`w-full h-full object-contain transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImageLoaded(true)}
            />
            
            {/* Gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
            
            {/* Queen info overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gold to-yellow-200">
                  {queen.queen_name}
                </h2>
                {typeof queen.gag_cost === 'number' && (
                  <span className="bg-gradient-to-r from-yellow-500 to-amber-600 text-black text-sm px-3 py-1.5 rounded-full border border-yellow-400/50 font-bold shadow-lg">
                    Gag: {queen.gag_cost}
                  </span>
                )}
                {queen.edition_set && (
                  <span className="bg-gradient-to-r from-purple-500/30 to-purple-700/30 text-purple-200 text-sm px-3 py-1.5 rounded-full border border-purple-500/30">
                    {queen.edition_set}
                  </span>
                )}
              </div>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {['charisma', 'uniqueness', 'nerve', 'talent'].map((stat, idx) => {
                  const statColors = [
                    'from-red-500 to-pink-500', // Charisma
                    'from-purple-500 to-indigo-500', // Uniqueness
                    'from-blue-500 to-cyan-500', // Nerve
                    'from-green-500 to-emerald-500' // Talent
                  ];
                  const statNames = ['Charisma', 'Uniqueness', 'Nerve', 'Talent'];
                  const base = queen[stat] ?? 0;
                  const current = stats[stat] ?? 0;
                  const boost = current - base;
                  return (
                    <div key={stat} className="bg-gradient-to-br from-black/80 to-black/60 p-4 rounded-xl backdrop-blur-sm border border-white/10 shadow-lg hover:shadow-xl transition-shadow duration-200">
                      <h3 className={`text-transparent bg-clip-text bg-gradient-to-r ${statColors[idx]} font-bold mb-2`}>
                        {statNames[idx]}
                      </h3>
                      <div className="flex items-center gap-2">
                        {boost > 0 && (
                          <span className="line-through text-gray-400 text-lg">{base}</span>
                        )}
                        <span className={`text-3xl font-bold ${boost > 0 ? 'text-white' : 'text-transparent bg-clip-text bg-gradient-to-r ' + statColors[idx]}`}>{current}</span>
                        {boost > 0 && (
                          <span className="ml-1 text-lime-400 text-lg font-bold animate-pulse">(+{boost})</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Equipment Section */}
              {equipment && equipment.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 mb-3">
                    Equipment
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {equipment.map((eq, index) => (
                      <div 
                        key={eq.instanceId || index}
                        className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 p-4 rounded-xl backdrop-blur-sm border border-blue-500/20 shadow-lg hover:shadow-xl transition-all duration-200 hover:border-blue-500/40"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-blue-300 text-lg">{eq.card_name}</h4>
                          <span className="text-xs bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-3 py-1 rounded-full font-bold">
                            {eq.type}
                          </span>
                        </div>
                        <p className="text-soft-white text-sm leading-relaxed">{eq.effect_text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Special Power */}
              {queen.special_power_name && (
                <div className="mt-6 bg-gradient-to-r from-purple-900/50 to-purple-800/30 p-5 rounded-xl backdrop-blur-sm border border-purple-500/20 shadow-lg">
                  <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-300 mb-2">
                    {queen.special_power_name}
                  </h3>
                  <p className="text-soft-white text-lg leading-relaxed">{queen.special_power_text}</p>
                </div>
              )}
            </div>

            {/* Shade Tokens Badge */}
            {queen.shadeTokens > 0 && (
              <div className="absolute top-4 left-4 bg-gradient-to-br from-red-600 to-red-800 text-white text-sm font-bold rounded-full px-4 py-1.5 shadow-lg border border-red-500/50 backdrop-blur-sm">
                {queen.shadeTokens} Shade Tokens
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

QueenModal.propTypes = {
  slot: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default QueenModal;
