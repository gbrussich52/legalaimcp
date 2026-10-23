import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts}',
  ],
  theme: {
    extend: {
      colors: {
        navy: 'rgb(var(--rgb-navy) / <alpha-value>)',
        'warm-white': 'rgb(var(--rgb-warm-white) / <alpha-value>)',
        'gold-display': 'rgb(var(--rgb-gold-display) / <alpha-value>)',
        'gold-text': 'rgb(var(--rgb-gold-text) / <alpha-value>)',
        'navy-deep': 'rgb(var(--rgb-navy-deep) / <alpha-value>)',
        charcoal: 'rgb(var(--rgb-charcoal) / <alpha-value>)',
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
