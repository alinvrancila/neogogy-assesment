import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        background: '#141210',
        panel: '#F7F1E3',
        amber: '#D69A2D',
        green: '#2E7D4F',
        yellow: '#D9A521',
        orange: '#D9711F',
        red: '#B3261E'
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: [require('@tailwindcss/forms')]
};

export default config;
