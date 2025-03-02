module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ConnectU modern dark theme with Duke blue
        connectu: {
          primary: '#012169', // Duke Blue
          dark: '#001A57',    // Darker Duke Blue
          light: '#E6EEFF',   // Light blue
          accent: '#00539B',  // Light Duke Blue
          background: {
            dark: '#111827',  // Gray-900
            darker: '#030712', // Gray-950
            light: '#F9FAFB',  // Gray-50
          },
          text: {
            light: '#F9FAFB',  // Gray-50
            dark: '#111827',   // Gray-900
            muted: '#9CA3AF',  // Gray-400
          }
        },
        // Define duke colors directly for utility classes
        'duke-blue': '#012169',     // Original Duke Blue
        'duke-darkblue': '#001A57', // Original Dark Duke Blue
        'duke-lightblue': '#00539B', // Original Light Duke Blue
        duke: {
          navy: '#003366',     // Original Navy
          accent: '#C84E00',   // Original Duke Orange Accent
          gray: '#4B5563',     // Gray-600
          lightgray: '#F9FAFB', // Gray-50
        },
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      boxShadow: {
        'form-card': '0 8px 20px -4px rgba(0, 0, 0, 0.2), 0 4px 10px -2px rgba(0, 0, 0, 0.15)',
      },
    },
  },
  plugins: [],
} 