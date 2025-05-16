// src/components/GameLog.jsx
import React, { useRef, useEffect } from 'react';

const GameLog = ({ logEntries }) => {
  const logEndRef = useRef(null);

  // Scroll to the bottom of the log when new entries are added
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logEntries]);

  return (
    <div className="mb-4 p-3 bg-dark-glass rounded-lg min-h-[100px] max-h-[150px] overflow-y-auto pretty-scrollbar border border-white/10">
      <h3 className="text-lg font-semibold mb-2 text-gold sticky top-0 bg-dark-glass z-10">
        Game Log
      </h3>
      {logEntries && logEntries.length > 0 ? (
        logEntries.map((entry, index) => (
          <p
            key={index}
            className={`text-sm mb-1 ${
              entry.includes('[REDUCER_LOG]') ? 'text-purple-300 opacity-70' : // Style reducer logs differently
              entry.includes('Error') || entry.includes('ERROR') ? 'text-red-400 font-semibold' :
              entry.includes('Warn') || entry.includes('WARN') ? 'text-yellow-400' :
              entry.includes('[CPU') ? 'text-sky-300 opacity-80' : // Style CPU logs
              entry.includes('[Game Flow]') || entry.includes('[Phase Effect]') ? 'text-gray-400 opacity-75 italic' : // Style flow logs
              'opacity-90'
            }`}
          >
            {/* Optionally remove prefixes for cleaner UI display */}
            {entry.replace(/\[REDUCER_LOG\]\s*|\[Game Flow\]\s*|\[Phase Effect\]\s*|\[CPU Logic\]\s*|\[CPU Effect\]\s*/, '')}
          </p>
        ))
      ) : (
        <p className="text-sm text-gray-500 italic">Log is empty.</p>
      )}
      <div ref={logEndRef} />
    </div>
  );
};

export default GameLog;