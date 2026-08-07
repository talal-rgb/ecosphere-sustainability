/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './*.html',
    './{about,analytics-dashboard,carbon-accounting,carbon-accounting-readiness-assessment,certificate,contact,esg-reporting,platform,privacy,quiz,resources,sustainability-intelligence,terms,tools,training}/**/*.html',
    './assets/js/**/*.js',
    './components/**/*.html',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        body: ['ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        terrnix: {
          bg: '#0a0f0d',
          'bg-secondary': '#111a16',
          'bg-tertiary': '#1a2520',
          border: '#2d3d35',
          emerald: '#10b981',
          'emerald-light': '#34d399',
          cyan: '#06b6d4',
          'cyan-light': '#22d3ee',
        },
        tn: {
          bg: '#0a0f0d',
          surface: '#111a16',
          elevated: '#1a2620',
          border: '#2d3d35',
          'border-hover': '#3d5a4a',
          emerald: '#34d399',
          'emerald-dark': '#10b981',
          'emerald-darker': '#059669',
          cyan: '#22d3ee',
          'cyan-dark': '#06b6d4',
          text: '#ffffff',
          'text-secondary': '#9ca3af',
          'text-muted': '#6b7280',
        },
      },
    },
  },
  plugins: [],
};
