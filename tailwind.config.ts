import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary Colors from Visual Style Guide
        'ocean-blue': '#0077BE',
        'cargo-green': '#228B22',
        'alert-red': '#DC143C',
        'gold-yellow': '#FFD700',
        'neutral-gray': '#808080',
        
        // Secondary Colors
        'port-orange': '#FF4500',
        'sky-blue': '#87CEEB',
        'earth-brown': '#A0522D',
        
        // UI Colors
        'dashboard-blue': '#1E90FF',
        'highlight-green': '#32CD32',
        'warning-yellow': '#FFFF00',
      },
      fontFamily: {
        sans: ['Arial', 'Helvetica', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}

export default config