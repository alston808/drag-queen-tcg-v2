// src/components/ui/dot-pattern.jsx
import React, { useEffect, useId, useRef, useState } from "react";

const GLITTER_COLORS = [
  '#FFD700', // gold
  '#FFF',    // white
  '#FF69B4', // pink
  '#C0C0C0', // silver
  '#F3E5F5', // light purple
];

export function DotPattern({
  width = 16,
  height = 16,
  x = 0,
  y = 0,
  cx = 1,
  cy = 1,
  cr = 1,
  className,
  glow = false, // ignored for glitter
  ...props
}) {
  const id = useId();
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Dramatic glitter: more dots, bigger, more color
  const dotCount = Math.floor((dimensions.width * dimensions.height) / 2000); // denser
  const dots = Array.from({ length: dotCount }, (_, i) => {
    const dotX = Math.random() * dimensions.width;
    const delay = Math.random() * 3;
    const duration = 3 + Math.random() * 3; // 3s to 6s
    const jitter = (Math.random() - 0.5) * 10;
    const size = cr + Math.random() * 2; // bigger
    const color = GLITTER_COLORS[Math.floor(Math.random() * GLITTER_COLORS.length)];
    return {
      x: dotX + jitter,
      delay,
      duration,
      size,
      color,
      key: `dot-${i}`,
    };
  });

  return (
    <svg
      ref={containerRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className || ""}`}
      {...props}
    >
      {dots.map((dot) => (
        <circle
          key={dot.key}
          cx={dot.x}
          cy={0}
          r={dot.size}
          fill={dot.color}
          style={{
            opacity: 1,
            filter: 'blur(0.5px) drop-shadow(0 0 2px ' + dot.color + ')',
            animation: `fallGlitter ${dot.duration}s linear ${dot.delay}s infinite`,
          }}
        />
      ))}
      <style>
        {`
          @keyframes fallGlitter {
            0% { opacity: 0; transform: translateY(-10%); }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { opacity: 0; transform: translateY(110vh); }
          }
        `}
      </style>
    </svg>
  );
}