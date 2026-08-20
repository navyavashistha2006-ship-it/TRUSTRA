/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'ink-olive': '#2F3B22',
        'olive-green': '#5C6B3A',
        'deep-olive': '#47521F',
        'soft-olive': '#EEF0E2',
        'soft-olive-tint': '#EEF0E2',
        'warm-beige': '#F6F1E7',
        'cream-surface': '#FFFDF8',
        'warm-border': '#E4DCC8',
        'muted-clay': '#7A745F',
        'sage-low': '#5B8A5A',
        'amber-caution': '#C98A2E',
        'terracotta-high': '#BF5B3B',
        'brick-critical': '#9C3B2E',
      },
      fontFamily: {
        sans: ['Inter', 'Sora', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft-warm': '0 4px 20px -2px rgba(47, 59, 34, 0.06), 0 2px 8px -1px rgba(47, 59, 34, 0.04)',
        'soft-warm-lg': '0 10px 25px -3px rgba(47, 59, 34, 0.08), 0 4px 12px -2px rgba(47, 59, 34, 0.05)',
      }
    },
  },
  plugins: [],
}
