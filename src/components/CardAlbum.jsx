// src/components/CardAlbum.jsx
import React, { useState, useEffect, useMemo } from 'react';
import QueenCard from './QueenCard';
import QueenModal from './QueenModal';

// Helper to get unique values for filters
const getUniqueValues = (items, key) => {
  if (!items || items.length === 0) return [];
  const values = items.map(item => item[key]).filter(Boolean); // Filter out undefined/null
  return [...new Set(values)].sort();
};

const CardAlbum = ({ allQueens }) => {
  const [selectedQueenForModal, setSelectedQueenForModal] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [editionFilter, setEditionFilter] = useState('All');
  const [rarityFilter, setRarityFilter] = useState('All');

  // Memoize unique values for filters to prevent re-calculation on every render
  const editions = useMemo(() => getUniqueValues(allQueens, 'edition_set'), [allQueens]);
  const rarities = useMemo(() => getUniqueValues(allQueens, 'rarity'), [allQueens]);

  const openModal = (queenData) => {
    setSelectedQueenForModal(queenData);
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      setSelectedQueenForModal(null);
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

  const filteredQueens = useMemo(() => {
    if (!allQueens) return [];
    return allQueens.filter(queen => {
      const editionMatch = editionFilter === 'All' || queen.edition_set === editionFilter;
      const rarityMatch = rarityFilter === 'All' || queen.rarity === rarityFilter;
      return editionMatch && rarityMatch;
    });
  }, [allQueens, editionFilter, rarityFilter]);

  if (!allQueens || allQueens.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-2xl text-orchid">Loading Queens or No Queens Available...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-2 py-6 sm:px-4 sm:py-8">
      <header className="text-center mb-6 sm:mb-10">
        <div className="inline-block bg-pink-glass border-2 border-white/40 rounded-lg p-4 shadow-glamour mx-auto mb-5">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gold tracking-wider" style={{ textShadow: '2px 2px 3px rgba(0,0,0,0.5)' }}>
            THE QUEEN'S GALLERY
          </h1>
        </div>
        {/* Filter UI */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6 mb-6 sm:mb-8 p-3 bg-dark-glass rounded-lg border border-white/10 shadow-md">
          {/* Edition Filter */}
          <div className="flex items-center gap-2">
            <label htmlFor="editionFilter" className="text-sm font-medium text-soft-white/80">Edition:</label>
            <select
              id="editionFilter"
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
            <label htmlFor="rarityFilter" className="text-sm font-medium text-soft-white/80">Rarity:</label>
            <select
              id="rarityFilter"
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
        </div>
      </header>

      {filteredQueens.length > 0 ? (
        <div className="flex flex-wrap justify-center items-stretch gap-4 sm:gap-5">
          {filteredQueens.map((queen) => (
            <QueenCard
              key={queen.card_id}
              {...queen}
              onClick={() => openModal(queen)}
            />
          ))}
        </div>
      ) : (
        <p className="text-center text-xl text-orchid py-8">No queens match your current filters, henny!</p>
      )}

      {isModalOpen && selectedQueenForModal && (
        <QueenModal
          queen={selectedQueenForModal}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

export default CardAlbum;
