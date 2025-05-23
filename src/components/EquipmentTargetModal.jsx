import React from 'react';
import QueenCard from './QueenCard';

const EquipmentTargetModal = ({ 
  isOpen, 
  onClose, 
  equipment, 
  playerQueens, 
  onSelectQueen,
  playerName,
  onActivatePower,
  gameState,
  owner
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-dark-glass p-6 rounded-xl border border-white/10 max-w-2xl w-full mx-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gold mb-2">Select Target Queen</h2>
            <p className="text-soft-white mb-4">
              Choose a queen to equip with {equipment?.card_name}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-soft-white hover:text-white text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-semibold text-blue-300 mb-2">{playerName}'s Runway</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {playerQueens.filter(slot => slot.queen).map(slot => (
              <div 
                key={slot.queen.instanceId}
                className="transform transition-transform hover:scale-105 cursor-pointer"
                onClick={() => onSelectQueen(slot.queen.instanceId)}
              >
                <QueenCard slot={slot} onActivatePower={onActivatePower} gameState={gameState} owner={owner} />
                {slot.equipment && slot.equipment.length > 0 && (
                  <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs font-bold rounded-full px-2 py-1">
                    {slot.equipment.length} E
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-4">
          <button 
            onClick={onClose}
            className="btn-secondary"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default EquipmentTargetModal; 