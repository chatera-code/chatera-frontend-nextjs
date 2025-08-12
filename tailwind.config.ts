import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Google Sans"', 'sans-serif'],
        mono: ['"Roboto Mono"', 'monospace'],
      },
      colors: {
        'background': '#FFFFFF', // GitHub's main background
        'sidebar-bg': '#F6F8FA', // GitHub's light grey for sidebars
        'user-message-bg': '#F6F8FA', // Matching grey for user messages
        'primary-accent': '#24292E', // Dark grey for primary actions
        'secondary-accent': '#D1D5DA', // Lighter gray for borders and dividers
        'hover-accent': '#F3F4F6', // A slightly off-white for hover states
        'primary-text': '#24292E', // Main text color
        'secondary-text': '#586069', // Secondary text color
        'muted-text': '#6A737D', // Muted text for less important info
        'border-color': '#E1E4E8', // Standard border color
        'input-bg': '#FAFBFC', // Input background color
      },
      borderRadius: {
        'card': '6px', // GitHub uses slightly less rounded corners
        'button': '6px',
        'chat-input': '6px',
        'message-bubble': '12px',
      },
      boxShadow: {
        'sidebar': '0 1px 0 rgba(27, 31, 35, 0.04)',
        'message': '0 1px 2px rgba(0, 0, 0, 0.05)',
        // 'input-focus': '0 0 0 3px rgba(3, 102, 214, 0.3)',
      },
    },
  },
  plugins: [],
}
export default config
