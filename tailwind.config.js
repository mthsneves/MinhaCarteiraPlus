module.exports = {
  content: ["./src/app/**/*.{js,jsx,ts,tsx}", "./src/components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        ink: '#05080B',
        carbon: '#0E1418',
        steel: '#171F25',
        line: 'rgba(255, 255, 255, 0.09)',
        cyan: '#22D8F0',
        'cyan-dim': '#0C7E93',
        'cyan-ink': '#04232A',
        'text-1': '#F2F6F7',
        'text-2': '#8FA3AB',
        'text-3': '#5A6970',
        mint: '#3EDC9A',
        coral: '#FF7A6E',
      }
    },
  },
  plugins: [],
}
