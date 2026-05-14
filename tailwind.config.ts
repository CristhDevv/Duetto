import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: '#111111',
        secondary: '#6B6B6B',
        accent: '#7C6AF7',
        'accent-light': '#F0EEFF',
        border: '#EBEBEB',
        surface: '#F7F7F7',
        success: '#2DD4A7',
        danger: '#F87171',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
}

export default config
