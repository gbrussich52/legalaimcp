import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts}',
  ],
  theme: {
    extend: {
      colors: {
        navy: '#0F172A',
        'warm-white': '#FAFAF8',
        'gold-display': '#B8860B',
        'gold-text': '#7A5200',
        charcoal: '#334155',
      },
      fontFamily: {
        display: ['var(--font-fraunces)', 'Georgia', 'serif'],
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        body: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        content: '800px',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};

export default config;
