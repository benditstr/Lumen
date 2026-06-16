/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        app: '#0f0f0f',
        sidebar: '#161616',
        editor: '#1a1a1a',
        surface: {
          DEFAULT: '#222222',
          hover: '#2a2a2a'
        },
        border: '#2e2e2e',
        text: {
          primary: '#e8e8e6',
          secondary: '#888884'
        },
        accent: '#a78bfa'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace']
      },
      typography: {
        invert: {
          css: {
            '--tw-prose-body': '#e8e8e6',
            '--tw-prose-headings': '#e8e8e6',
            '--tw-prose-links': '#a78bfa',
            '--tw-prose-bold': '#e8e8e6',
            '--tw-prose-quotes': '#888884',
            '--tw-prose-quote-borders': '#2e2e2e',
            '--tw-prose-code': '#a78bfa',
            '--tw-prose-pre-bg': '#161616',
            '--tw-prose-hr': '#2e2e2e',
            '--tw-prose-bullets': '#888884',
            '--tw-prose-counters': '#888884'
          }
        }
      }
    }
  },
  plugins: [require('@tailwindcss/typography')]
}
