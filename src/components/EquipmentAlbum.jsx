// src/components/EquipmentAlbum.jsx
import React, { useState, useEffect, useMemo } from 'react';
import EquipmentCard from './EquipmentCard';
import EquipmentModal from './EquipmentModal';

// Helper to get unique values for filters (can be moved to a utils file)
const getUniqueValues = (items, key) => {
  if (!items || items.length === 0) return [];
  const values = items.map(item => item[key]).filter(Boolean);
  return [...new Set(values)].sort();
};

const EquipmentAlbum = ({ allEquipment }) => {
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [editionFilter, setEditionFilter] = useState('All');
  const [rarityFilter, setRarityFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All'); // Added type filter

  const editions = useMemo(() => getUniqueValues(allEquipment, 'edition_set'), [allEquipment]);
  const rarities = useMemo(() => getUniqueValues(allEquipment, 'rarity'), [allEquipment]);
  const types = useMemo(() => getUniqueValues(allEquipment, 'type'), [allEquipment]); // Get unique types

  const openModal = (equipment) => {
    setSelectedEquipment(equipment);
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      setSelectedEquipment(null);
      document.body.style.overflow = 'auto';
    }, 300);
  };

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.keyCode === 27 && isModalOpen) closeModal();
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'auto';
    };
  }, [isModalOpen]);

  const filteredEquipment = useMemo(() => {
    if (!allEquipment) return [];
    return allEquipment.filter(item => {
      const editionMatch = editionFilter === 'All' || item.edition_set === editionFilter;
      const rarityMatch = rarityFilter === 'All' || item.rarity === rarityFilter;
      const typeMatch = typeFilter === 'All' || item.type === typeFilter;
      return editionMatch && rarityMatch && typeMatch;
    });
  }, [allEquipment, editionFilter, rarityFilter, typeFilter]);

  if (!allEquipment || allEquipment.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-2xl text-orchid font-serif">Loading Equipment...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-2 py-6 sm:px-4 sm:py-8">
      <header className="text-center mb-6 sm:mb-10">
        <div className="inline-block bg-purple-glass border-2 border-white/40 rounded-lg p-3 sm:p-4 shadow-glamour mx-auto">
          <h1 className="text-3xl sm:text-4xl font-serif font-extrabold text-gold tracking-wider" style={{ textShadow: '2px 2px 3px rgba(0,0,0,0.5)' }}>
            THE ARMORY
          </h1>
        </div>
        {/* Filter UI */}
        <div className="flex flex-col sm:flex-row flex-wrap justify-center items-center gap-4 sm:gap-6 mb-6 sm:mb-8 p-3 bg-dark-glass rounded-lg border border-white/10 shadow-md">
          {/* Edition Filter */}
          <div className="flex items-center gap-2">
            <label htmlFor="eqEditionFilter" className="text-sm font-medium text-soft-white/80">Edition:</label>
            <select
              id="eqEditionFilter"
              value={editionFilter}
              onChange={(e) => setEditionFilter(e.target.value)}
              className="bg-deep-pink/30 border border-hot-pink/50 text-soft-white text-sm rounded-lg focus:ring-hot-pink focus:border-hot-pink block p-2.5 placeholder-gray-400 shadow-sm"
            >
              <option value="All">All Editions</option>
              {editions.map(edition => (
                <option key={edition} value={edition}>{edition}</option>
              ))}
            </select>
          </div>
          {/* Rarity Filter */}
          <div className="flex items-center gap-2">
            <label htmlFor="eqRarityFilter" className="text-sm font-medium text-soft-white/80">Rarity:</label>
            <select
              id="eqRarityFilter"
              value={rarityFilter}
              onChange={(e) => setRarityFilter(e.target.value)}
              className="bg-deep-pink/30 border border-hot-pink/50 text-soft-white text-sm rounded-lg focus:ring-hot-pink focus:border-hot-pink block p-2.5 placeholder-gray-400 shadow-sm"
            >
              <option value="All">All Rarities</option>
              {rarities.map(rarity => (
                <option key={rarity} value={rarity}>{rarity}</option>
              ))}
            </select>
          </div>
          {/* Type Filter */}
          <div className="flex items-center gap-2">
            <label htmlFor="eqTypeFilter" className="text-sm font-medium text-soft-white/80">Type:</label>
            <select
              id="eqTypeFilter"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-deep-pink/30 border border-hot-pink/50 text-soft-white text-sm rounded-lg focus:ring-hot-pink focus:border-hot-pink block p-2.5 placeholder-gray-400 shadow-sm"
            >
              <option value="All">All Types</option>
              {types.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {filteredEquipment.length > 0 ? (
        <div className="flex flex-wrap justify-center items-stretch gap-4 sm:gap-5">
          {filteredEquipment.map((item) => (
            <EquipmentCard
              key={item.card_id}
              equipment={item}
              onCardClick={() => openModal(item)}
            />
          ))}
        </div>
      ) : (
         <p className="text-center text-xl text-orchid py-8">No equipment matches your current filters, darling!</p>
      )}

      {isModalOpen && selectedEquipment && (
          <EquipmentModal equipment={selectedEquipment} onClose={closeModal} />
      )}
    </div>
  );
};

export default EquipmentAlbum;
