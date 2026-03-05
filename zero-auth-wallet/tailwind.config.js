/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: '#7aa2f7',
        secondary: '#bb9af7',
        success: '#9ece6a',
        warning: '#e0af68',
        error: '#f7768e',
        card: 'var(--card)',
        border: 'var(--border)',
        'muted-foreground': 'var(--muted-foreground)',
      },
    },
  },
  plugins: [],
}

