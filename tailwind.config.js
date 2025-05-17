/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1EB4E2',
          dark: '#1899C2',
        },
        secondary: {
          DEFAULT: '#2DD4BF',
          dark: '#0d9488',
        },
        dark: {
          DEFAULT: '#020420',
          light: '#16181d',
        }
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { opacity: 0.5 },
          '100%': { opacity: 0.8 },
        }
      },
      backgroundColor: {
        'card': {
          DEFAULT: 'white',
          dark: '#1f2937'
        }
      },
      borderColor: {
        'card': {
          DEFAULT: '#e5e7eb',
          dark: '#374151'
        }
      },
      textColor: {
        'card': {
          DEFAULT: '#111827',
          dark: '#f3f4f6'
        }
      }
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    function({ addUtilities }) {
      const newUtilities = {
        '.scrollbar-thin': {
          scrollbarWidth: 'thin',
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: '#f1f1f1',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#888',
            borderRadius: '3px',
            '&:hover': {
              backgroundColor: '#555',
            },
          },
        },
      }
      addUtilities(newUtilities, ['responsive', 'hover'])
    }
  ],
}