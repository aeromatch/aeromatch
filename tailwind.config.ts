import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary palette - Deep navy blues
        navy: {
          950: '#0B132B',
          900: '#1A2642',
          800: '#263666',
          700: '#334C88',
          600: '#4066AA',
        },
        // Secondary - Steel blues/grays for text and borders
        steel: {
          800: '#3A4A6B',
          700: '#4A5C7A',
          600: '#5A6E8A',
          500: '#6B809A',
          400: '#8899AA',
          300: '#A5B4C4',
          200: '#C2CED9',
          100: '#E0E6EC',
        },
        // Accent - Technical gold
        gold: {
          600: '#8B7355',
          500: '#C9A24D',
          400: '#D4B366',
          300: '#E0C580',
          200: '#EBD799',
        },
        // Status colors - Muted, professional
        success: {
          600: '#2D6A4F',
          500: '#40916C',
          400: '#52B788',
        },
        warning: {
          600: '#B07D2B',
          500: '#D4A03D',
          400: '#E6B84F',
        },
        error: {
          600: '#9B2C2C',
          500: '#C53030',
          400: '#E53E3E',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
export default config

