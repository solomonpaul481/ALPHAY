/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        cream: "var(--bg-cream, #FDFCFF)",
        ink: "var(--text-ink, #1C1524)",
        ink2: "var(--text-ink2, #5B5468)",
        purple: {
          DEFAULT: "var(--color-primary, #6D28D9)",
          deep: "var(--color-primary-deep, #2E1065)",
          tint: "var(--color-primary-tint, #A78BFA)",
          50: "var(--color-primary-50, #F5F2FE)",
          100: "var(--color-primary-100, #EDE7FD)",
        },
        veg: {
          DEFAULT: "#1E7145",
          tint: "#E6F4EC",
        },
        nonveg: {
          DEFAULT: "#B23A2F",
          tint: "#FBEAE8",
        },
        gold: "#C9A227",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        soft: "0 2px 8px rgba(46,16,101,0.06), 0 8px 24px rgba(46,16,101,0.08)",
        lift: "0 6px 16px rgba(46,16,101,0.10), 0 16px 40px rgba(46,16,101,0.12)",
      },
      borderRadius: {
        card: "20px",
      },
    },
  },
  plugins: [],
};
