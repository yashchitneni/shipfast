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
        // Landing page animations
        'fade-in-up': 'fadeInUp 1.2s ease-out forwards',
        'fade-in-delayed': 'fadeInDelayed 2s ease-out forwards',
        'pan-slow': 'panSlow 60s ease-in-out infinite',
        'pulse-lane': 'pulseLane 4s ease-in-out infinite',
        'pulse-lane-delayed': 'pulseLaneDelayed 5s ease-in-out infinite',
        'pulse-lane-slow': 'pulseLaneSlow 6s ease-in-out infinite',
        'port-pulse': 'portPulse 3s ease-in-out infinite',
        'port-pulse-delayed': 'portPulseDelayed 3s ease-in-out infinite 1s',
        'port-pulse-slow': 'portPulseSlow 4s ease-in-out infinite 2s',
        'port-throb': 'portThrob 2s ease-in-out infinite',
        'port-throb-delayed': 'portThrobDelayed 2.5s ease-in-out infinite 0.5s',
        'port-throb-slow': 'portThrobSlow 3s ease-in-out infinite 1s',
        'shimmer': 'shimmer 8s ease-in-out infinite',
        'orbit-slow': 'orbitSlow 120s linear infinite',
        'orbit-medium': 'orbitMedium 90s linear infinite',
        'orbit-fast': 'orbitFast 60s linear infinite',
        'spin-very-slow': 'spinVerySlow 20s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        // Landing page keyframes
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDelayed: {
          '0%, 60%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        panSlow: {
          '0%': { transform: 'translateX(0) translateY(0)' },
          '25%': { transform: 'translateX(-10px) translateY(-5px)' },
          '50%': { transform: 'translateX(-5px) translateY(-10px)' },
          '75%': { transform: 'translateX(5px) translateY(-5px)' },
          '100%': { transform: 'translateX(0) translateY(0)' },
        },
        pulseLane: {
          '0%, 100%': { opacity: '0.1' },
          '50%': { opacity: '0.6' },
        },
        pulseLaneDelayed: {
          '0%, 30%, 100%': { opacity: '0.05' },
          '65%': { opacity: '0.4' },
        },
        pulseLaneSlow: {
          '0%, 100%': { opacity: '0.05' },
          '50%': { opacity: '0.3' },
        },
        portPulse: {
          '0%, 100%': { 
            opacity: '0.4', 
            transform: 'scale(1)',
            boxShadow: '0 0 5px rgba(255, 215, 0, 0.3)',
          },
          '50%': { 
            opacity: '1', 
            transform: 'scale(1.2)',
            boxShadow: '0 0 20px rgba(255, 215, 0, 0.8)',
          },
        },
        portPulseDelayed: {
          '0%, 40%, 100%': { 
            opacity: '0.4', 
            transform: 'scale(1)',
            boxShadow: '0 0 5px rgba(255, 215, 0, 0.3)',
          },
          '70%': { 
            opacity: '1', 
            transform: 'scale(1.2)',
            boxShadow: '0 0 20px rgba(255, 215, 0, 0.8)',
          },
        },
        portPulseSlow: {
          '0%, 100%': { 
            opacity: '0.3', 
            transform: 'scale(1)',
            boxShadow: '0 0 5px rgba(255, 215, 0, 0.2)',
          },
          '50%': { 
            opacity: '0.8', 
            transform: 'scale(1.1)',
            boxShadow: '0 0 15px rgba(255, 215, 0, 0.6)',
          },
        },
        portThrob: {
          '0%, 100%': { 
            opacity: '0.6', 
            transform: 'scale(1)',
            boxShadow: '0 0 10px rgba(255, 215, 0, 0.4)',
          },
          '50%': { 
            opacity: '1', 
            transform: 'scale(1.5)',
            boxShadow: '0 0 25px rgba(255, 215, 0, 1)',
          },
        },
        portThrobDelayed: {
          '0%, 100%': { 
            opacity: '0.5', 
            transform: 'scale(1)',
            boxShadow: '0 0 8px rgba(255, 215, 0, 0.3)',
          },
          '50%': { 
            opacity: '0.9', 
            transform: 'scale(1.4)',
            boxShadow: '0 0 20px rgba(255, 215, 0, 0.9)',
          },
        },
        portThrobSlow: {
          '0%, 100%': { 
            opacity: '0.4', 
            transform: 'scale(1)',
            boxShadow: '0 0 6px rgba(255, 215, 0, 0.2)',
          },
          '50%': { 
            opacity: '0.8', 
            transform: 'scale(1.3)',
            boxShadow: '0 0 18px rgba(255, 215, 0, 0.7)',
          },
        },
        shimmer: {
          '0%, 100%': { opacity: '0.03' },
          '50%': { opacity: '0.08' },
        },
        orbitSlow: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        orbitMedium: {
          '0%': { transform: 'rotate(360deg)' },
          '100%': { transform: 'rotate(0deg)' },
        },
        orbitFast: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        spinVerySlow: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
    },
  },
  plugins: [],
}

export default config