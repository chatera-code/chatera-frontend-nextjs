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
        'background': '#FFFFFF', // Pure white main background
        'sidebar-bg': '#F7F7F7', // Light grey for sidebars and user message
        'user-message-bg': '#F7F7F7', // Grey for user's message bubble
        'primary-accent': '#6B7280', // Medium gray for primary actions/hovers
        'secondary-accent': '#E5E7EB', // Lighter gray for active items (replaces light blue)
        'hover-accent': '#E5E7EB', // Darker shade of gray for hover
        'primary-text': '#1F2937', // Dark gray for main text
        'secondary-text': '#6B7280', // Medium gray for secondary text
        'muted-text': '#9CA3AF', // Light gray for muted text
        'border-color': '#E5E7EB',
      },
      borderRadius: {
        'card': '12px',
        'button': '8px',
        'chat-input': '20px',
        'message-bubble': '18px',
      },
      boxShadow: {
        'sidebar': '0 1px 2px rgba(0, 0, 0, 0.03)',
        'message': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'input-focus': '0 0 0 3px rgba(107, 114, 128, 0.2)',
      },
    },
  },
  plugins: [],
}
export default config
