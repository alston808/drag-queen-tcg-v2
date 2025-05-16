// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // Ensures all JS/TS/JSX/TSX files in src are scanned
  ],
  theme: {
    extend: {
      // Your existing theme extensions are good.
      // You can keep them or modify as needed.
      // Example:
      colors: {
        'deep-pink': '#FF1493',
        'hot-pink': '#FF69B4',
        'orchid': '#DA70D6',
        'medium-purple': '#9370DB',
        'blue-violet': '#8A2BE2',
        'deep-sky-blue': '#00BFFF',
        'steel-blue': '#4682B4',
        'gold': '#FFD700',
        'dark-orange': '#FF8C00',
        'soft-white': '#F5F5F5',
        'content-bg': 'rgba(10, 5, 20, 0.85)', // For modal background
      },
      fontFamily: {
        sans: ['Montserrat', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      fontSize: {
          'xxs': '.65rem',

      },
      boxShadow: {
        'glamour': '0 10px 20px rgba(255, 20, 147, 0.3), 0 6px 6px rgba(147, 112, 219, 0.25)',
        'card-hover': '0 0 30px rgba(255, 105, 180, 0.8), 0 0 20px rgba(218, 112, 214, 0.6)',
        'modal': '0 0 40px rgba(0, 0, 0, 0.5)',
      },
      backgroundImage: {
        'rarity-fierce': 'linear-gradient(to bottom right, #78716c, #a8a29e)', // Stone/Silver
        'rarity-gagatrondra': 'linear-gradient(to bottom right, #60a5fa, #3b82f6)', // Blue
        'rarity-iconic': 'linear-gradient(to bottom right, #c084fc, #a855f7)', // Purple
        'rarity-legendary': 'linear-gradient(to bottom right, #facc15, #eab308, #fbbf24)', // Gold
      }
    },
  },
  plugins: [
    // You can add Tailwind plugins here if needed, e.g., @tailwindcss/forms, @tailwindcss/typography
  ],
}
