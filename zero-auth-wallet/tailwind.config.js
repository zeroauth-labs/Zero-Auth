/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: '#1a1b26',
        foreground: '#a9b1d6',
        primary: '#7aa2f7',
        secondary: '#bb9af7',
        success: '#9ece6a',
        warning: '#e0af68',
        error: '#f7768e',
        card: '#16161e',
        border: '#565f89',
        'muted-foreground': '#9aa5ce', // Lighter for better visibility
      },
    },
  },
  plugins: [],
}

